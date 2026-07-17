'use client';

import type { ComponentProps } from 'react';

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
  return (
    <button
      {...rest}
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
