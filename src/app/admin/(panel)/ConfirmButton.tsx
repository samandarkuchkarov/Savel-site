'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';

type Props = ComponentProps<'button'> & {
  /** Текст подтверждения; отмена в confirm() блокирует сабмит формы. */
  confirmText: string;
};

/**
 * Кнопка разрушительного действия с обязательным подтверждением: удаление
 * пользователя/подборки/рассылки — одно нажатие без вопроса приводило к
 * безвозвратной потере данных (каскады в БД).
 */
export default function ConfirmButton({ confirmText, onClick, ...rest }: Props) {
  const [pending, setPending] = useState(false);
  return (
    <button
      {...rest}
      disabled={rest.disabled || pending}
      aria-busy={pending || undefined}
      onClick={event => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(confirmText)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) return;
        setPending(true);
      }}
    />
  );
}
