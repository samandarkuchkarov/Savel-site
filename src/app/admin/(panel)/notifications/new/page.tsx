import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, adminUploadNotificationImage } from '@/lib/adminApi';
import NotificationForm from '../NotificationForm';

export const dynamic = 'force-dynamic';

/** datetime-local (время Ташкента) → ISO с офсетом; пусто → null (= сейчас). */
function toScheduledAt(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  return value ? `${value}:00+05:00` : null;
}

async function createNotification(formData: FormData) {
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
    const message = error instanceof Error ? error.message : 'Не удалось создать рассылку';
    redirect('/admin/notifications/new?error=' + encodeURIComponent(message));
  }
  revalidatePath('/admin/notifications');
  redirect('/admin/notifications?saved=1');
}

export default async function NewNotificationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <h1 className="adminH1">Новая рассылка</h1>
      <p className="adminSub">
        Пустое время — уйдёт сразу после создания; с временем — точно в указанный момент (Ташкент).
      </p>
      {error ? <p className="loginError">{error}</p> : null}
      <NotificationForm action={createNotification} submitLabel="Создать" />
    </>
  );
}
