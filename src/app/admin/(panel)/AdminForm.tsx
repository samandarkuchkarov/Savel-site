'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { FORM_OK, type FormState } from '@/lib/formState';

/**
 * Обёртка над <form> для форм админки: показывает ошибку сохранения НАД полями
 * и возвращает в них введённое (см. lib/formState). Клиентский тут только сам
 * <form>, а поля приезжают server-rendered через children — поэтому формы могут
 * по-прежнему пользоваться server-only хелперами (adminAssetUrl и т.п.).
 */
export default function AdminForm({
  action,
  children,
  className,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, FORM_OK);
  const formRef = useRef<HTMLFormElement>(null);

  // После неудачного сохранения Next.js перерисовывает серверное дерево, React
  // заново применяет defaultValue — и поля откатываются к последнему
  // сохранённому значению (сами DOM-узлы при этом живы, они не пересоздаются).
  // Поэтому вписываем отправленное обратно САМИ, уже после отрисовки.
  // defaultValue ставим вместе с value: иначе следующая перерисовка снова
  // затрёт поле «сохранённым» значением.
  useEffect(() => {
    const form = formRef.current;
    if (!form || !state.error || !state.values) return;
    const values = state.values;
    for (const element of Array.from(form.elements)) {
      const field = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const name = field.name;
      if (!name) continue;
      const type = (field as HTMLInputElement).type;
      // Файл восстановить нельзя (браузер запрещает) — картинку выберут заново.
      if (type === 'file') continue;
      if (type === 'checkbox' || type === 'radio') {
        const input = field as HTMLInputElement;
        const checked =
          type === 'checkbox'
            ? Object.prototype.hasOwnProperty.call(values, name)
            : values[name] === input.value;
        input.checked = checked;
        input.defaultChecked = checked;
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(values, name)) continue;
      field.value = values[name]!;
      if ('defaultValue' in field) field.defaultValue = values[name]!;
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {state.error ? (
        <p className="formError" role="alert">
          {state.error}
        </p>
      ) : null}
      {children}
    </form>
  );
}

/**
 * Кнопка отправки, которая сама блокируется на время сохранения: без этого
 * двойной клик по «Создать» отправлял форму дважды.
 */
export function SubmitButton({
  children,
  className = 'adminBtn',
  pendingLabel = 'Сохраняем…',
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending || undefined}>
      {pending ? pendingLabel : children}
    </button>
  );
}
