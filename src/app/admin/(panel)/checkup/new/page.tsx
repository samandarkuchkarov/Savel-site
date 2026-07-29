import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadImage, type AdminCheckupCollection } from '@/lib/adminApi';
import CheckupForm from '../CheckupForm';
import { toFormError, type FormState } from '@/lib/formState';

export const dynamic = 'force-dynamic';

async function createCheckup(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  // try — только вокруг работы; redirect ниже кидает NEXT_REDIRECT и внутри try
  // был бы пойман как «ошибка сохранения».
  let created: AdminCheckupCollection;
  try {
    const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
    created = await adminApi<AdminCheckupCollection>('/checkup-collections', {
      method: 'POST',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        imageUrl: uploadedImageUrl,
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/checkup');
  redirect(`/admin/checkup/${created.id}`);
}

export default function NewCheckupPage() {
  return (
    <>
      <h1 className="adminH1">Новый чек-ап</h1>
      <p className="adminSub">Создайте чек-ап, затем добавьте в него утверждения для оценки.</p>
      <CheckupForm action={createCheckup} submitLabel="Создать" />
    </>
  );
}
