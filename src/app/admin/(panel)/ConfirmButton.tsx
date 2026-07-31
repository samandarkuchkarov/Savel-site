'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';

type Props = ComponentProps<'button'> & {
  /** Текст подтверждения; отмена в confirm() блокирует сабмит формы. */
  confirmText: string;
};

/**
 * Кнопка разрушительного действия с обязательным подтверждением: удаление
 * пользователя/подборки/рассылки — одно нажатие без вопроса приводило к
 * безвозвратной потере данных (каскады в БД).
 *
 * ⚠️ pending берём у формы через useFormStatus, а НЕ своим useState. Клик —
 * дискретное событие, и React применяет setState из onClick СИНХРОННО: кнопка
 * успевала стать disabled до того, как браузер выполнял отправку формы (это её
 * activation behavior, оно идёт после обработчиков), а disabled-кнопка форму не
 * отправляет. В итоге подтверждение спрашивалось, а удаление молча не
 * происходило — ни запроса, ни ошибки. useFormStatus меняет disabled уже ПОСЛЕ
 * старта отправки, поэтому защита от двойного клика остаётся.
 */
export default function ConfirmButton({ confirmText, onClick, ...rest }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      disabled={rest.disabled || pending}
      aria-busy={pending || undefined}
      onClick={event => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
