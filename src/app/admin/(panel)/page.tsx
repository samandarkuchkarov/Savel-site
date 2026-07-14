import Link from 'next/link';
import { adminApi, type AdminStats } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

const STAT_LABELS: [keyof AdminStats, string, string?][] = [
  ['users', 'Пользователи', '/admin/users'],
  ['couples', 'Пары', '/admin/couples'],
  ['savel_plus', 'Savel+'],
  ['checkups', 'Чек-апы'],
  ['daily_answers', 'Ответы на вопросы'],
  ['chat_threads', 'Чаты'],
];

export default async function AdminDashboardPage() {
  let stats: AdminStats | null = null;
  let error: string | null = null;
  try {
    stats = await adminApi<AdminStats>('/stats');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  if (error || !stats) {
    return (
      <>
        <h1 className="adminH1">Обзор</h1>
        <div className="statCard">
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>
            {error} — проверьте, что Savel_server запущен и SAVEL_API_URL/ADMIN_TOKEN заданы в
            .env.local
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="adminH1">Обзор</h1>
      <div className="statGrid">
        {STAT_LABELS.map(([key, label, href]) => {
          const card = (
            <>
              <b>{stats![key]}</b>
              <span>{label}</span>
            </>
          );
          return href ? (
            <Link className="statCard statCardLink" key={key} href={href}>
              {card}
            </Link>
          ) : (
            <div className="statCard" key={key}>
              {card}
            </div>
          );
        })}
      </div>
      <p className="adminSub" style={{ marginTop: 18 }}>
        Полные списки с пагинацией — на вкладках{' '}
        <Link className="adminGhostLink" href="/admin/users">
          «Пользователи»
        </Link>{' '}
        и{' '}
        <Link className="adminGhostLink" href="/admin/couples">
          «Пары»
        </Link>
        .
      </p>
    </>
  );
}
