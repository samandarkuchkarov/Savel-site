import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadNotificationImage } from '@/lib/adminApi';
import { toFormError, type FormState } from '@/lib/formState';
import NotificationForm from '../NotificationForm';

export const dynamic = 'force-dynamic';

/** datetime-local (время Ташкента) → ISO с офсетом; пусто → null (= сейчас). */
function toScheduledAt(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  return value ? `${value}:00+05:00` : null;
}

async function createNotification(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  try {
    const imageUrl = await adminUploadNotificationImage(formData.get('imageFile'));
    await adminApi('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        body: String(formData.get('body') ?? '').trim(),
        imageUrl,
        scheduledAt: toScheduledAt(formData.get('scheduledAt')),
      }),
    });
  } catch (error) {
    // Текст рассылки — самое дорогое, что тут набирают руками; ошибку
    // показываем НАД формой, а не редиректом, который его стирал.
    return toFormError(error, formData);
  }
  revalidatePath('/admin/notifications');
  redirect('/admin/notifications?saved=1');
}

export default function NewNotificationPage() {
  return (
    <>
      <h1 className="adminH1">Новая рассылка</h1>
      <p className="adminSub">
        Пустое время — уйдёт сразу после создания; с временем — точно в указанный момент (Ташкент).
      </p>
      <NotificationForm action={createNotification} submitLabel="Создать" />
    </>
  );
}
