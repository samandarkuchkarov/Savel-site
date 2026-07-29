import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  adminApi,
  type AdminCheckupCollection,
  type AdminCollection,
} from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import ScheduleForm from '../ScheduleForm';

export const dynamic = 'force-dynamic';

async function createInterval(_prev: FormState, formData: FormData): Promise<FormState> {
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
    // Осмысленные отказы API (пересечение дат, пустая/неактивная подборка)
    // показываем НАД формой. Раньше здесь был redirect на ?error=, из-за
    // которого выбранные даты и подборки сбрасывались и их вводили заново.
    return toFormError(error, formData);
  }
  revalidatePath('/admin/schedule');
  redirect('/admin/schedule');
}

export default async function NewSchedulePage() {
  const [questionCollections, checkupCollections] = await Promise.all([
    adminApi<AdminCollection[]>('/collections'),
    adminApi<AdminCheckupCollection[]>('/checkup-collections'),
  ]);
  return (
    <>
      <h1 className="adminH1">Новый интервал</h1>
      <p className="adminSub">Выберите период и контент, который будет активен в это время.</p>
      <ScheduleForm
        questionCollections={questionCollections}
        checkupCollections={checkupCollections}
        action={createInterval}
        submitLabel="Создать"
      />
    </>
  );
}
