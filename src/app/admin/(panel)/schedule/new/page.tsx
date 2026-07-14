import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  adminApi,
  type AdminCheckupCollection,
  type AdminCollection,
} from '@/lib/adminApi';
import ScheduleForm from '../ScheduleForm';

export const dynamic = 'force-dynamic';

async function createInterval(formData: FormData) {
  'use server';
  const questionCollectionId = String(formData.get('questionCollectionId') ?? '').trim();
  const checkupCollectionId = String(formData.get('checkupCollectionId') ?? '').trim();
  try {
    await adminApi('/schedule', {
      method: 'POST',
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
    redirect('/admin/schedule/new?error=' + encodeURIComponent(message));
  }
  revalidatePath('/admin/schedule');
  redirect('/admin/schedule');
}

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [questionCollections, checkupCollections] = await Promise.all([
    adminApi<AdminCollection[]>('/collections'),
    adminApi<AdminCheckupCollection[]>('/checkup-collections'),
  ]);
  return (
    <>
      <h1 className="adminH1">Новый интервал</h1>
      <p className="adminSub">Выберите период и контент, который будет активен в это время.</p>
      {error ? <p className="loginError">{error}</p> : null}
      <ScheduleForm
        questionCollections={questionCollections}
        checkupCollections={checkupCollections}
        action={createInterval}
        submitLabel="Создать"
      />
    </>
  );
}
