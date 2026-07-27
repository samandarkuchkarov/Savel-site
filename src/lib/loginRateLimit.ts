/**
 * Rate limit входа администратора. Вынесен из server-only adminApi.ts, чтобы
 * покрываться node:test без рантайма Next (тут нет ни next/headers, ни секретов).
 *
 * Перебор пароля — единственная дверь в приватные данные пар, поэтому защит три:
 *  1. пер-IP окно (ключ обязан приходить из ДОВЕРЕННОЙ части XFF — см. clientIp);
 *  2. глобальный потолок на окно — на случай, если ключ управляем атакующим
 *     (подделка заголовка, ботнет, пул адресов);
 *  3. пауза после неверного пароля — режет пропускную способность перебора.
 *
 * ⚠️ КЛЮЧЕВОЙ инвариант (см. evaluateLogin): пароль проверяется ПЕРВЫМ, а
 * счётчики трогают ТОЛЬКО неудачные попытки. Верный пароль логинит немедленно и
 * никогда не смотрит на лимитер. Прошлая версия инкрементила глобальный счётчик
 * на КАЖДЫЙ вход (включая успешный) и проверяла его ДО пароля — поэтому атакующий
 * ~51 неверным POST выбивал глобальный кап и запирал настоящего админа с верным
 * паролем (DoS против единственной admin-поверхности). Теперь это невозможно.
 */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
/**
 * Потолок на все НЕУДАЧНЫЕ попытки в окне, поверх пер-IP лимита. Пер-IP не ловит
 * перебор с ботнета/пула адресов (у каждого IP свои 5 попыток), а ключ приходит
 * из заголовка — доверять ему как единственной защите нельзя. Затрагивает только
 * неверные пароли, поэтому запереть админа с верным паролем не может.
 */
const LOGIN_GLOBAL_MAX = 50;
/** Пауза после неверного пароля — режет пропускную способность перебора. */
const LOGIN_FAIL_DELAY_MS = 700;

const loginAttempts = new Map<string, { count: number; resetAt: number }>(); // ip → окно
let globalAttempts = { count: 0, resetAt: 0 }; // все IP вместе

/**
 * Зафиксировать НЕУДАЧНУЮ попытку входа; true = лимит (пер-IP или глобальный)
 * исчерпан. Вызывать ТОЛЬКО при неверном пароле.
 */
function recordFailedLogin(ip: string): boolean {
  const now = Date.now();
  for (const [k, v] of loginAttempts) if (v.resetAt <= now) loginAttempts.delete(k);

  if (globalAttempts.resetAt <= now) {
    globalAttempts = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  }
  globalAttempts.count += 1;

  const slot = loginAttempts.get(ip);
  const perIp = slot ? (slot.count += 1) : 1;
  if (!slot) loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });

  return perIp > LOGIN_MAX_ATTEMPTS || globalAttempts.count > LOGIN_GLOBAL_MAX;
}

/** Успешный вход — снимаем счётчик с этого IP и общий (админ явно живой). */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
  globalAttempts = { count: 0, resetAt: 0 };
}

export type LoginOutcome = 'ok' | 'wrong' | 'rate';

/**
 * Решение по попытке входа. `passwordOk` — результат проверки пароля, СДЕЛАННОЙ
 * ВЫЗЫВАЮЩИМ ЗАРАНЕЕ. Инвариант: при passwordOk лимитер вообще не смотрится —
 * верный пароль всегда даёт 'ok', сколько бы попыток ни было накоплено (это и
 * есть защита от DoS-локаута). Побочные эффекты со счётчиками — только здесь:
 *  - 'ok'   → чистим счётчики (per-IP + глобальный) и логиним;
 *  - 'wrong'→ зафиксировали неудачу, лимит ещё не исчерпан (вызывающий тормозит);
 *  - 'rate' → неудача исчерпала лимит (быстрый отказ без задержки).
 */
export function evaluateLogin(passwordOk: boolean, ip: string): LoginOutcome {
  if (passwordOk) {
    clearLoginAttempts(ip);
    return 'ok';
  }
  return recordFailedLogin(ip) ? 'rate' : 'wrong';
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
