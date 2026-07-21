'use client';

/** «Повторить» при недоступной проверке кода: просто перезагружаем страницу —
 * серверный компонент заново спросит статус у API (кеша нет, dynamic). */
export default function RetryButton() {
  return (
    <button className="pairBtn pairBtnPrimary" type="button" onClick={() => location.reload()}>
      Повторить
    </button>
  );
}
