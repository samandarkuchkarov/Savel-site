import { clientIp } from './clientIp';

/**
 * Публичная проверка инвайт-кода для лендинга /invite/[code].
 * Тот же SAVEL_API_URL, что и у админки, но БЕЗ admin-токена: ручка публичная
 * и информационная (ничего не активирует; истину решает POST /referral/redeem).
 *
 * Rate limit на API — по РЕАЛЬНОМУ посетителю, поэтому SSR-запрос пробрасывает
 * его IP: без этого все посетители приходят с одного IP SSR-сервера и делят
 * один bucket (после 15 просмотров — 429 для всех). IP берём из доверенной
 * proxy-цепочки (Caddy → X-Forwarded-For) и подписываем внутренним секретом —
 * API доверяет заголовку только с ним. Секрет — server-only (не NEXT_PUBLIC).
 */

const API_URL = process.env.SAVEL_API_URL ?? 'http://localhost:4000';
const INTERNAL_SECRET = process.env.INTERNAL_PROXY_SECRET ?? '';

export interface InviteStatus {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'unavailable';
  eligibleForPairReward: boolean;
}

/** Заголовки проброса реального IP — только если есть и секрет, и валидный IP. */
async function forwardHeaders(): Promise<Record<string, string>> {
  if (!INTERNAL_SECRET) return {};
  const ip = await clientIp();
  if (!ip) return {}; // нет надёжного IP — не шлём заголовок (API применит fallback)
  return { 'x-internal-secret': INTERNAL_SECRET, 'x-savel-client-ip': ip };
}

/**
 * null = проверить не удалось (сеть/5xx/429) — это НЕ valid и НЕ invalid,
 * страница показывает отдельное состояние с «Повторить» (временная ошибка).
 * 429 сюда тоже попадает: перебор ограничен, но это временно, а не «нет кода».
 */
export async function fetchInviteStatus(code: string): Promise<InviteStatus | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/public/referrals/${encodeURIComponent(code)}/status`,
      // Код могут отозвать в любой момент — статус не кешируем вовсе.
      { cache: 'no-store', headers: await forwardHeaders() },
    );
    if (!res.ok) return null; // включая 429 → временная ошибка на странице
    const data = (await res.json()) as Partial<InviteStatus> | null;
    if (!data || typeof data.status !== 'string') return null;
    return { status: data.status as InviteStatus['status'], eligibleForPairReward: !!data.eligibleForPairReward };
  } catch {
    return null;
  }
}
