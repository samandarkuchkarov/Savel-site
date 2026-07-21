/**
 * Извлечение реального IP посетителя из X-Forwarded-For при ОДНОМ доверенном
 * прокси (Caddy). Запуск: npm test (tsx --test).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickClientIp } from './clientIp.js';

describe('pickClientIp — доверенная proxy-цепочка (1 hop)', () => {
  it('единственная запись = реальный клиент', () => {
    assert.equal(pickClientIp('203.0.113.7'), '203.0.113.7');
  });

  it('спуфинг клиента отбрасывается: берём правую запись, добавленную Caddy', () => {
    // Клиент прислал поддельный XFF, Caddy добавил реальный IP справа.
    assert.equal(pickClientIp('1.1.1.1, 203.0.113.7'), '203.0.113.7');
    assert.equal(pickClientIp('9.9.9.9, 8.8.8.8, 203.0.113.7'), '203.0.113.7');
  });

  it('IPv6 нормализуется (валидный, ::ffff: снимается)', () => {
    assert.equal(
      pickClientIp('2001:db8:85a3:8d3:1319:8a2e:370:7348'),
      '2001:db8:85a3:8d3:1319:8a2e:370:7348',
    );
    assert.equal(pickClientIp('::ffff:203.0.113.7'), '203.0.113.7');
  });

  it('отсутствующий/пустой/мусорный XFF → null (не общий bucket)', () => {
    assert.equal(pickClientIp(null), null);
    assert.equal(pickClientIp(''), null);
    assert.equal(pickClientIp('   '), null);
    assert.equal(pickClientIp('not-an-ip'), null);
    assert.equal(pickClientIp('1.1.1.1, garbage'), null); // правая запись невалидна
  });

  it('два доверенных прокси (Cloudflare+Caddy): берём вторую справа', () => {
    // client, cloudflare, caddy → при 2 доверенных hops клиент = запись слева от них.
    assert.equal(pickClientIp('203.0.113.7, 172.16.0.1', 2), '203.0.113.7');
  });
});
