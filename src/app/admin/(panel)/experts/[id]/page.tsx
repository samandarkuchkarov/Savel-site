import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { adminApi, adminUploadImage, type AdminExpert } from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import { trFields, expertLinks } from '@/lib/trFields';
import ExpertForm from '../ExpertForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

async function saveExpert(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  const id = String(formData.get('id'));
  // try — только вокруг работы; redirect ниже кидает NEXT_REDIRECT.
  try {
    const uploaded = await adminUploadImage(formData.get('photoFile'), 'expert-photo');
    // Файл не выбирали → оставляем прежнее фото (оно приехало скрытым полем).
    // Иначе каждое сохранение имени стирало бы портрет.
    const current = String(formData.get('photoUrl') ?? '').trim() || null;
    await adminApi(`/experts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: String(formData.get('name') ?? '').trim(),
        title: String(formData.get('title') ?? '').trim(),
        ...trFields(formData, 'name', 'title', 'bio'),
        bio: String(formData.get('bio') ?? '').trim(),
        links: expertLinks(formData),
        photoUrl: uploaded ?? current,
        sort: Number(formData.get('sort') ?? 0),
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/experts');
  redirect('/admin/experts');
}

async function deleteExpert(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await adminApi(`/experts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  revalidatePath('/admin/experts');
  redirect('/admin/experts');
}

export default async function EditExpertPage({ params }: Props) {
  const { id } = await params;
  let expert: AdminExpert;
  try {
    expert = await adminApi<AdminExpert>(`/experts/${encodeURIComponent(id)}`);
  } catch {
    notFound();
  }

  return (
    <>
      <h1 className="adminH1">Редактировать эксперта</h1>
      <p className="adminSub">
        Снимите галочку «Показывать», чтобы временно убрать карточку из приложения, не удаляя её.
      </p>
      <ExpertForm
        expert={expert}
        action={saveExpert}
        deleteAction={deleteExpert}
        submitLabel="Сохранить"
      />
    </>
  );
}
