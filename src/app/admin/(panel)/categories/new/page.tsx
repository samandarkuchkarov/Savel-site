import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadImage } from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import { trFields } from '@/lib/trFields';
import CategoryForm from '../CategoryForm';

export const dynamic = 'force-dynamic';

async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  // try оборачивает ТОЛЬКО работу: redirect ниже кидает NEXT_REDIRECT, и внутри
  // try он был бы пойман как «ошибка сохранения».
  try {
    const imageUrl = await adminUploadImage(formData.get('imageFile'));
    await adminApi('/categories', {
      method: 'POST',
      body: JSON.stringify({
        id: String(formData.get('id') ?? '').trim(),
        title: String(formData.get('title') ?? '').trim(),
        subtitle: String(formData.get('subtitle') ?? '').trim(),
        ...trFields(formData, 'title', 'subtitle'),
        imageUrl,
        sort: Number(formData.get('sort') ?? 100),
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export default function NewCategoryPage() {
  return (
    <>
      <h1 className="adminH1">Новая категория</h1>
      <p className="adminSub">Добавьте категорию вопросов и изображение для карточки в приложении.</p>
      <CategoryForm action={createCategory} submitLabel="Создать" />
    </>
  );
}
