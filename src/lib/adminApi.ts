import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

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

/** Server-to-server call to Savel_server admin endpoints. */
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  await assertAdmin();
  const res = await fetch(`${API_URL}/v1/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': process.env.ADMIN_TOKEN ?? '',
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
 * Админ-сессии: СЛУЧАЙНЫЙ токен, выданный при логине, живёт в памяти процесса
 * (standalone-сборка — один процесс). Раньше cookie был статичным sha256(пароля):
 * утёкшее значение позволяло офлайн-перебор пароля, было одинаковым для всех
 * сессий и неотзываемым. Теперь в cookie нет ничего производного от пароля,
 * logout реально отзывает сессию, а рестарт сервиса сбрасывает все (админ
 * просто логинится заново).
 *
 * ⚠️ Требование: ОДИН постоянный процесс (systemd `savel-site` на VPS — так и
 * задеплоено, см. DEPLOY.md §6). Несколько реплик / PM2 cluster / serverless
 * несовместимы с Map — прежде чем масштабировать, перенесите сессии в
 * Postgres/Redis.
 */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const adminSessions = new Map<string, number>(); // token → expiresAt (ms)

export function issueAdminSession(): string {
  const now = Date.now();
  for (const [t, exp] of adminSessions) if (exp <= now) adminSessions.delete(t); // не копим протухшие
  const token = randomBytes(32).toString('hex');
  adminSessions.set(token, now + SESSION_TTL_MS);
  return token;
}

export function revokeAdminSession(token: string | undefined): void {
  if (token) adminSessions.delete(token);
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

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>(); // ip → окно

/** Зарегистрировать попытку логина; true = лимит исчерпан, попытку не обрабатываем. */
export function loginRateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [k, v] of loginAttempts) if (v.resetAt <= now) loginAttempts.delete(k);
  const slot = loginAttempts.get(ip);
  if (!slot) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  slot.count += 1;
  return slot.count > LOGIN_MAX_ATTEMPTS;
}

/** Успешный вход — снимаем счётчик с этого IP. */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export async function isAdminAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expiresAt = adminSessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return false;
  }
  return true;
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
  emoji: string | null;
  image_url: string | null;
  sort: number;
  active: boolean;
}

export interface AdminCheckupQuestion {
  id: string;
  text: string;
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
  title: string;
  image_url: string | null;
  sort: number;
  active: boolean;
  question_count: number;
}

export type AdminCheckupCollectionDetail = AdminCheckupCollection & {
  questions: AdminCheckupQuestion[];
};

export interface AdminCollection {
  id: string;
  category_id: string | null;
  title: string;
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
