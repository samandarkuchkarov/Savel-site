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

/** Содержимое категории одним списком в том порядке, в каком его видит приложение. */
async function categoryContent(categoryId: string) {
  const [collections, checkups] = await Promise.all([
    adminApi<AdminCollection[]>(`/categories/${encodeURIComponent(categoryId)}/collections`),
    adminApi<AdminCheckupCollection[]>(
      `/categories/${encodeURIComponent(categoryId)}/checkup-collections`,
    ),
  ]);
  const merged = [
    ...collections.map(c => ({ kind: 'collection' as const, row: c })),
    ...checkups.map(c => ({ kind: 'checkup' as const, row: c })),
  ].sort((a, b) => a.row.sort - b.row.sort);
  return { collections, checkups, merged };
}

/**
 * Порядок внутри категории — ОБЩИЙ для подборок и чек-апов: приложение
 * показывает их единым списком, поэтому чек-ап может стоять между подборками.
 *
 * Шлём порядок ЦЕЛИКОМ в /categories/:id/content-order: sort — сквозная
 * нумерация по двум таблицам, и обычный /reorder (одна таблица = одна
 * последовательность) её бы разорвал.
 */
async function moveInCategory(formData: FormData) {
  'use server';
  const categoryId = String(formData.get('categoryId') ?? '');
  const id = String(formData.get('id') ?? '');
  const kind = String(formData.get('kind') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (direction !== 'up' && direction !== 'down') return;
  if (kind !== 'collection' && kind !== 'checkup') return;

  const { merged } = await categoryContent(categoryId);
  const i = merged.findIndex(x => x.kind === kind && x.row.id === id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= merged.length) return;
  const next = [...merged];
  [next[i], next[j]] = [next[j], next[i]];

  await adminApi(`/categories/${encodeURIComponent(categoryId)}/content-order`, {
    method: 'POST',
    body: JSON.stringify({ items: next.map(x => ({ kind: x.kind, id: x.row.id })) }),
  });
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath('/admin/collections');
  revalidatePath('/admin/checkup');
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
  let content: Awaited<ReturnType<typeof categoryContent>>;
  try {
    [category, content] = await Promise.all([
      adminApi<AdminCategory>(`/categories/${encodeURIComponent(id)}`),
      categoryContent(id),
    ]);
  } catch {
    notFound();
  }

  // Подборки и чек-апы — одной таблицей и в ОДНОМ порядке: ровно то, что
  // приложение покажет в категории. Тип несёт бейдж в колонке «Тип».
  const items = content.merged.map(({ kind, row }) => ({
    kind,
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    question_count: row.question_count,
    active: row.active,
    href: kind === 'collection' ? `/admin/collections/${row.id}` : `/admin/checkup/${row.id}`,
  }));
  const basePath = `/admin/categories/${encodeURIComponent(id)}`;
  const view = sliceList(items, query, (item, needle) => matchesText(needle, item.title));
  // Границы — по ПОЛНОМУ списку категории, а не по странице: иначе на второй
  // странице «вверх» упиралось бы в её начало.
  const positions = new Map(items.map((item, i) => [`${item.kind}:${item.id}`, i]));
  const lastIndex = items.length - 1;

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
                          disabled={positions.get(`${item.kind}:${item.id}`) === 0}
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
                          disabled={positions.get(`${item.kind}:${item.id}`) === lastIndex}
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
