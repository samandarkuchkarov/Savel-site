import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, type AdminBoostRecommendation } from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import BoostRecForm from '../BoostRecForm';

export const dynamic = 'force-dynamic';

export default async function EditBoostRecPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let rec: AdminBoostRecommendation | undefined;
  try {
    const all = await adminApi<AdminBoostRecommendation[]>('/boost-recommendations');
    rec = all.find(r => r.id === id);
  } catch {
    rec = undefined;
  }
  if (!rec) notFound();

  async function updateRec(_prev: FormState, formData: FormData): Promise<FormState> {
    'use server';
    try {
      await adminApi(`/boost-recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: String(formData.get('title') ?? '').trim(),
          subtitle: String(formData.get('subtitle') ?? '').trim() || null,
          description: String(formData.get('description') ?? '').trim() || null,
          emoji: String(formData.get('emoji') ?? '').trim() || null,
        }),
      });
    } catch (e) {
      return toFormError(e, formData);
    }
    revalidatePath('/admin/boost');
    redirect('/admin/boost');
  }

  return (
    <>
      <h1 className="adminH1">Редактировать рекомендацию</h1>
      <p className="adminSub">Позиция меняется стрелками в общем списке.</p>
      <BoostRecForm action={updateRec} submitLabel="Сохранить" initial={rec} />
    </>
  );
}
