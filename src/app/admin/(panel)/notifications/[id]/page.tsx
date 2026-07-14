import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminAssetUrl,
  adminUploadNotificationImage,
  type AdminNotification,
} from '@/lib/adminApi';
import NotificationForm from '../NotificationForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function toScheduledAt(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? '').trim();
  return value ? `${value}:00+05:00` : null;
}

async function saveNotification(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    // Новый файл заменяет фото; без файла — оставляем текущее.
    const uploaded = await adminUploadNotificationImage(formData.get('imageFile'));
    const current = String(formData.get('currentImageUrl') ?? '').trim() || null;
    await adminApi(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        body: String(formData.get('body') ?? '').trim(),
        imageUrl: uploaded ?? current,
        scheduledAt: toScheduledAt(formData.get('scheduledAt')),
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сохранить';
    redirect(`/admin/notifications/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/notifications');
  redirect('/admin/notifications?saved=1');
}

async function deleteNotification(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    await adminApi(`/notifications/${id}`, { method: 'DELETE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить';
    redirect(`/admin/notifications/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/notifications');
  redirect('/admin/notifications');
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function EditNotificationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let notification: AdminNotification;
  try {
    notification = await adminApi<AdminNotification>(`/notifications/${id}`);
  } catch {
    notFound();
  }

  const editable = notification.status === 'scheduled';

  return (
    <>
      <h1 className="adminH1">Рассылка</h1>
      <p className="adminSub">
        {editable
          ? 'Запланирована — можно изменить или удалить (удаление отменяет отправку).'
          : notification.status === 'sent'
            ? `Отправлена ${fmt(notification.sent_at)} · доставлено: ${notification.sent_count ?? 0}` +
              (notification.fail_count ? `, сбоев: ${notification.fail_count}` : '')
            : notification.status === 'failed'
              ? `Ошибка отправки: ${notification.error ?? 'неизвестно'}`
              : 'Отправляется прямо сейчас…'}
      </p>
      {error ? <p className="loginError">{error}</p> : null}

      {editable ? (
        <NotificationForm
          notification={notification}
          action={saveNotification}
          submitLabel="Сохранить"
        />
      ) : (
        <div className="statCard" style={{ maxWidth: 560 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 900 }}>{notification.title}</p>
          <p style={{ margin: 0 }}>{notification.body}</p>
          {notification.image_url ? (
            <p style={{ margin: '10px 0 0' }}>
              <a href={adminAssetUrl(notification.image_url)} target="_blank" rel="noreferrer">
                Фото рассылки
              </a>
            </p>
          ) : null}
        </div>
      )}

      <div className="categoryEditActions" style={{ marginTop: 16 }}>
        <form action={deleteNotification}>
          <input type="hidden" name="id" value={notification.id} />
          <button className="adminDangerBtn" type="submit">
            {editable ? 'Отменить и удалить' : 'Удалить из истории'}
          </button>
        </form>
        <Link className="adminGhostLink" href="/admin/notifications">
          Назад к списку
        </Link>
      </div>
    </>
  );
}
