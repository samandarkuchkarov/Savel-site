import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminAssetUrl,
  adminUploadImage,
  type AdminCategory,
  type AdminCheckupCollection,
  type AdminCollection,
} from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import { trFields } from '@/lib/trFields';
import CategoryForm from '../CategoryForm';
import { matchesText, sliceList } from '@/lib/listSlice';
import { listHref, parseListQuery, type RawListParams } from '../../listQuery';
import { ListSearch } from '../../ListToolbar';
import Pagination from '../../Pagination';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawListParams>;
};

async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  const id = String(formData.get('id'));
  // try — только вокруг работы; redirect ниже кидает NEXT_REDIRECT.
  try {
    const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
    const currentImageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
    await adminApi(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        subtitle: String(formData.get('subtitle') ?? '').trim(),
        ...trFields(formData, 'title', 'subtitle'),
        imageUrl: uploadedImageUrl ?? currentImageUrl,
        sort: Number(formData.get('sort') ?? 0),
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

async function deleteCategory(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await adminApi(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

/**
 * Порядок внутри категории. Подборки и чек-апы — РАЗНЫЕ таблицы со своим sort,
 * и в приложении категория показывает сначала подборки, потом чек-апы, поэтому
 * стрелка двигает элемент только среди своего типа: «поднять чек-ап выше
 * последней подборки» смысла не имеет.
 *
 * Меняем местами позиции двух элементов в ПОЛНОМ списке типа, а не нумеруем
 * заново только эту категорию: /reorder присваивает sort по позиции в массиве,
 * и передав 15 id мы задали бы им sort 1..15, сдвинув категорию в начало общего
 * списка. Перестановка внутри полного массива меняет sort ровно у двух строк.
 */
async function moveInCategory(formData: FormData) {
  'use server';
  const categoryId = String(formData.get('categoryId') ?? '');
  const id = String(formData.get('id') ?? '');
  const kind = String(formData.get('kind') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (direction !== 'up' && direction !== 'down') return;
  if (kind !== 'collection' && kind !== 'checkup') return;

  const isCollection = kind === 'collection';
  const listPath = isCollection ? '/collections' : '/checkup-collections';
  const catPath = isCollection
    ? `/categories/${encodeURIComponent(categoryId)}/collections`
    : `/categories/${encodeURIComponent(categoryId)}/checkup-collections`;

  const [all, inCategory] = await Promise.all([
    adminApi<{ id: string }[]>(listPath),
    adminApi<{ id: string }[]>(catPath),
  ]);
  // Сосед — по порядку ВНУТРИ категории (в общем списке между ними лежит чужое).
  const here = inCategory.findIndex(x => x.id === id);
  const neighbour = inCategory[direction === 'up' ? here - 1 : here + 1];
  if (here === -1 || !neighbour) return;

  const next = [...all];
  const a = next.findIndex(x => x.id === id);
  const b = next.findIndex(x => x.id === neighbour.id);
  if (a === -1 || b === -1) return;
  [next[a], next[b]] = [next[b], next[a]];

  await adminApi('/reorder', {
    method: 'POST',
    body: JSON.stringify({
      entity: isCollection ? 'collections' : 'checkups',
      ids: next.map(item => item.id),
    }),
  });
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath(isCollection ? '/admin/collections' : '/admin/checkup');
}

/** Отвязать подборку от категории (сама подборка и её вопросы остаются). */
async function detachCollection(formData: FormData) {
  'use server';
  const categoryId = String(formData.get('categoryId'));
  const collectionId = String(formData.get('collectionId'));
  await adminApi(`/collections/${collectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId: null }),
  });
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath('/admin/collections');
}

/** Отвязать чек-ап от категории (сам чек-ап и его вопросы остаются). */
async function detachCheckup(formData: FormData) {
  'use server';
  const categoryId = String(formData.get('categoryId'));
  const checkupId = String(formData.get('checkupId'));
  await adminApi(`/checkup-collections/${checkupId}`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId: null }),
  });
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath('/admin/checkup');
}

export default async function EditCategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = parseListQuery(await searchParams);
  let category: AdminCategory;
  let collections: AdminCollection[];
  let checkups: AdminCheckupCollection[];
  try {
    [category, collections, checkups] = await Promise.all([
      adminApi<AdminCategory>(`/categories/${encodeURIComponent(id)}`),
      adminApi<AdminCollection[]>(`/categories/${encodeURIComponent(id)}/collections`),
      adminApi<AdminCheckupCollection[]>(
        `/categories/${encodeURIComponent(id)}/checkup-collections`,
      ),
    ]);
  } catch {
    notFound();
  }

  // Подборки и чек-апы — одной таблицей: раздельные секции читались как два
  // экрана, а разницу типов достаточно нести бейджу в колонке «Тип».
  const items = [
    ...collections.map(c => ({
      kind: 'collection' as const,
      id: c.id,
      title: c.title,
      image_url: c.image_url,
      question_count: c.question_count,
      active: c.active,
      href: `/admin/collections/${c.id}`,
    })),
    ...checkups.map(c => ({
      kind: 'checkup' as const,
      id: c.id,
      title: c.title,
      image_url: c.image_url,
      question_count: c.question_count,
      active: c.active,
      href: `/admin/checkup/${c.id}`,
    })),
  ];
  const basePath = `/admin/categories/${encodeURIComponent(id)}`;
  const view = sliceList(items, query, (item, needle) => matchesText(needle, item.title));
  // Границы считаем в СВОЁМ типе и по полному списку категории: на второй
  // странице «вверх» иначе упиралось бы в её начало, а не в начало типа.
  const posInKind = new Map(
    items.map(item => [
      item.id,
      items.filter(x => x.kind === item.kind).findIndex(x => x.id === item.id),
    ]),
  );
  const lastInKind = {
    collection: collections.length - 1,
    checkup: checkups.length - 1,
  };

  return (
    <>
      <h1 className="adminH1">Редактировать категорию</h1>
      <p className="adminSub">Измените название, изображение и порядок показа категории.</p>
      <CategoryForm
        category={category}
        action={saveCategory}
        deleteAction={deleteCategory}
        submitLabel="Сохранить"
      />

      <h2 className="adminH2">Контент этой категории ({items.length})</h2>
      {items.length === 0 ? (
        <p className="adminSub">
          Пока пусто. Привязать контент можно на вкладках{' '}
          <Link className="adminGhostLink" href="/admin/collections">
            «Вопросы»
          </Link>{' '}
          и{' '}
          <Link className="adminGhostLink" href="/admin/checkup">
            «Чек-ап»
          </Link>
          .
        </p>
      ) : (
        <>
        <ListSearch basePath={basePath} query={query} placeholder="Название" total={view.total} />
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Тип</th>
                <th>Вопросов</th>
                <th>Порядок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {view.items.map(item => (
                <tr key={`${item.kind}-${item.id}`}>
                  <td>
                    {item.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(item.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{item.title}</td>
                  <td>
                    {item.kind === 'collection' ? (
                      <span className="pill pillMuted">Вопросы</span>
                    ) : (
                      <span className="pill pillCoral">Чек-ап</span>
                    )}
                  </td>
                  <td>{item.question_count}</td>
                  <td>
                    <div className="sortCell">
                      <form action={moveInCategory}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="kind" value={item.kind} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          className="sortBtn"
                          type="submit"
                          disabled={posInKind.get(item.id) === 0}
                          title="Поднять выше"
                          aria-label={`Поднять «${item.title}» выше`}>
                          ↑
                        </button>
                      </form>
                      <form action={moveInCategory}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="kind" value={item.kind} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          className="sortBtn"
                          type="submit"
                          disabled={posInKind.get(item.id) === lastInKind[item.kind]}
                          title="Опустить ниже"
                          aria-label={`Опустить «${item.title}» ниже`}>
                          ↓
                        </button>
                      </form>
                    </div>
                  </td>
                  <td>
                    {item.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <div className="rowActions">
                      <Link className="adminGhostLink" href={item.href}>
                        Открыть
                      </Link>
                      <form action={item.kind === 'collection' ? detachCollection : detachCheckup}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input
                          type="hidden"
                          name={item.kind === 'collection' ? 'collectionId' : 'checkupId'}
                          value={item.id}
                        />
                        <button className="adminDangerBtn" type="submit">
                          Убрать из категории
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {view.items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--text-soft)' }}>
                    Ничего не найдено — измените запрос.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={view.page}
          limit={query.limit}
          total={view.total}
          pageHref={page => listHref(basePath, query, { page })}
          sizeHref={(limit, page) => listHref(basePath, query, { limit, page })}
        />
        </>
      )}
    </>
  );
}
