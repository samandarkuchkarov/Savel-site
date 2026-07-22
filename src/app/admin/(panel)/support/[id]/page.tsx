import Link from 'next/link';
import {
  adminApi,
  adminAssetUrl,
  type AdminSupportMessage,
  type AdminSupportThread,
} from '@/lib/adminApi';
import SupportDialog from './SupportDialog';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

/** Диалог одного support-треда: карточка пользователя + живая переписка. */
export default async function AdminSupportThreadPage({ params }: Props) {
  const { id } = await params;

  let thread: AdminSupportThread | null = null;
  let messages: AdminSupportMessage[] = [];
  let error: string | null = null;
  try {
    thread = await adminApi<AdminSupportThread>(`/support/threads/${id}`);
    messages = await adminApi<AdminSupportMessage[]>(
      `/support/threads/${id}/messages?limit=50`,
    );
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  if (error || !thread) {
    return (
      <>
        <Link className="adminGhostLink" href="/admin/support">
          ← К списку
        </Link>
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>Диалог недоступен</b>
          <span>{error ?? 'Чат поддержки не найден'}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Link className="adminGhostLink" href="/admin/support">
        ← К списку
      </Link>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          margin: '12px 0 18px',
        }}>
        {thread.user_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="catThumb"
            src={adminAssetUrl(thread.user_photo_url)}
            alt=""
            style={{ borderRadius: '50%' }}
          />
        ) : (
          <span className="catThumbEmpty" style={{ borderRadius: '50%' }}>
            {(thread.user_name || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="adminH1" style={{ margin: 0 }}>
            {thread.user_name || 'Без имени'}
          </h1>
          <div style={{ color: '#8b7d78', fontWeight: 600, fontSize: 13 }}>
            {thread.user_email || 'без email'}
          </div>
        </div>
        <Link
          className="adminGhostLink"
          href={`/admin/users/${thread.user_id}`}
          style={{ marginLeft: 'auto' }}>
          Профиль пользователя
        </Link>
      </div>

      <SupportDialog threadId={thread.id} initialMessages={messages} />
    </>
  );
}
