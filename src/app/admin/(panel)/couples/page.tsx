import Link from 'next/link';
import { adminApi, type AdminCouple, type AdminPage } from '@/lib/adminApi';
import Pagination from '../Pagination';
import AdminError from '../AdminError';
import { ListSearch, SortHeader } from '../ListToolbar';
import { apiListQuery, listHref, parseListQuery, type RawListParams } from '../listQuery';

export const dynamic = 'force-dynamic';

const BASE = '/admin/couples';

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

type Props = { searchParams: Promise<RawListParams> };

export default async function AdminCouplesPage({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  let data: AdminPage<AdminCouple> | null = null;
  let error: string | null = null;
  try {
    data = await adminApi<AdminPage<AdminCouple>>(`/couples?${apiListQuery(query)}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <h1 className="adminH1">Пары</h1>
      <p className="adminSub">
        Соединённые пары (оба профиля связаны). Поиск находит пару по любому из партнёров.
      </p>

      <ListSearch
        basePath={BASE}
        query={query}
        placeholder="Имя или email любого из партнёров"
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
                  <th>Участники</th>
                  <SortHeader
                    label="Создана"
                    basePath={BASE}
                    query={query}
                    asc="created_asc"
                    desc="created_desc"
                  />
                  <th>Вместе с</th>
                  <SortHeader
                    label="Индекс"
                    basePath={BASE}
                    query={query}
                    asc="index_asc"
                    desc="index_desc"
                  />
                  <th>Чек-апов</th>
                  <th>Savel+</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map(couple => (
                  <tr key={couple.id}>
                    <td>{couple.members}</td>
                    <td>{dateRu(couple.created_at)}</td>
                    <td>{dateRu(couple.together_since)}</td>
                    <td className="numCell">{couple.relationship_index ?? '—'}</td>
                    <td className="numCell">{couple.checkups}</td>
                    <td>
                      {couple.savel_plus ? (
                        <span className="pill pillCoral">{couple.plan ?? 'да'}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <Link className="adminGhostLink" href={`/admin/couples/${couple.id}`}>
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      {query.q ? (
                        <>
                          По запросу «{query.q}» пар нет.{' '}
                          <Link className="adminGhostLink" href={listHref(BASE, query, { q: '' })}>
                            Показать все
                          </Link>
                        </>
                      ) : (
                        'Нет пар на этой странице.'
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
