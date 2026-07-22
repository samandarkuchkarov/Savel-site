/**
 * Rate limit входа администратора. Вынесен из server-only adminApi.ts, чтобы
 * покрываться node:test без рантайма Next (тут нет ни next/headers, ни секретов).
 *
 * Перебор пароля — единственная дверь в приватные данные пар, поэтому защит три:
 *  1. пер-IP окно (ключ обязан приходить из ДОВЕРЕННОЙ части XFF — см. clientIp);
 *  2. глобальный потолок на окно — на случай, если ключ всё же управляем
 *     атакующим (подделка заголовка, ботнет, пул адресов);
 *  3. пауза после неверного пароля — режет пропускную способность перебора.
 */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
/**
 * Потолок на ВСЕ попытки в окне, поверх пер-IP лимита. Пер-IP не ловит перебор
 * с ботнета/пула адресов (у каждого IP свои 5 попыток), а ключ лимита приходит
 * из заголовка — доверять ему как единственной защите нельзя. Порог заведомо
 * выше любой живой активности админа (это один пароль на одного человека).
 */
const LOGIN_GLOBAL_MAX = 50;
/** Пауза после неверного пароля — режет пропускную способность перебора. */
const LOGIN_FAIL_DELAY_MS = 700;

const loginAttempts = new Map<string, { count: number; resetAt: number }>(); // ip → окно
let globalAttempts = { count: 0, resetAt: 0 }; // все IP вместе

/** Зарегистрировать попытку логина; true = лимит исчерпан, попытку не обрабатываем. */
export function loginRateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [k, v] of loginAttempts) if (v.resetAt <= now) loginAttempts.delete(k);

  // Глобальное окно считаем ПЕРВЫМ: даже с новым (в т.ч. подделанным) ключом
  // на каждом запросе перебор упирается в общий потолок.
  if (globalAttempts.resetAt <= now) {
    globalAttempts = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  }
  globalAttempts.count += 1;
  if (globalAttempts.count > LOGIN_GLOBAL_MAX) return true;

  const slot = loginAttempts.get(ip);
  if (!slot) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  slot.count += 1;
  return slot.count > LOGIN_MAX_ATTEMPTS;
}

/** Успешный вход — снимаем счётчик с этого IP и общий (админ явно живой). */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
  globalAttempts = { count: 0, resetAt: 0 };
}

/** Задержка перед ответом о неверном пароле. Вызывать ТОЛЬКО на неудачной попытке. */
export function loginFailDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, LOGIN_FAIL_DELAY_MS));
}

/** Пороги — для тестов и диагностики. */
export const LOGIN_LIMITS = {
  maxPerIp: LOGIN_MAX_ATTEMPTS,
  maxGlobal: LOGIN_GLOBAL_MAX,
  windowMs: LOGIN_WINDOW_MS,
  failDelayMs: LOGIN_FAIL_DELAY_MS,
} as const;
