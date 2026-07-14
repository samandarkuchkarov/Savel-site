import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminAssetUrl,
  adminUploadImage,
  type AdminCategory,
  type AdminCollection,
} from '@/lib/adminApi';
import CategoryForm from '../CategoryForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

async function saveCategory(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
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

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  let category: AdminCategory;
  let collections: AdminCollection[];
  try {
    [category, collections] = await Promise.all([
      adminApi<AdminCategory>(`/categories/${encodeURIComponent(id)}`),
      adminApi<AdminCollection[]>(`/categories/${encodeURIComponent(id)}/collections`),
    ]);
  } catch {
    notFound();
  }

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

      <h2 className="adminH2">Подборки этой категории ({collections.length})</h2>
      {collections.length === 0 ? (
        <p className="adminSub">
          Пока нет подборок. Создать и привязать их можно на вкладке{' '}
          <Link className="adminGhostLink" href="/admin/collections">
            «Подборки»
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
                <th>Вопросов</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {collections.map(collection => (
                <tr key={collection.id}>
                  <td>
                    {collection.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(collection.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{collection.title}</td>
                  <td>{collection.question_count}</td>
                  <td>
                    {collection.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <div className="rowActions">
                      <Link className="adminGhostLink" href={`/admin/collections/${collection.id}`}>
                        Открыть
                      </Link>
                      <form action={detachCollection}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="collectionId" value={collection.id} />
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
