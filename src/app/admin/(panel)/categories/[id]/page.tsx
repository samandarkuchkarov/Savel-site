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
import CategoryForm from '../CategoryForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
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

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
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
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Тип</th>
                <th>Вопросов</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
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
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
