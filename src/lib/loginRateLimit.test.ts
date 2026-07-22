/**
 * Rate limit входа админа. Ключевой сценарий — регрессия на обход через
 * X-Forwarded-For: раньше страница логина брала ЛЕВУЮ запись XFF (полностью
 * управляемую клиентом), поэтому свежий фейковый IP на каждом запросе давал
 * свежее окно и перебор пароля шёл без ограничений. Запуск: npm test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOGIN_LIMITS,
  clearLoginAttempts,
  loginFailDelay,
  loginRateLimited,
} from './loginRateLimit.js';

/** Сбрасывает глобальное окно (тесты делят состояние модуля). */
const resetGlobal = () => clearLoginAttempts('__reset__');

describe('loginRateLimited — пер-IP окно', () => {
  it('пропускает ровно maxPerIp попыток, следующую блокирует', () => {
    resetGlobal();
    const ip = '203.0.113.10';
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) {
      assert.equal(loginRateLimited(ip), false, `попытка ${i + 1} должна пройти`);
    }
    assert.equal(loginRateLimited(ip), true, 'превышение лимита должно блокироваться');
  });

  it('успешный вход снимает счётчик — админ не заперт после опечаток', () => {
    resetGlobal();
    const ip = '203.0.113.11';
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) loginRateLimited(ip);
    assert.equal(loginRateLimited(ip), true);
    clearLoginAttempts(ip);
    assert.equal(loginRateLimited(ip), false, 'после успеха окно должно быть чистым');
  });

  it('разные IP не мешают друг другу (в пределах глобального потолка)', () => {
    resetGlobal();
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) loginRateLimited('203.0.113.12');
    assert.equal(loginRateLimited('203.0.113.12'), true);
    assert.equal(loginRateLimited('203.0.113.13'), false, 'другой IP имеет своё окно');
  });
});

describe('глобальный потолок — защита при управляемом ключе', () => {
  it('РЕГРЕССИЯ: смена ключа на каждом запросе (спуф XFF) больше не даёт обход', () => {
    resetGlobal();
    let allowed = 0;
    // Атака «как раньше»: каждый запрос приходит с новым, никогда не повторяющимся
    // IP — пер-IP лимит такую последовательность не ловит в принципе.
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal * 3; i++) {
      if (!loginRateLimited(`198.51.100.${i % 256}-${i}`)) allowed += 1;
    }
    assert.equal(
      allowed,
      LOGIN_LIMITS.maxGlobal,
      'пропущено должно быть ровно maxGlobal, дальше — глухая блокировка',
    );
  });

  it('исчерпанный глобальный потолок блокирует и ранее чистый IP', () => {
    resetGlobal();
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal; i++) loginRateLimited(`192.0.2.${i}-${i}`);
    assert.equal(loginRateLimited('203.0.113.99'), true, 'потолок общий для всех');
  });

  it('успешный вход сбрасывает и глобальное окно', () => {
    resetGlobal();
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal; i++) loginRateLimited(`192.0.2.${i}-x${i}`);
    assert.equal(loginRateLimited('203.0.113.98'), true);
    clearLoginAttempts('203.0.113.98');
    assert.equal(loginRateLimited('203.0.113.98'), false);
  });
});

describe('задержка на неверном пароле', () => {
  it('loginFailDelay действительно ждёт заданное время', async () => {
    const started = process.hrtime.bigint();
    await loginFailDelay();
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    // Небольшой допуск на разрешение таймера.
    assert.ok(
      elapsedMs >= LOGIN_LIMITS.failDelayMs - 50,
      `ожидали ≥${LOGIN_LIMITS.failDelayMs}мс, получили ${elapsedMs}`,
    );
  });
});
