import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { issueSession, readSession, sessionKey } from './adminSession';

const API_URL = process.env.SAVEL_API_URL ?? 'http://localhost:4000';

// Server→API data fetches use SAVEL_API_URL (loopback in prod). But uploaded
// images are loaded by the BROWSER, which can't reach the server's loopback —
// their <img src> must point at the public API origin. In prod set
// PUBLIC_API_URL=https://api.savel.uz; in local dev it falls back to API_URL.
const PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? API_URL;

/**
 * Reject any privileged server→API call without a valid admin cookie. Server Actions are
 * public POST endpoints — the (panel)/layout redirect runs on re-render AFTER the action body,
 * so it does NOT protect mutations. Every call that carries ADMIN_TOKEN re-checks auth here.
 */
async function assertAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) throw new Error('unauthorized');
}

/**
 * Таймзона админки. Запрос идёт сервер-к-серверу, поэтому зону браузера сервер
 * не увидит — а «за сегодня» на дашборде обязано означать ташкентские сутки, а
 * не UTC (иначе утренние регистрации до 05:00 попадают во «вчера»).
 */
export const ADMIN_TZ = 'Asia/Tashkent';

/** Server-to-server call to Savel_server admin endpoints. */
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  await assertAdmin();
  const res = await fetch(`${API_URL}/v1/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': process.env.ADMIN_TOKEN ?? '',
      'X-Timezone': ADMIN_TZ,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function adminAssetUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, PUBLIC_API_URL).toString();
}

export async function adminUploadImage(file: FormDataEntryValue | null): Promise<string | null> {
  await assertAdmin();
  if (!(file instanceof File) || file.size === 0) return null;
  const contentType = file.type || 'application/octet-stream';
  const res = await fetch(`${API_URL}/v1/admin/uploads/category-image`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'X-Admin-Token': process.env.ADMIN_TOKEN ?? '',
    },
    body: await file.arrayBuffer(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `UPLOAD ${res.status}`);
  }
  const data = (await res.json()) as { imageUrl?: string };
  return data.imageUrl ?? null;
}

export const ADMIN_COOKIE = 'savel_admin';

/**
 * Админ-сессии: подписанный самодостаточный cookie (см. adminSession.ts).
 *
 * Было — Map в памяти процесса: каждый деплой сайта перезапускал systemd-юнит
 * `savel-site`, Map пустела, и админа выбрасывало на логин. Стало — HMAC-подпись
 * от секретов сайта: перезапуск ничего не теряет, состояние на сервере не
 * нужно, а несколько реплик перестали быть проблемой.
 *
 * Отзыв ОДНОЙ сессии больше не переживает перезапуск (отзывать нечему — сервер
 * не хранит список выданных). Ниже — best-effort набор в памяти: выход из
 * панели действует немедленно в текущем процессе. Настоящий рычаг «разлогинить
 * везде и навсегда» — сменить ADMIN_PANEL_PASSWORD или ADMIN_TOKEN: ключ
 * подписи выводится из них, и все старые cookie обесцениваются разом.
 */
const revokedNonces = new Set<string>();

export function issueAdminSession(): string {
  const key = sessionKey();
  // Без секретов сессию не выдаём: подпись пустым ключом подделывается кем угодно.
  if (!key) throw new Error('ADMIN_TOKEN/ADMIN_PANEL_PASSWORD не заданы — вход невозможен');
  return issueSession(key);
}

export function revokeAdminSession(token: string | undefined): void {
  const claims = readSession(token, sessionKey());
  if (claims) revokedNonces.add(claims.nonce);
}

/** Сравнение пароля без утечки по времени (хэшируем обе стороны до равной длины). */
export function verifyAdminPassword(password: unknown): boolean {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (typeof password !== 'string' || !expected) return false;
  const a = createHash('sha256').update(password).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/* ── Rate limit логина: перебор пароля — единственная дверь в приватные данные пар ── */

// Сам лимитер живёт в чистом модуле (тестируется node:test); реэкспорт — чтобы
// страница логина брала всё из '@/lib/adminApi', как и раньше.
export {
  evaluateLogin,
  clearLoginAttempts,
  loginFailDelay,
  LOGIN_LIMITS,
  type LoginOutcome,
} from './loginRateLimit';

export async function isAdminAuthed(): Promise<boolean> {
  const jar = await cookies();
  const claims = readSession(jar.get(ADMIN_COOKIE)?.value, sessionKey());
  if (!claims) return false;
  return !revokedNonces.has(claims.nonce);
}

/* ── Types mirroring the admin API ── */

/** Push-рассылка (вкладка «Уведомления»). */
export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  sent_count: number | null;
  fail_count: number | null;
  error: string | null;
  created_at: string;
}

export interface AdminNotificationList {
  items: AdminNotification[];
  /** Сколько устройств зарегистрировано для пушей. */
  devices: number;
  /** Настроен ли Firebase на сервере (FIREBASE_SERVICE_ACCOUNT). */
  pushConfigured: boolean;
}

/** Загрузка картинки уведомления → относительный URL. */
export async function adminUploadNotificationImage(
  file: FormDataEntryValue | null,
): Promise<string | null> {
  await assertAdmin();
  if (!(file instanceof File) || file.size === 0) return null;
  const res = await fetch(`${API_URL}/v1/admin/uploads/notification-image`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-Admin-Token': process.env.ADMIN_TOKEN ?? '',
    },
    body: await file.arrayBuffer(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `UPLOAD ${res.status}`);
  }
  const data = (await res.json()) as { imageUrl?: string };
  return data.imageUrl ?? null;
}

/** Динамические цены Savel+ (вкладка «Значения»). */
export interface AdminPricing {
  monthUsd: number;
  yearUsd: number;
  /** Готовые строки пейволла, производные от цен — превью того, что увидит пользователь. */
  preview: {
    id: 'year' | 'month';
    title: string;
    price: string;
    note: string;
    badge?: string;
  }[];
}

export interface AdminStats {
  users: number;
  couples: number;
  paired_users: number;
  checkups: number;
  daily_answers: number;
  chat_threads: number;
  chat_messages: number;
  boost_activities: number;
  savel_plus: number;
  /** Диалогов поддержки, ждущих ответа (бейдж в меню). Старый сервер его не шлёт. */
  support_unread?: number;
}

/** Прирост метрики за период (только у потоковых — у которых есть created_at). */
export interface AdminDelta {
  today: number;
  week: number;
}

/** Сводка расходов на ИИ в долларах. «Месяц» — календарный, в зоне админа. */
export interface AdminAiSpend {
  today: number;
  week: number;
  month: number;
  total: number;
  tokens_month: number;
}

/** Ответ /admin/stats/trend: прирост карточек + дневной ряд для графика. */
export interface AdminTrend {
  /** Таймзона, в которой сервер считал «сегодня» (см. ADMIN_TZ). */
  tz: string;
  days: number;
  deltas: Partial<Record<keyof AdminStats, AdminDelta>>;
  /** Старый сервер поля не шлёт — карточку расходов тогда просто не рисуем. */
  ai?: AdminAiSpend;
  series: {
    date: string;
    users: number;
    couples: number;
    /**
     * Savel+ считается СОБЫТИЯМИ (подключения/отключения), а не числом
     * подписчиков на каждый день: историю состояния восстановить нечем —
     * подробности в комментарии к PLUS_GRANT_ACTIONS на сервере.
     * Старый сервер полей не шлёт — второй график тогда не рисуем.
     */
    plus_granted?: number;
    plus_revoked?: number;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  gender: 'male' | 'female' | null;
  pair_code: string;
  /** Ручной admin-флаг (для деталей). Для отображения статуса — effective_plus. */
  savel_plus: boolean;
  /** Эффективный Savel+: подписка / реферал / партнёр / грант — как в runtime. */
  effective_plus: boolean;
  /** Откуда доступ: admin_grant | referral | partner | test_store | app_store | google_play. */
  plus_sources: string[] | null;
  created_at: string;
  paired: boolean;
  partner_name: string | null;
  /** Суммарно потрачено токенов ИИ (вход + выход). */
  tokens: number;
  /** Оценка расходов на ИИ в долларах (по прайсу моделей на сервере). */
  cost_usd: number;
}

/** Человекочитаемая подпись источников Savel+ (для tooltip). */
export const PLUS_SOURCE_RU: Record<string, string> = {
  admin_grant: 'ручной грант',
  referral: 'реферальные месяцы',
  partner: 'через партнёра',
  test_store: 'тестовая подписка',
  app_store: 'App Store',
  google_play: 'Google Play',
};
export function plusSourcesLabel(sources: string[] | null): string {
  if (!sources || sources.length === 0) return 'Savel+';
  return sources.map(s => PLUS_SOURCE_RU[s] ?? s).join(', ');
}

/** Компактное число: 1234 → «1.2k», 1_500_000 → «1.5M», 2_000_000_000 → «2B». */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return String(n);
  for (const { v, s } of [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'k' },
  ]) {
    if (abs >= v) {
      const scaled = n / v;
      // 1 знак после запятой для <10 (1.2k), целые для ≥10 (12k); «.0» отбрасываем.
      return `${scaled.toFixed(scaled < 10 ? 1 : 0).replace(/\.0$/, '')}${s}`;
    }
  }
  return String(n);
}

/** Деньги в долларах: мелочь показываем точнее ($0.003), крупные — с разделителем ($1 234). */
export function formatUsd(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return '$0';
  if (v < 1) return `$${v.toFixed(3)}`;
  if (v < 100) return `$${v.toFixed(2)}`;
  return `$${Math.round(v).toLocaleString('ru-RU')}`;
}

export interface AdminSubscriptionEvent {
  id: string;
  action:
    | 'purchase'
    | 'restore'
    | 'admin_grant'
    | 'admin_revoke'
    | 'test_subscription_grant'
    | 'test_subscription_revoke'
    | 'referral_reward'
    | 'referral_bonus';
  plan: string | null;
  source: 'app' | 'admin' | 'referral';
  note: string | null;
  created_at: string;
}

export interface AdminChatThread {
  id: string;
  title: string;
  subtitle: string;
  updated_at: string;
  messages: number;
}

export interface AdminUserCouple {
  id: string;
  together_since: string | null;
  relationship_index: number | null;
  savel_plus: boolean;
  plan: string | null;
  created_at: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string | null;
  gender: 'male' | 'female' | null;
  birth_date: string | null;
  photo_url: string | null;
  pair_code: string;
  couple_id: string | null;
  savel_plus: boolean;
  created_at: string;
  partner_id: string | null;
  partner_name: string | null;
  providers: string | null;
  subscriptions: AdminSubscriptionEvent[];
  couple: AdminUserCouple | null;
  chats: AdminChatThread[];
  checkups: AdminCheckupResult[];
  answers: AdminQuestionAnswer[];
  /** Ряды выровнены по периоду (неделя/интервал); null = участник пропустил период. */
  graph: { you: (number | null)[]; partner: (number | null)[] };
}

export interface AdminCouple {
  id: string;
  together_since: string | null;
  relationship_index: number | null;
  savel_plus: boolean;
  plan: string | null;
  created_at: string;
  members: string;
  checkups: string;
}

export interface AdminPage<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

export interface AdminCategory {
  id: string;
  title: string;
  subtitle: string;
  /** Переводы; null — перевода нет, приложение покажет русский. */
  title_uz: string | null;
  title_en: string | null;
  subtitle_uz: string | null;
  subtitle_en: string | null;
  emoji: string | null;
  image_url: string | null;
  sort: number;
  active: boolean;
}

export interface AdminCheckupQuestion {
  id: string;
  text: string;
  text_uz: string | null;
  text_en: string | null;
  sort: number;
  active: boolean;
}

export interface AdminScheduleInterval {
  id: string;
  starts_on: string;
  ends_on: string;
  question_collection_id: string | null;
  checkup_collection_id: string | null;
  question_collection_title: string | null;
  checkup_collection_title: string | null;
}

export type BoostRecommendationKind = 'challenge' | 'date' | 'tradition' | 'goal';

export interface AdminBoostRecommendation {
  id: string;
  kind: BoostRecommendationKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  emoji: string | null;
  position: number;
}

export interface AdminCheckupCollection {
  id: string;
  /** Категория в Пульсе; null — чек-ап вне категорий (только для расписания). */
  category_id: string | null;
  title: string;
  title_uz: string | null;
  title_en: string | null;
  image_url: string | null;
  sort: number;
  active: boolean;
  question_count: number;
  /** Название категории — приходит только в списке (join на сервере). */
  category_title?: string | null;
}

export type AdminCheckupCollectionDetail = AdminCheckupCollection & {
  questions: AdminCheckupQuestion[];
};

export interface AdminCollection {
  id: string;
  category_id: string | null;
  title: string;
  title_uz: string | null;
  title_en: string | null;
  image_url: string | null;
  sort: number;
  active: boolean;
  /** true — подборка доступна только с Savel+. */
  plus: boolean;
  question_count: number;
  category_title?: string | null;
}

export interface AdminCollectionQuestion {
  id: string;
  text: string;
  variants: string[];
  text_uz: string | null;
  text_en: string | null;
  /** null — вариантов не переводили; длина совпадает с variants, если есть. */
  variants_uz: string[] | null;
  variants_en: string[] | null;
  sort: number;
}

export type AdminCollectionDetail = AdminCollection & {
  questions: AdminCollectionQuestion[];
};

export interface AdminCheckupAnswer {
  n: number;
  text: string;
  value: number;
  note: string | null;
}

export interface AdminCheckupResult {
  id: string;
  userName: string;
  collectionTitle: string | null;
  score: number;
  createdAt: string;
  answers: AdminCheckupAnswer[];
}

export interface AdminQuestionAnswer {
  source: string;
  created_at: string;
  user_name: string;
  question_text: string;
  answer: string;
  note: string | null;
  collection_title: string | null;
}

export interface AdminCoupleMember {
  id: string;
  name: string;
  email: string | null;
  gender: 'male' | 'female' | null;
  savel_plus: boolean;
}

export interface AdminCoupleDetail {
  id: string;
  together_since: string | null;
  relationship_index: number | null;
  savel_plus: boolean;
  plan: string | null;
  created_at: string;
  members: AdminCoupleMember[];
  checkups: AdminCheckupResult[];
  answers: AdminQuestionAnswer[];
}

/* ── Чат поддержки ─────────────────────────────────────── */

// Типы/утилиты поддержки живут в client-safe модуле (их импортирует браузерный
// SupportDialog); реэкспорт здесь — чтобы серверные страницы могли и дальше
// брать их из '@/lib/adminApi'. НЕ импортируйте adminApi из client-компонентов.
export type { AdminSupportThread, AdminSupportMessage } from './adminSupport';
export { supportMessageCursor } from './adminSupport';
