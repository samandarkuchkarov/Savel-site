import { adminApi } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

interface ReferralStats {
  redeemed: number;
  activated: number;
  monthsGranted: number;
  top: { name: string; accepted: number; months: number }[];
  recent: {
    referrer: string | null;
    invited: string | null;
    created_at: string;
    activated_at: string | null;
    reward_months: number;
  }[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Рефералы: сводка программы «пригласи пару — месяц Savel+». */
export default async function ReferralsPage() {
  const stats = await adminApi<ReferralStats>('/referrals');

  return (
    <div>
      <h1>Рефералы</h1>
      <p className="adminSub">
        Пригласи пару друзей — им месяц Savel+ после соединения, пригласившему месяц (до 5).
      </p>

      <div className="statGrid">
        <div className="statCard">
          <b>{stats.redeemed}</b>
          <span>Кодов введено</span>
        </div>
        <div className="statCard">
          <b>{stats.activated}</b>
          <span>Пар соединилось</span>
        </div>
        <div className="statCard">
          <b>{stats.monthsGranted}</b>
          <span>Месяцев подарено реферерам</span>
        </div>
      </div>

      {stats.top.length > 0 && (
        <>
          <h2 className="adminH2">Топ приглашающих</h2>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Активаций</th>
                  <th>Месяцев получено</th>
                </tr>
              </thead>
              <tbody>
                {stats.top.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.accepted}</td>
                    <td>{row.months}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="adminH2">Последние приглашения</h2>
      {stats.recent.length === 0 ? (
        <p className="adminSub">Пока никто не вводил коды приглашений.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Пригласил</th>
                <th>Приглашён</th>
                <th>Код введён</th>
                <th>Пара создана</th>
                <th>Награда</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((row, i) => (
                <tr key={i}>
                  <td>{row.referrer ?? '—'}</td>
                  <td>{row.invited ?? '—'}</td>
                  <td>{fmtDate(row.created_at)}</td>
                  <td>{fmtDate(row.activated_at)}</td>
                  <td>{row.activated_at ? (row.reward_months > 0 ? '+1 мес' : 'потолок') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
