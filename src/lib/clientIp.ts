import { isIP } from 'node:net';

/**
 * Реальный IP посетителя лендинга из доверенной proxy-цепочки.
 *
 * Путь: браузер → Caddy → Next.js. Caddy добавляет IP непосредственного клиента
 * в КОНЕЦ X-Forwarded-For. При одном доверенном прокси берём правую запись —
 * клиентский XFF-спуфинг оседает ЛЕВЕЕ и игнорируется. Порт Next.js должен быть
 * доступен ТОЛЬКО через Caddy (см. DEPLOY.md), иначе XFF подделывается напрямую.
 */

/** Ровно один доверенный прокси (наш Caddy). Если добавится Cloudflare — 2. */
const TRUSTED_HOPS = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? '1') || 1);

/**
 * Чистая функция разбора XFF (тестируется без Next). trustedHops — сколько
 * доверенных прокси перед нами: клиентский IP = запись на этом месте справа.
 * Возвращает валидный IP или null (пусто/мусор/кривой forwarded).
 */
export function pickClientIp(xff: string | null | undefined, trustedHops = 1): string | null {
  if (!xff) return null;
  const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  // Индекс записи, которую проставил самый внешний доверенный прокси.
  const idx = Math.max(0, parts.length - trustedHops);
  const candidate = parts[idx].replace(/^::ffff:/i, '');
  return isIP(candidate) ? candidate : null;
}

/**
 * IP текущего SSR-запроса. Динамический import next/headers — чтобы этот модуль
 * (и pickClientIp) можно было импортировать в node:test без рантайма Next.
 */
export async function clientIp(): Promise<string | null> {
  const { headers } = await import('next/headers');
  const h = await headers();
  return pickClientIp(h.get('x-forwarded-for'), TRUSTED_HOPS);
}
