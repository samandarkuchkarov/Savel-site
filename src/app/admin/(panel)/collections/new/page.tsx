import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadImage, type AdminCategory, type AdminCollection } from '@/lib/adminApi';
import CollectionForm from '../CollectionForm';
import { toFormError, type FormState } from '@/lib/formState';
import { trFields } from '@/lib/trFields';

export const dynamic = 'force-dynamic';

async function createCollection(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  // try — только вокруг работы; redirect ниже кидает NEXT_REDIRECT и внутри try
  // был бы пойман как «ошибка сохранения».
  let created: AdminCollection;
  try {
    const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
    const categoryId = String(formData.get('categoryId') ?? '').trim();
    created = await adminApi<AdminCollection>('/collections', {
      method: 'POST',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        ...trFields(formData, 'title'),
        categoryId: categoryId || null,
        imageUrl: uploadedImageUrl,
        active: formData.get('active') === 'on',
        plus: formData.get('plus') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
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
