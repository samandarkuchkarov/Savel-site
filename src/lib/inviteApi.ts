/**
 * Публичная проверка инвайт-кода для лендинга /invite/[code].
 * Тот же SAVEL_API_URL, что и у админки, но БЕЗ admin-токена: ручка публичная
 * и информационная (ничего не активирует; истину решает POST /referral/redeem).
 */

const API_URL = process.env.SAVEL_API_URL ?? 'http://localhost:4000';

export interface InviteStatus {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'unavailable';
  eligibleForPairReward: boolean;
}

/**
 * null = проверить не удалось (сеть/5xx/лимит) — это НЕ valid и НЕ invalid,
 * страница показывает отдельное состояние с «Повторить».
 */
export async function fetchInviteStatus(code: string): Promise<InviteStatus | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/public/referrals/${encodeURIComponent(code)}/status`,
      // Код могут отозвать в любой момент — статус не кешируем вовсе.
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<InviteStatus> | null;
    if (!data || typeof data.status !== 'string') return null;
    return { status: data.status as InviteStatus['status'], eligibleForPairReward: !!data.eligibleForPairReward };
  } catch {
    return null;
  }
}
