/**
 * View-логика лендинга /invite/[code]: подарок обещается ТОЛЬКО при
 * подтверждённом сервером valid. Запуск: npm test (tsx --test).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INVITE_METADATA, inviteViewModel } from './inviteView.js';
import type { InviteStatus } from './inviteApi.js';

const status = (s: InviteStatus['status']): InviteStatus => ({
  status: s,
  eligibleForPairReward: s === 'valid',
});

describe('inviteViewModel', () => {
  it('valid: страница обещает месяц Savel+ и показывает код', () => {
    const view = inviteViewModel(true, status('valid'));
    assert.equal(view.kind, 'valid');
    assert.ok(view.title.includes('дарят месяц Savel+')); // неразрывный пробел из дизайна
    assert.equal(view.showGift, true);
    assert.equal(view.showRetry, false);
    // Текст обещает подарок ПАРЕ и не обещает бонус пригласившему.
    assert.ok(view.sub.includes('вашей паре'));
  });

  it('invalid (несуществующий код): никакого обещания подарка', () => {
    const view = inviteViewModel(true, status('invalid'));
    assert.equal(view.kind, 'invalid');
    assert.equal(view.showGift, false);
    assert.ok(!view.title.includes('Savel+'));
    assert.ok(!view.sub.includes('месяц Savel+ бесплатно'));
  });

  it('неверный формат: invalid без обращения к статусу', () => {
    const view = inviteViewModel(false, null);
    assert.equal(view.kind, 'invalid');
    assert.equal(view.showGift, false);
    assert.equal(view.showRetry, false);
  });

  it('expired и revoked — отдельные состояния с собственными текстами', () => {
    const expired = inviteViewModel(true, status('expired'));
    assert.equal(expired.kind, 'expired');
    assert.ok(expired.title.includes('истёк'));
    assert.ok(expired.sub.includes('новую ссылку'));
    assert.equal(expired.showGift, false);

    const revoked = inviteViewModel(true, status('revoked'));
    assert.equal(revoked.kind, 'revoked');
    assert.ok(revoked.title.includes('больше недоступно'));
    assert.equal(revoked.showGift, false);
    assert.notEqual(expired.title, revoked.title);

    // unavailable ведёт себя как revoked (недоступно), не как ошибка.
    assert.equal(inviteViewModel(true, status('unavailable')).kind, 'revoked');
  });

  it('ошибка сервера/сети: retry, НЕ valid и НЕ invalid', () => {
    const view = inviteViewModel(true, null);
    assert.equal(view.kind, 'error');
    assert.equal(view.showRetry, true);
    assert.equal(view.showGift, false);
    assert.ok(view.title.includes('Не удалось проверить'));
  });

  it('неизвестный статус нового сервера: тоже retry, а не valid', () => {
    const view = inviteViewModel(true, { status: 'brand_new' as InviteStatus['status'], eligibleForPairReward: true });
    assert.equal(view.kind, 'error');
    assert.equal(view.showGift, false);
  });
});

describe('metadata и кеширование', () => {
  it('metadata нейтральна: не обещает подарок для непроверенного кода', () => {
    const text = `${INVITE_METADATA.title} ${INVITE_METADATA.description}`;
    assert.ok(!text.includes('дарят'));
    assert.ok(!text.includes('подарок'));
    assert.ok(!text.includes('бесплатно'));
  });

  it('страница не кеширует статус: force-dynamic + no-store на месте (regression guard)', () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const page = readFileSync(path.join(dir, '../app/invite/[code]/page.tsx'), 'utf8');
    assert.ok(page.includes(`export const dynamic = 'force-dynamic'`));
    const api = readFileSync(path.join(dir, 'inviteApi.ts'), 'utf8');
    assert.ok(api.includes(`cache: 'no-store'`));
    // Metadata страницы построена из нейтральных констант, не из статуса.
    assert.ok(page.includes('INVITE_METADATA.title'));
  });
});
