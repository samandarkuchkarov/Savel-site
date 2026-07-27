/**
 * Rate limit входа админа. Центральный кейс — регрессия на DoS-локаут: прошлая
 * версия инкрементила глобальный счётчик на каждый вход и проверяла его ДО
 * пароля, поэтому ~51 неверный POST запирал настоящего админа с верным паролем.
 * Теперь пароль проверяется первым (evaluateLogin), счётчики трогают только
 * неудачи. Запуск: npm test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOGIN_LIMITS,
  clearLoginAttempts,
  evaluateLogin,
  loginFailDelay,
} from './loginRateLimit.js';

/** Сбрасывает глобальное окно (тесты делят состояние модуля; IP берём уникальные). */
const reset = () => clearLoginAttempts('__reset__');

describe('evaluateLogin — пер-IP окно', () => {
  it('верный пароль всегда даёт ok и не трогает лимит', () => {
    reset();
    const ip = '203.0.113.1';
    assert.equal(evaluateLogin(true, ip), 'ok');
    assert.equal(evaluateLogin(true, ip), 'ok');
  });

  it('maxPerIp неверных → wrong, следующая → rate', () => {
    reset();
    const ip = '203.0.113.2';
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) {
      assert.equal(evaluateLogin(false, ip), 'wrong', `попытка ${i + 1}`);
    }
    assert.equal(evaluateLogin(false, ip), 'rate', 'превышение → rate');
  });

  it('успешный вход сбрасывает счётчики — админ не заперт после опечаток', () => {
    reset();
    const ip = '203.0.113.3';
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) evaluateLogin(false, ip);
    assert.equal(evaluateLogin(false, ip), 'rate');
    assert.equal(evaluateLogin(true, ip), 'ok'); // верный пароль
    assert.equal(evaluateLogin(false, ip), 'wrong', 'после успеха окно чистое');
  });

  it('разные IP независимы (в пределах глобального капа)', () => {
    reset();
    for (let i = 0; i < LOGIN_LIMITS.maxPerIp; i++) evaluateLogin(false, '203.0.113.4');
    assert.equal(evaluateLogin(false, '203.0.113.4'), 'rate');
    assert.equal(evaluateLogin(false, '203.0.113.5'), 'wrong', 'другой IP имеет своё окно');
  });
});

describe('глобальный потолок и защита от DoS-локаута', () => {
  it('РЕГРЕССИЯ (DoS): верный пароль логинит ДАЖЕ при исчерпанном глобальном лимите', () => {
    reset();
    // Атакующий выбивает глобальный кап неверными паролями с ротацией IP.
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal + 10; i++) {
      evaluateLogin(false, `198.51.100.${i % 256}-${i}`);
    }
    // Настоящий админ с ВЕРНЫМ паролем не заблокирован (на старом коде был бы).
    assert.equal(evaluateLogin(true, '203.0.113.7'), 'ok');
    assert.equal(evaluateLogin(true, '203.0.113.7'), 'ok', 'и повторно тоже ok');
  });

  it('НЕверные попытки упираются в глобальный потолок ровно после maxGlobal', () => {
    reset();
    let firstRate = -1;
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal * 2; i++) {
      // Уникальный IP на каждую попытку: пер-IP кап (5) не достигается, 'rate'
      // может прийти только из глобального.
      const outcome = evaluateLogin(false, `192.0.2.${i % 256}-${i}`);
      if (outcome === 'rate' && firstRate < 0) firstRate = i;
    }
    assert.equal(firstRate, LOGIN_LIMITS.maxGlobal, 'rate начинается на попытке #maxGlobal+1');
  });

  it('успешный вход сбрасывает и глобальное окно', () => {
    reset();
    for (let i = 0; i < LOGIN_LIMITS.maxGlobal + 5; i++) evaluateLogin(false, `192.0.2.${i % 256}-g${i}`);
    // Глобальный кап исчерпан: даже свежий IP с неверным паролем → rate.
    assert.equal(evaluateLogin(false, '203.0.113.40'), 'rate');
    // Верный вход чистит глобальное окно → следующая неудача снова wrong.
    assert.equal(evaluateLogin(true, '203.0.113.41'), 'ok');
    assert.equal(evaluateLogin(false, '203.0.113.42'), 'wrong');
  });
});

describe('задержка на неверном пароле', () => {
  it('loginFailDelay действительно ждёт заданное время', async () => {
    const started = process.hrtime.bigint();
    await loginFailDelay();
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    assert.ok(
      elapsedMs >= LOGIN_LIMITS.failDelayMs - 50,
      `ожидали ≥${LOGIN_LIMITS.failDelayMs}мс, получили ${elapsedMs}`,
    );
  });
});
