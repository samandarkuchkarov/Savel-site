import Link from 'next/link';
import { adminApi, type AdminCouple, type AdminPage } from '@/lib/adminApi';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminCouplesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  let data: AdminPage<AdminCouple> | null = null;
  let error: string | null = null;
  try {
    data = await adminApi<AdminPage<AdminCouple>>(`/couples?page=${page}&limit=20`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <h1 className="adminH1">Пары</h1>
      <p className="adminSub">Соединённые пары (оба профиля связаны), новые — сверху.</p>

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
                  <th>Участники</th>
                  <th>Вместе с</th>
                  <th>Индекс</th>
                  <th>Чек-апов</th>
                  <th>Savel+</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map(couple => (
                  <tr key={couple.id}>
                    <td>{couple.members}</td>
                    <td>{dateRu(couple.together_since)}</td>
                    <td>{couple.relationship_index ?? '—'}</td>
                    <td>{couple.checkups}</td>
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
                    <td colSpan={6} style={{ color: '#8b7d78' }}>
                      Нет пар на этой странице.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/admin/couples" page={data.page} limit={data.limit} total={data.total} />
        </>
      )}
    </>
  );
}
