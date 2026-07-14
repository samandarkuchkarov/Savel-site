import Link from 'next/link';
import { adminApi, type AdminScheduleInterval } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

function dateRu(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU');
}

/** Активен сейчас / скоро / прошёл — по датам относительно сегодня. */
function statusOf(interval: AdminScheduleInterval): { label: string; cls: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (today < interval.starts_on) return { label: 'скоро', cls: 'pillMuted' };
  if (today > interval.ends_on) return { label: 'прошёл', cls: 'pillMuted' };
  return { label: 'активен', cls: 'pillGreen' };
}

export default async function AdminSchedulePage() {
  let intervals: AdminScheduleInterval[] = [];
  let error: string | null = null;
  try {
    intervals = await adminApi<AdminScheduleInterval[]>('/schedule');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Расписание</h1>
          <p className="adminSub">
            Интервал задаёт период дат, в котором активны выбранная подборка вопросов и чек-ап.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/schedule/new">
          Создать интервал
        </Link>
      </div>

      {error ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Период</th>
                <th>Подборка вопросов</th>
                <th>Чек-ап</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {intervals.map(interval => {
                const status = statusOf(interval);
                return (
                  <tr key={interval.id}>
                    <td>
                      {dateRu(interval.starts_on)} — {dateRu(interval.ends_on)}
                    </td>
                    <td>
                      {interval.question_collection_title ?? (
                        <span className="pill pillMuted">не задана</span>
                      )}
                    </td>
                    <td>
                      {interval.checkup_collection_title ?? (
                        <span className="pill pillMuted">не задан</span>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${status.cls}`}>{status.label}</span>
                    </td>
                    <td>
                      <Link className="adminGhostLink" href={`/admin/schedule/${interval.id}`}>
                        Редактировать
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {intervals.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: '#8b7d78' }}>
                    Пока нет ни одного интервала — создайте первый.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
