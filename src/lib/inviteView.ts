import type { InviteStatus } from './inviteApi';

/**
 * Чистая view-логика лендинга приглашения (тестируется node:test без Next):
 * какой заголовок/текст показывать и можно ли обещать подарок. Подарок
 * обещаем ТОЛЬКО при подтверждённом сервером status='valid' — regex-совпадение
 * формата или ошибка API подарком не считаются.
 */

export interface InviteViewModel {
  kind: 'valid' | 'invalid' | 'expired' | 'revoked' | 'error';
  title: string;
  sub: string;
  /** Показывать код, кнопки установки и инструкцию (только valid). */
  showGift: boolean;
  /** Показывать кнопку «Повторить» (только ошибка проверки). */
  showRetry: boolean;
}

export function inviteViewModel(formatOk: boolean, status: InviteStatus | null): InviteViewModel {
  if (!formatOk) {
    return {
      kind: 'invalid',
      title: 'Ссылка недействительна',
      sub: 'Код в ссылке некорректен. Попросите друзей отправить ссылку из приложения ещё раз.',
      showGift: false,
      showRetry: false,
    };
  }
  if (!status) {
    // Сеть/сервер недоступны: это НЕ valid и НЕ invalid — отдельное состояние.
    return {
      kind: 'error',
      title: 'Не удалось проверить приглашение',
      sub: 'Похоже, возникла временная неполадка. Попробуйте ещё раз через минуту.',
      showGift: false,
      showRetry: true,
    };
  }
  switch (status.status) {
    case 'valid':
      return {
        kind: 'valid',
        title: 'Вас приглашают в Savel',
        // Месяц Savel+ приглашённой паре НЕ обещаем — награда программы уходит
        // пригласившему; новых ждут стартовые бонусы приложения.
        sub:
          'Друзья приглашают вас в Savel — приложение для двоих: вопросы, чек-апы отношений, ' +
          'традиции и цели. Установите приложение, соедините профили с партнёром и введите код ' +
          'приглашения из ссылки.',
        showGift: true,
        showRetry: false,
      };
    case 'expired':
      return {
        kind: 'expired',
        title: 'Срок действия приглашения истёк',
        sub: 'Попросите друзей отправить новую ссылку из приложения — и она снова будет работать.',
        showGift: false,
        showRetry: false,
      };
    case 'revoked':
    case 'unavailable':
      return {
        kind: 'revoked',
        title: 'Приглашение больше недоступно',
        sub: 'Эта ссылка перестала действовать. Попросите друзей отправить новую из приложения.',
        showGift: false,
        showRetry: false,
      };
    case 'invalid':
      return {
        kind: 'invalid',
        title: 'Ссылка недействительна',
        sub: 'Такого кода приглашения не существует. Попросите друзей отправить ссылку из приложения ещё раз.',
        showGift: false,
        showRetry: false,
      };
    default:
      // Неизвестный статус нового сервера — не считаем ни valid, ни invalid.
      return {
        kind: 'error',
        title: 'Не удалось проверить приглашение',
        sub: 'Попробуйте ещё раз через минуту.',
        showGift: false,
        showRetry: true,
      };
  }
}

/**
 * Metadata нейтральна ВСЕГДА (og-обещание подарка по одному regex — источник
 * фейковых превью в мессенджерах; отдельный fetch в generateMetadata удвоил бы
 * запросы и упёрся в rate limit). Нейтральный текст не противоречит ни одному
 * состоянию страницы. Страница закрыта от индексации.
 */
export const INVITE_METADATA = {
  title: 'Приглашение в Savel',
  description: 'Мы с парой ведём и улучшаем отношения в Savel — присоединяйтесь!',
} as const;
