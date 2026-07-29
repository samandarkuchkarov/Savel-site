/**
 * Подписанные админ-сессии. Запуск: npm test (tsx --test).
 *
 * Здесь проверяется ровно то, ради чего cookie стал самодостаточным: он должен
 * переживать перезапуск процесса — и при этом не поддаваться подделке. Вторая
 * половина важнее первой: cookie теперь единственное, что стоит между
 * интернетом и приватными данными пар.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { issueSession, readSession, sessionKey, SESSION_TTL_MS } from './adminSession.js';

const ENV = { ADMIN_TOKEN: 'api-token-value', ADMIN_PANEL_PASSWORD: 'panel-password' };
const KEY = sessionKey(ENV)!;
const NOW = 1_700_000_000_000;

describe('sessionKey — без секретов сессий не бывает', () => {
  it('оба секрета на месте → ключ выводится', () => {
    assert.ok(KEY && KEY.length === 32);
  });

  it('нет ADMIN_TOKEN или пароля → null (не подписываем пустым ключом)', () => {
    assert.equal(sessionKey({ ADMIN_PANEL_PASSWORD: 'p' }), null);
    assert.equal(sessionKey({ ADMIN_TOKEN: 't' }), null);
    assert.equal(sessionKey({}), null);
    assert.equal(sessionKey({ ADMIN_TOKEN: '', ADMIN_PANEL_PASSWORD: '' }), null);
  });

  it('ключ детерминирован — иначе перезапуск снова разлогинивал бы', () => {
    assert.deepEqual(sessionKey(ENV), KEY);
  });
});

describe('выданная сессия принимается', () => {
  it('свежий cookie проходит', () => {
    const claims = readSession(issueSession(KEY, NOW), KEY, NOW + 1000);
    assert.ok(claims);
    assert.equal(claims.expiresAt, NOW + SESSION_TTL_MS);
  });

  it('ПЕРЕЖИВАЕТ перезапуск процесса — ради этого всё и делалось', () => {
    const cookie = issueSession(KEY, NOW);
    // «Перезапуск»: заново выводим ключ из тех же env, никакого общего состояния.
    const keyAfterRestart = sessionKey(ENV)!;
    assert.ok(readSession(cookie, keyAfterRestart, NOW + 60_000), 'после рестарта cookie должен работать');
  });

  it('два входа подряд дают РАЗНЫЕ cookie', () => {
    const a = issueSession(KEY, NOW);
    const b = issueSession(KEY, NOW);
    assert.notEqual(a, b);
    assert.notEqual(readSession(a, KEY, NOW)!.nonce, readSession(b, KEY, NOW)!.nonce);
  });

  it('в cookie нет ничего, производного от пароля в открытом виде', () => {
    const cookie = issueSession(KEY, NOW);
    assert.ok(!cookie.includes(ENV.ADMIN_PANEL_PASSWORD));
    assert.ok(!cookie.includes(ENV.ADMIN_TOKEN));
  });
});

describe('сессия отклоняется', () => {
  it('просроченная', () => {
    const cookie = issueSession(KEY, NOW);
    assert.equal(readSession(cookie, KEY, NOW + SESSION_TTL_MS + 1), null);
    // Ровно в момент истечения — уже нельзя.
    assert.equal(readSession(cookie, KEY, NOW + SESSION_TTL_MS), null);
  });

  it('продлённая вручную: срок подделан, подпись больше не сходится', () => {
    const cookie = issueSession(KEY, NOW);
    const [v, , nonce, sig] = cookie.split('.');
    const forged = [v, (NOW + 10 * SESSION_TTL_MS).toString(36), nonce, sig].join('.');
    assert.equal(readSession(forged, KEY, NOW + SESSION_TTL_MS + 1), null);
  });

  it('подменённый nonce', () => {
    const [v, exp, , sig] = issueSession(KEY, NOW).split('.');
    assert.equal(readSession([v, exp, 'deadbeef', sig].join('.'), KEY, NOW), null);
  });

  it('испорченная подпись (в т.ч. другой длины — timingSafeEqual не должен бросать)', () => {
    const cookie = issueSession(KEY, NOW);
    const [v, exp, nonce] = cookie.split('.');
    for (const sig of ['', 'x', 'A'.repeat(43), 'A'.repeat(200)]) {
      assert.equal(readSession([v, exp, nonce, sig].join('.'), KEY, NOW), null, `sig=${sig.slice(0, 8)}`);
    }
  });

  it('подписанная ЧУЖИМ ключом — смена пароля обесценивает все cookie', () => {
    const cookie = issueSession(KEY, NOW);
    const afterPasswordChange = sessionKey({ ...ENV, ADMIN_PANEL_PASSWORD: 'new' })!;
    assert.equal(readSession(cookie, afterPasswordChange, NOW), null);
    const afterTokenRotate = sessionKey({ ...ENV, ADMIN_TOKEN: 'new' })!;
    assert.equal(readSession(cookie, afterTokenRotate, NOW), null);
  });

  it('мусор вместо cookie', () => {
    for (const v of [undefined, '', '.', 'a.b.c', 'a.b.c.d.e', 's1..x.y', 'null', '{}']) {
      assert.equal(readSession(v, KEY, NOW), null, `value=${v}`);
    }
  });

  it('чужая версия формата', () => {
    const [, exp, nonce, sig] = issueSession(KEY, NOW).split('.');
    assert.equal(readSession(['s2', exp, nonce, sig].join('.'), KEY, NOW), null);
  });

  it('без ключа не пускаем никого — даже с корректным cookie', () => {
    assert.equal(readSession(issueSession(KEY, NOW), null, NOW), null);
  });
});
