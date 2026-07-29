import Link from 'next/link';
import {
  adminApi,
  formatCompact,
  formatUsd,
  type AdminStats,
  type AdminTrend,
} from '@/lib/adminApi';
import AdminError from './AdminError';
import TrendChart from './TrendChart';

export const dynamic = 'force-dynamic';

/**
 * Карточки обзора. `flow: true` — метрика-поток (есть created_at), у неё
 * показываем прирост. Состояния (в паре, Savel+) прироста не получают: «сколько
 * сейчас» и «сколько прибавилось» — разные вещи, и дельта у них врала бы.
 */
const STAT_CARDS: { key: keyof AdminStats; label: string; href?: string; flow?: boolean }[] = [
  { key: 'users', label: 'Пользователи', href: '/admin/users', flow: true },
  { key: 'couples', label: 'Пары', href: '/admin/couples', flow: true },
  { key: 'paired_users', label: 'Из них в паре' },
  { key: 'savel_plus', label: 'Savel+', href: '/admin/subscriptions' },
  { key: 'checkups', label: 'Чек-апы', flow: true },
  { key: 'daily_answers', label: 'Ответы на вопросы', flow: true },
  { key: 'chat_threads', label: 'Чаты', flow: true },
  { key: 'chat_messages', label: 'Сообщений в чатах', flow: true },
  { key: 'boost_activities', label: 'Активности буста', flow: true },
];

export default async function AdminDashboardPage() {
  let stats: AdminStats | null = null;
  let trend: AdminTrend | null = null;
  let error: string | null = null;
  try {
    // Прирост и график — отдельной ручкой: она тяжелее счётчиков, и её незачем
    // дёргать на всех страницах ради бейджа поддержки.
    [stats, trend] = await Promise.all([
      adminApi<AdminStats>('/stats'),
      adminApi<AdminTrend>('/stats/trend?days=30'),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  if (error || !stats) {
    return (
      <>
        <h1 className="adminH1">Обзор</h1>
        <AdminError error={error} />
      </>
    );
  }

  const waiting = stats.support_unread ?? 0;

  return (
    <>
      <h1 className="adminH1">Обзор</h1>

      {/* Единственное срочное в панели: люди, которым не ответили. Поэтому оно
          стоит ПЕРЕД счётчиками, а не теряется среди них. */}
      {waiting > 0 ? (
        <Link className="alertCard" href="/admin/support?filter=unread">
          <b>{waitingLabel(waiting)}</b>
          <span>Открыть поддержку →</span>
        </Link>
      ) : (
        <div className="calmCard">
          <b>Все обращения обработаны</b>
          <span>Новые появятся здесь и в меню «Поддержка».</span>
        </div>
      )}

      <div className="statGrid">
        {STAT_CARDS.map(({ key, label, href, flow }) => {
          const delta = flow ? trend?.deltas?.[key] : undefined;
          const card = (
            <>
              <b>{(stats![key] ?? 0).toLocaleString('ru-RU')}</b>
              <span>{label}</span>
              {delta ? (
                <span className="statDelta">
                  <span className={delta.today > 0 ? 'deltaUp' : 'deltaFlat'}>
                    {delta.today > 0 ? `+${delta.today}` : '0'} сегодня
                  </span>
                  <span className={delta.week > 0 ? 'deltaUp' : 'deltaFlat'}>
                    {delta.week > 0 ? `+${delta.week}` : '0'} за 7 дней
                  </span>
                </span>
              ) : null}
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

      {/* Расходы на ИИ — единственные ДЕНЬГИ на дашборде, поэтому отдельной
          карточкой, а не десятым счётчиком: доллары и «штуки» в одной сетке
          читаются как одна и та же величина. По пользователям сумма уже есть в
          списке, но «во сколько обошёлся месяц» там не спросить. */}
      {trend?.ai ? (
        <section className="costCard">
          <div className="costMain">
            <span className="costLabel">Расходы на ИИ за {monthName(trend.tz)}</span>
            <b>{formatUsd(trend.ai.month)}</b>
            <span className="adminSub">
              {formatCompact(trend.ai.tokens_month)} токенов · календарный месяц
            </span>
          </div>
          <dl className="costSide">
            {[
              ['Сегодня', trend.ai.today],
              ['За 7 дней', trend.ai.week],
              ['За всё время', trend.ai.total],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt>{label}</dt>
                <dd>{formatUsd(value as number)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {trend ? <TrendChart series={trend.series} /> : null}
    </>
  );
}

/**
 * Название текущего месяца — В ТОЙ ЖЕ ЗОНЕ, в которой сервер считал сумму.
 * Сервер живёт по UTC: 1-го числа в 02:00 по Ташкенту там ещё прошлый месяц, и
 * подпись расходилась бы с цифрой под ней.
 */
function monthName(tz: string): string {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: tz, month: 'long' }).format(new Date());
}

/**
 * «1 диалог ждёт ответа» / «2 диалога ждут ответа» / «5 диалогов ждут ответа».
 * Глагол согласуется вместе с существительным — иначе на единице получалось
 * «1 диалог ждут».
 */
function waitingLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const one = mod10 === 1 && mod100 !== 11;
  const few = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14);
  const noun = one ? 'диалог' : few ? 'диалога' : 'диалогов';
  return `${n} ${noun} ${one ? 'ждёт' : 'ждут'} ответа`;
}
