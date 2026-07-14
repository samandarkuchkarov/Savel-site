import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  type AdminCheckupCollection,
  type AdminCollection,
  type AdminScheduleInterval,
} from '@/lib/adminApi';
import ScheduleForm from '../ScheduleForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function saveInterval(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const questionCollectionId = String(formData.get('questionCollectionId') ?? '').trim();
  const checkupCollectionId = String(formData.get('checkupCollectionId') ?? '').trim();
  try {
    await adminApi(`/schedule/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        startsOn: String(formData.get('startsOn') ?? ''),
        endsOn: String(formData.get('endsOn') ?? ''),
        questionCollectionId: questionCollectionId || null,
        checkupCollectionId: checkupCollectionId || null,
      }),
    });
  } catch (error) {
    // Осмысленные отказы API (пересечение дат, пустая/неактивная подборка) должны
    // дойти до админа, а не растворяться в генерик-странице ошибки.
    const message = error instanceof Error ? error.message : 'Не удалось сохранить';
    redirect(`/admin/schedule/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/schedule');
  redirect('/admin/schedule');
}

async function deleteInterval(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    await adminApi(`/schedule/${id}`, { method: 'DELETE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить';
    redirect(`/admin/schedule/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/schedule');
  redirect('/admin/schedule');
}

export default async function EditSchedulePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let interval: AdminScheduleInterval;
  let questionCollections: AdminCollection[];
  let checkupCollections: AdminCheckupCollection[];
  try {
    [interval, questionCollections, checkupCollections] = await Promise.all([
      adminApi<AdminScheduleInterval>(`/schedule/${id}`),
      adminApi<AdminCollection[]>('/collections'),
      adminApi<AdminCheckupCollection[]>('/checkup-collections'),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <h1 className="adminH1">Интервал расписания</h1>
      <p className="adminSub">Период и контент, активный в это время.</p>
      {error ? <p className="loginError">{error}</p> : null}
      <ScheduleForm
        interval={interval}
        questionCollections={questionCollections}
        checkupCollections={checkupCollections}
        action={saveInterval}
        deleteAction={deleteInterval}
        submitLabel="Сохранить"
      />
    </>
  );
}
