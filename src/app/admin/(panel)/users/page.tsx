import Link from 'next/link';
import { adminApi, formatUsd, type AdminPage, type AdminUser } from '@/lib/adminApi';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  let data: AdminPage<AdminUser> | null = null;
  let error: string | null = null;
  try {
    data = await adminApi<AdminPage<AdminUser>>(`/users?page=${page}&limit=20`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <h1 className="adminH1">Пользователи</h1>
      <p className="adminSub">Все зарегистрированные пользователи, новые — сверху.</p>

      {error || !data ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Пара</th>
                  <th>Savel+</th>
                  <th>Расходы ИИ</th>
                  <th>Регистрация</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((user, i) => (
                  <tr key={user.id}>
                    <td style={{ color: '#8b7d78', fontVariantNumeric: 'tabular-nums' }}>
                      {(data.page - 1) * data.limit + i + 1}
                    </td>
                    <td>{user.name || '—'}</td>
                    <td>{user.email || <span style={{ color: '#c3b4ae' }}>—</span>}</td>
                    <td>
                      {user.paired ? (
                        <span className="pill pillGreen">с {user.partner_name || '…'}</span>
                      ) : (
                        <span className="pill pillMuted">нет</span>
                      )}
                    </td>
                    <td>
                      {user.savel_plus ? <span className="pill pillCoral">Savel+</span> : '—'}
                    </td>
                    <td
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                      title={`${formatUsd(user.cost_usd)} · ${user.tokens.toLocaleString('ru-RU')} токенов`}>
                      {user.cost_usd > 0 ? formatUsd(user.cost_usd) : '—'}
                    </td>
                    <td>{dateRu(user.created_at)}</td>
                    <td>
                      <Link className="adminGhostLink" href={`/admin/users/${user.id}`}>
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ color: '#8b7d78' }}>
                      Нет пользователей на этой странице.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/admin/users" page={data.page} limit={data.limit} total={data.total} />
        </>
      )}
    </>
  );
}
