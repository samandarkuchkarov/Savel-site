/**
 * Состояние формы админки: ошибка сохранения показывается НАД формой, а
 * введённое возвращается в поля.
 *
 * Раньше любой сбой (API прилёг, сервер отверг значение) вылетал исключением из
 * Server Action — Next.js показывал общий экран ошибки, и всё набранное
 * пропадало. Теперь действие ловит ошибку и возвращает её сюда.
 *
 * Почему ошибки мало и нужны ещё и `values`: после Server Action Next.js
 * перерисовывает серверное дерево, React заново применяет defaultValue — и поля
 * откатываются к последнему сохранённому значению, хотя сами DOM-узлы живы.
 * Поэтому действие возвращает то, что реально отправили, а AdminForm вписывает
 * это обратно (см. AdminForm.tsx).
 *
 * Модуль client-safe (никакого 'server-only') — типы нужны и клиентской обёртке.
 */

export interface FormState {
  /** null — ошибок нет (исходное состояние и успешная отправка). */
  error: string | null;
  /** Отправленные значения полей (name → value); файлы не сохраняем. */
  values?: Record<string, string>;
}

export const FORM_OK: FormState = { error: null };

/** Снимок отправленных полей: строки да, файлы нет (их всё равно не восстановить). */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

/** Ошибка с понятным текстом + сохранение введённого. */
export function formError(message: string, formData?: FormData): FormState {
  return { error: message, values: formData ? submittedValues(formData) : undefined };
}

/**
 * Превращает пойманное исключение в состояние формы.
 *
 * ⚠️ Вызывать ТОЛЬКО вокруг самой работы (запросов к API). redirect() и
 * notFound() в Next.js реализованы через throw, поэтому их нельзя оборачивать
 * в try — иначе успешное сохранение «поймается» как ошибка и никуда не уведёт.
 * Держите redirect ПОСЛЕ try/catch (см. любую форму админки).
 */
export function toFormError(e: unknown, formData?: FormData): FormState {
  const message = e instanceof Error ? e.message : String(e);
  // Сообщения API уже человекочитаемые; голый статус переводим в понятное.
  if (/^API 401$/.test(message) || message === 'unauthorized') {
    return formError('Сессия админки истекла — войдите заново и повторите.', formData);
  }
  if (/^API 5\d\d$/.test(message) || /fetch failed|ECONNREFUSED/i.test(message)) {
    return formError('Сервер недоступен. Проверьте Savel_server и повторите — введённое на месте.', formData);
  }
  return formError(message || 'Не удалось сохранить', formData);
}
