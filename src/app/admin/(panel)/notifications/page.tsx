import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, type AdminNotificationList } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';

export const dynamic = 'force-dynamic';

async function deleteNotification(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    await adminApi(`/notifications/${id}`, { method: 'DELETE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить';
    redirect('/admin/notifications?error=' + encodeURIComponent(message));
  }
  revalidatePath('/admin/notifications');
  redirect('/admin/notifications');
}

const STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Запланировано', cls: 'noteChip noteChipPlan' },
  sending: { label: 'Отправляется…', cls: 'noteChip noteChipPlan' },
  sent: { label: 'Отправлено', cls: 'noteChip noteChipOk' },
  failed: { label: 'Ошибка', cls: 'noteChip noteChipErr' },
};

/** ISO-UTC → «15.07.2026, 09:00» во времени Ташкента. */
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

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  let data: AdminNotificationList | null = null;
  try {
    data = await adminApi<AdminNotificationList>('/notifications');
  } catch {
    // API недоступен — честное сообщение ниже.
  }

  return (
    <>
      <h1 className="adminH1">Уведомления</h1>
      <p className="adminSub">
        Push-рассылки на все устройства с включёнными уведомлениями.
        {data ? ` Устройств зарегистрировано: ${data.devices}.` : ''}
      </p>
      {data && !data.pushConfigured ? (
        <p className="loginError">
          Firebase не настроен на сервере (FIREBASE_SERVICE_ACCOUNT) — рассылки будут падать с
          ошибкой, пока не добавлен ключ сервисного аккаунта.
        </p>
      ) : null}
      {saved ? <p className="savedBanner">✓ Сохранено</p> : null}
      {error ? <p className="loginError">{error}</p> : null}

      <p style={{ margin: '0 0 16px' }}>
        <Link className="adminBtn" href="/admin/notifications/new">
          + Новая рассылка
        </Link>
      </p>

      {!data ? (
        <p className="adminSub">API недоступен — обновите страницу позже.</p>
      ) : data.items.length === 0 ? (
        <p className="adminSub">Рассылок ещё нет — создайте первую.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Статус</th>
                <th>Заголовок</th>
                <th>Текст</th>
                <th>Время</th>
                <th>Доставлено</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(n => {
                const s = STATUS[n.status] ?? STATUS.scheduled;
                return (
                  <tr key={n.id}>
                    <td>
                      <span className={s.cls}>{s.label}</span>
                      {n.status === 'failed' && n.error ? (
                        <div className="noteError">{n.error}</div>
                      ) : null}
                    </td>
                    <td>
                      {n.image_url ? '🖼 ' : ''}
                      {n.title}
                    </td>
                    <td className="noteBody">{n.body.length > 70 ? `${n.body.slice(0, 69)}…` : n.body}</td>
                    <td>{n.status === 'sent' ? fmt(n.sent_at) : fmt(n.scheduled_at)}</td>
                    <td>
                      {n.status === 'sent'
                        ? `${n.sent_count ?? 0}${n.fail_count ? ` (сбоев: ${n.fail_count})` : ''}`
                        : '—'}
                    </td>
                    <td className="noteActions">
                      <Link className="adminBtnLink" href={`/admin/notifications/${n.id}`}>
                        {n.status === 'scheduled' ? 'Изменить' : 'Открыть'}
                      </Link>
                      <form action={deleteNotification}>
                        <input type="hidden" name="id" value={n.id} />
                        <ConfirmButton
                          className="adminDangerBtn"
                          type="submit"
                          confirmText="Удалить рассылку? Отправленная исчезнет из ленты уведомлений у всех пользователей.">
                          Удалить
                        </ConfirmButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
