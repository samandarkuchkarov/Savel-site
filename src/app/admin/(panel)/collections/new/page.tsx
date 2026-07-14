import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadImage, type AdminCategory, type AdminCollection } from '@/lib/adminApi';
import CollectionForm from '../CollectionForm';

export const dynamic = 'force-dynamic';

async function createCollection(formData: FormData) {
  'use server';
  const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const created = await adminApi<AdminCollection>('/collections', {
    method: 'POST',
    body: JSON.stringify({
      title: String(formData.get('title') ?? '').trim(),
      categoryId: categoryId || null,
      imageUrl: uploadedImageUrl,
      active: formData.get('active') === 'on',
    }),
  });
  revalidatePath('/admin/collections');
  redirect(`/admin/collections/${created.id}`);
}

export default async function NewCollectionPage() {
  const categories = await adminApi<AdminCategory[]>('/categories');
  return (
    <>
      <h1 className="adminH1">Новая подборка</h1>
      <p className="adminSub">
        Создайте подборку, затем добавьте в неё вопросы с вариантами ответов.
      </p>
      <CollectionForm categories={categories} action={createCollection} submitLabel="Создать" />
    </>
  );
}
