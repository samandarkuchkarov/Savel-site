/**
 * Client-safe типы и утилиты чата поддержки. Вынесены из adminApi.ts, потому что
 * тот модуль `server-only` (next/headers, ADMIN_TOKEN) — а клиентский SupportDialog
 * импортирует отсюда runtime-функцию `supportMessageCursor`. Держать её в
 * server-only модуле ломало production-сборку (server-код тянулся в client-бандл).
 * Здесь НЕТ ни server-only, ни next/headers, ни секретов — можно импортировать
 * и на сервере, и в браузере.
 */

export interface AdminSupportThread {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  user_photo_url: string | null;
  last_text: string | null;
  last_sender: 'user' | 'support' | null;
  last_at: string | null;
  /** Непрочитанные ПОДДЕРЖКОЙ сообщения пользователя. */
  unread: number;
  updated_at: string;
}

export interface AdminSupportMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  at: string;
  readAt: string | null;
  clientId: string | null;
}

/** Составной keyset-курсор сообщения — «<at>|<id>», как в приложении. */
export function supportMessageCursor(message: AdminSupportMessage): string {
  return `${message.at}|${message.id}`;
}
