import Link from 'next/link';
import {
  adminApi,
  formatUsd,
  platformLabel,
  plusSourcesLabel,
  type AdminPage,
  type AdminUser,
} from '@/lib/adminApi';
import Pagination from '../Pagination';
import AdminError from '../AdminError';
import { ListSearch, SortHeader } from '../ListToolbar';
import { apiListQuery, listHref, parseListQuery, type RawListParams } from '../listQuery';

export const dynamic = 'force-dynamic';

const BASE = '/admin/users';

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

type Props = { searchParams: Promise<RawListParams> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  let data: AdminPage<AdminUser> | null = null;
  let error: string | null = null;
  try {
    data = await adminApi<AdminPage<AdminUser>>(`/users?${apiListQuery(query)}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <h1 className="adminH1">Пользователи</h1>
      <p className="adminSub">
        Поиск по имени, email или коду пары. Колонки со стрелкой — сортируемые.
      </p>

      <ListSearch
        basePath={BASE}
        query={query}
        placeholder="Имя, email или код пары"
        total={data?.total}
      />

      {error || !data ? (
        <AdminError error={error} />
      ) : (
        <>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <SortHeader
                    label="Имя"
                    basePath={BASE}
                    query={query}
                    asc="name_asc"
                    desc="name_desc"
                    first="asc"
                  />
                  <th>Платформа</th>
                  <th>Email</th>
                  <th>Пара</th>
                  <th>Savel+</th>
                  <SortHeader
                    label="Расходы ИИ"
                    basePath={BASE}
                    query={query}
                    asc="cost_asc"
                    desc="cost_desc"
                  />
                  <SortHeader
                    label="Регистрация"
                    basePath={BASE}
                    query={query}
                    asc="created_asc"
                    desc="created_desc"
                  />
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((user, i) => (
                  <tr key={user.id}>
                    <td className="numCell muted">{(data.page - 1) * data.limit + i + 1}</td>
                    <td>{user.name || '—'}</td>
                    <td>
                      {user.platform ? (
                        <span className={`pill ${user.platform === 'ios' ? 'pillIos' : 'pillAndroid'}`}>
                          {platformLabel(user.platform)}
                        </span>
                      ) : (
                        <span className="mutedFaint">—</span>
                      )}
                    </td>
                    <td>{user.email || <span className="mutedFaint">—</span>}</td>
                    <td>
                      {user.paired ? (
                        <span className="pill pillGreen">с {user.partner_name || '…'}</span>
                      ) : (
                        <span className="pill pillMuted">нет</span>
                      )}
                    </td>
                    <td>
                      {user.effective_plus ? (
                        <span className="pill pillCoral" title={plusSourcesLabel(user.plus_sources)}>
                          Savel+
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className="numCell"
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
                    <td colSpan={8} className="muted">
                      {query.q ? (
                        <>
                          По запросу «{query.q}» никого нет.{' '}
                          <Link className="adminGhostLink" href={listHref(BASE, query, { q: '' })}>
                            Показать всех
                          </Link>
                        </>
                      ) : (
                        'Нет пользователей на этой странице.'
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            limit={data.limit}
            total={data.total}
            pageHref={page => listHref(BASE, query, { page })}
            sizeHref={(limit, page) => listHref(BASE, query, { limit, page })}
          />
        </>
      )}
    </>
  );
}
