import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadImage } from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import { trFields, expertLinks } from '@/lib/trFields';
import ExpertForm from '../ExpertForm';

export const dynamic = 'force-dynamic';

async function createExpert(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  // try оборачивает ТОЛЬКО работу: redirect ниже кидает NEXT_REDIRECT, и внутри
  // try он был бы пойман как «ошибка сохранения».
  try {
    const photoUrl = await adminUploadImage(formData.get('photoFile'), 'expert-photo');
    await adminApi('/experts', {
      method: 'POST',
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        title: String(formData.get('title') ?? '').trim(),
        ...trFields(formData, 'name', 'title', 'bio'),
        bio: String(formData.get('bio') ?? '').trim(),
        links: expertLinks(formData),
        photoUrl,
        sort: Number(formData.get('sort') ?? 100),
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/experts');
  redirect('/admin/experts');
}

export default function NewExpertPage() {
  return (
    <>
      <h1 className="adminH1">Новый эксперт</h1>
      <p className="adminSub">
        Карточка появится в «Пульсе» под категориями. Ссылку задайте полным адресом — соцсеть
        выбирает сам эксперт.
      </p>
      <ExpertForm action={createExpert} submitLabel="Добавить" />
    </>
  );
}
