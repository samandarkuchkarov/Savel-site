import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Админ-сессия в ПОДПИСАННОМ cookie — без состояния на сервере.
 *
 * Раньше выданные токены лежали в Map в памяти процесса, поэтому каждый деплой
 * сайта разлогинивал админа (systemd перезапускает `savel-site` — Map пустеет).
 * Теперь cookie самодостаточен: в нём срок годности, случайный nonce и подпись
 * HMAC-SHA256. Перезапуск ничего не теряет.
 *
 * Ключ подписи НЕ хранится отдельно, а выводится из двух уже существующих
 * секретов сайта — ADMIN_TOKEN и ADMIN_PANEL_PASSWORD. Из этого следует главное
 * свойство отзыва: смена любого из них мгновенно и НАВСЕГДА обесценивает все
 * выданные cookie. Это и есть «разлогинить везде» — durable, в отличие от
 * серверного списка отзыва, который сам не переживает перезапуск.
 *
 * Чего этот подход НЕ умеет: отозвать одну конкретную сессию так, чтобы отзыв
 * пережил перезапуск. Выход из панели удаляет cookie у браузера и помечает
 * nonce отозванным в памяти процесса — этого достаточно против «забыл выйти на
 * чужом ноутбуке», но утёкшее значение живёт до истечения срока. Поэтому срок
 * ограничен двумя неделями, а настоящий рычаг при утечке — смена пароля.
 */

/** Метка версии формата: сменив её, обесцениваем все старые cookie разом. */
const VERSION = 's1';

/** Сколько живёт сессия. Компромисс: не логиниться каждый день, но и не месяц. */
export const SESSION_TTL_DAYS = Number(process.env.ADMIN_SESSION_TTL_DAYS) || 14;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Ключ подписи из секретов сайта. Пустой ADMIN_TOKEN — не «подписываем пустым
 * ключом», а отказ выдавать сессии: подпись без секрета подделывается кем угодно.
 */
export function sessionKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const token = env.ADMIN_TOKEN;
  const password = env.ADMIN_PANEL_PASSWORD;
  if (!token || !password) return null;
  return createHmac('sha256', token).update(`savel-admin-session|${password}`).digest();
}

function sign(payload: string, key: Buffer): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/**
 * Значение cookie: `s1.<срок в base36>.<nonce>.<подпись>`.
 * nonce делает каждую сессию отличимой от прочих (иначе два входа подряд дают
 * один и тот же cookie) и служит ручкой для отзыва в пределах процесса.
 */
export function issueSession(key: Buffer, now: number = Date.now(), ttlMs = SESSION_TTL_MS): string {
  const payload = `${VERSION}.${(now + ttlMs).toString(36)}.${randomBytes(12).toString('hex')}`;
  return `${payload}.${sign(payload, key)}`;
}

export interface SessionClaims {
  expiresAt: number;
  nonce: string;
}

/**
 * Разбор и проверка cookie. Возвращает claims либо null — «не пускать».
 * Порядок важен: подпись проверяется ДО срока, чтобы по времени ответа нельзя
 * было отличить «просрочен» от «подделан».
 */
export function readSession(
  value: string | undefined,
  key: Buffer | null,
  now: number = Date.now(),
): SessionClaims | null {
  if (!key || !value) return null;
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const [version, expRaw, nonce, signature] = parts as [string, string, string, string];
  if (version !== VERSION || !expRaw || !nonce || !signature) return null;

  const expected = sign(`${version}.${expRaw}.${nonce}`, key);
  // timingSafeEqual требует одинаковой длины — иначе бросает, а не возвращает false.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expiresAt = parseInt(expRaw, 36);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return { expiresAt, nonce };
}
