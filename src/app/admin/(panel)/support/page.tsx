import Link from 'next/link';
import {
  adminApi,
  adminAssetUrl,
  type AdminPage,
  type AdminSupportThread,
} from '@/lib/adminApi';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

function dateTimeRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

type Props = { searchParams: Promise<{ page?: string; q?: string; filter?: string }> };

/** Список support-диалогов: поиск по имени/email, фильтр непрочитанных, свежие сверху. */
export default async function AdminSupportPage({ searchParams }: Props) {
  const { page: pageParam, q, filter } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const unreadOnly = filter === 'unread';
  const query = (q ?? '').trim();

  let data: AdminPage<AdminSupportThread> | null = null;
  let error: string | null = null;
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (query) params.set('q', query);
    if (unreadOnly) params.set('filter', 'unread');
    data = await adminApi<AdminPage<AdminSupportThread>>(`/support/threads?${params}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  // Базовый query для ссылок фильтров/пагинации — поиск не теряется при переходах.
  const withQuery = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value);
    const s = params.toString();
    return `/admin/support${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <h1 className="adminH1">Поддержка</h1>
      <p className="adminSub">
        Диалоги пользователей со службой поддержки, свежие — сверху. Непрочитанные вами
        сообщения отмечены счётчиком.
      </p>

      <form className="adminForm" action="/admin/support" method="get" style={{ marginBottom: 14 }}>
        <input type="text" name="q" placeholder="Поиск по имени или email" defaultValue={query} />
        {unreadOnly ? <input type="hidden" name="filter" value="unread" /> : null}
        <button className="adminBtn" type="submit">
          Найти
        </button>
        <span style={{ display: 'inline-flex', gap: 8, marginLeft: 8 }}>
          <Link className={unreadOnly ? 'sortBtn' : 'adminBtn'} href={withQuery({})}>
            Все
          </Link>
          <Link
            className={unreadOnly ? 'adminBtn' : 'sortBtn'}
            href={withQuery({ filter: 'unread' })}>
            Непрочитанные
          </Link>
        </span>
      </form>

      {error || !data ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : data.items.length === 0 ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>
            {unreadOnly ? 'Непрочитанных диалогов нет' : 'Диалогов пока нет'}
          </b>
          <span>
            {query
              ? 'Ничего не найдено по запросу — проверьте имя или email.'
              : 'Как только пользователь напишет в поддержку, диалог появится здесь.'}
          </span>
        </div>
      ) : (
        <>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th style={{ width: 52 }} />
                  <th>Пользователь</th>
                  <th>Последнее сообщение</th>
                  <th>Когда</th>
                  <th>Непрочитанные</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map(thread => (
                  <tr key={thread.id}>
                    <td>
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
                    </td>
                    <td>
                      <b>{thread.user_name || 'Без имени'}</b>
                      <div style={{ color: '#8b7d78', fontSize: 12.5 }}>
                        {thread.user_email || 'без email'}
                      </div>
                    </td>
                    <td style={{ maxWidth: 340 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          maxWidth: 340,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'bottom',
                          fontWeight: thread.unread > 0 ? 700 : 500,
                        }}>
                        {thread.last_sender === 'support' ? 'Вы: ' : ''}
                        {thread.last_text ?? '—'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{dateTimeRu(thread.last_at)}</td>
                    <td>
                      {thread.unread > 0 ? (
                        <span className="pill pillCoral">{thread.unread}</span>
                      ) : (
                        <span className="pill pillMuted">0</span>
                      )}
                    </td>
                    <td>
                      <Link className="adminGhostLink" href={`/admin/support/${thread.id}`}>
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            basePath={withQuery(unreadOnly ? { filter: 'unread' } : {})}
            page={data.page}
            limit={data.limit}
            total={data.total}
          />
        </>
      )}
    </>
  );
}
