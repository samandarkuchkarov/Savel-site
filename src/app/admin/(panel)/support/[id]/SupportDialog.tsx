'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supportMessageCursor, type AdminSupportMessage } from '@/lib/adminSupport';

/**
 * Живой диалог поддержки. Ходит ТОЛЬКО в наш /admin/api/support (админ-cookie);
 * ADMIN_TOKEN остаётся на сервере Next. Обновление — поллинг новых сообщений
 * keyset-курсором каждые 3с; отправка идемпотентна по clientId (ретрай после
 * сбоя переиспользует тот же id и не создаёт дубль).
 */

const POLL_MS = 3000;
const PAGE = 50;

function mergeMessages(
  existing: AdminSupportMessage[],
  incoming: AdminSupportMessage[],
): AdminSupportMessage[] {
  if (incoming.length === 0) return existing;
  const ids = new Set(existing.map(m => m.id));
  const fresh = incoming.filter(m => !ids.has(m.id));
  if (fresh.length === 0) return existing;
  return [...existing, ...fresh].sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

function timeRu(at: string): string {
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export default function SupportDialog({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: AdminSupportMessage[];
}) {
  const [messages, setMessages] = useState<AdminSupportMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEarlier, setHasEarlier] = useState(initialMessages.length >= PAGE);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  // Идемпотентность ретрая: упавшая отправка хранит свой clientId и текст.
  const failedSend = useRef<{ text: string; clientId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  // Прочитанность: какой последний user-message уже отмечен (не спамим read).
  const lastReadAnchor = useRef<string | null>(null);

  const markRead = useCallback(
    (list: AdminSupportMessage[]) => {
      const lastUser = [...list].reverse().find(m => m.sender === 'user');
      if (!lastUser || lastReadAnchor.current === lastUser.id) return;
      lastReadAnchor.current = lastUser.id;
      void fetch('/admin/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', threadId, upToMessageId: lastUser.id }),
      }).catch(() => {
        // не отметилось — повторим при следующем поллинге
        if (lastReadAnchor.current === lastUser.id) lastReadAnchor.current = null;
      });
    },
    [threadId],
  );

  // Открыли диалог — сообщения пользователя считаются прочитанными.
  useEffect(() => {
    markRead(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Поллинг новых сообщений (строго новее последнего известного).
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      const list = messagesRef.current;
      const after = list.length ? supportMessageCursor(list[list.length - 1]) : '';
      const qs = new URLSearchParams({ threadId, limit: String(PAGE) });
      if (after) qs.set('after', after);
      try {
        const res = await fetch(`/admin/api/support?${qs}`, { cache: 'no-store' });
        if (!res.ok || stopped) return;
        const incoming = (await res.json()) as AdminSupportMessage[];
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        setMessages(prev => {
          const merged = mergeMessages(prev, incoming);
          markRead(merged);
          return merged;
        });
      } catch {
        // транзиентная ошибка — следующий тик повторит
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [threadId, markRead]);

  // Актуальный список для поллинга без пересоздания интервала.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Автоскролл вниз при новых сообщениях, если админ уже был внизу.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const loadEarlier = async () => {
    if (loadingEarlier || messages.length === 0) return;
    setLoadingEarlier(true);
    try {
      const before = supportMessageCursor(messages[0]);
      const qs = new URLSearchParams({ threadId, before, limit: String(PAGE) });
      const res = await fetch(`/admin/api/support?${qs}`, { cache: 'no-store' });
      if (res.ok) {
        const older = (await res.json()) as AdminSupportMessage[];
        setHasEarlier(older.length >= PAGE);
        if (older.length) setMessages(prev => mergeMessages(prev, older));
      }
    } finally {
      setLoadingEarlier(false);
    }
  };

  const send = async (retry = false) => {
    const text = retry ? failedSend.current?.text : draft.trim();
    if (!text || pending) return;
    // clientId: новый на новую отправку, ПРЕЖНИЙ на ретрай (сервер дедуплицирует).
    const clientId = retry && failedSend.current ? failedSend.current.clientId : crypto.randomUUID();
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/admin/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', threadId, text, clientId }),
      });
      const body = (await res.json().catch(() => ({}))) as
        | AdminSupportMessage
        | { message?: string };
      if (!res.ok) {
        throw new Error((body as { message?: string }).message ?? `Ошибка ${res.status}`);
      }
      failedSend.current = null;
      if (!retry) setDraft('');
      stickToBottom.current = true;
      setMessages(prev => mergeMessages(prev, [body as AdminSupportMessage]));
    } catch (e) {
      failedSend.current = { text, clientId };
      setError(e instanceof Error ? e.message : 'Не удалось отправить — попробуйте ещё раз');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="statCard" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        ref={scrollRef}
        onScroll={event => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        style={{
          height: 480,
          overflowY: 'auto',
          padding: '18px 18px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#fdf6f1',
        }}>
        {hasEarlier ? (
          <button
            type="button"
            /* не sortBtn: тот фиксированные 32×32 под стрелки — длинная подпись вываливается */
            className="filterChip"
            onClick={loadEarlier}
            disabled={loadingEarlier}
            style={{ alignSelf: 'center' }}>
            {loadingEarlier ? 'Загружаем…' : 'Показать более ранние'}
          </button>
        ) : null}
        {messages.length === 0 ? (
          <div style={{ color: '#8b7d78', textAlign: 'center', marginTop: 40, fontWeight: 600 }}>
            Сообщений пока нет.
          </div>
        ) : (
          messages.map(message => {
            const support = message.sender === 'support';
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: support ? 'flex-end' : 'flex-start',
                  maxWidth: '72%',
                  background: support ? '#fd4f61' : '#fff',
                  color: support ? '#fff' : '#3b2c2a',
                  borderRadius: 14,
                  borderBottomRightRadius: support ? 5 : 14,
                  borderBottomLeftRadius: support ? 14 : 5,
                  padding: '9px 13px',
                  boxShadow: '0 8px 20px -14px rgba(230,90,114,0.45)',
                  fontSize: 14,
                  lineHeight: 1.45,
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}>
                {message.text}
                <div
                  style={{
                    fontSize: 10.5,
                    opacity: 0.75,
                    marginTop: 3,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                  {timeRu(message.at)}
                  {support ? (message.readAt ? ' · прочитано' : ' · отправлено') : ''}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ borderTop: '1px solid #f2e4dd', padding: 14, background: '#fff' }}>
        {error ? (
          <div className="noteChipErr" style={{ marginBottom: 10 }}>
            {error}{' '}
            <button
              type="button"
              className="adminBtnLink"
              onClick={() => send(true)}
              disabled={pending}>
              Повторить
            </button>
          </div>
        ) : null}
        <form
          className="adminForm"
          onSubmit={event => {
            event.preventDefault();
            void send();
          }}>
          <input
            type="text"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="Ответ от поддержки…"
            maxLength={2000}
            style={{ flex: 1 }}
          />
          <button className="adminBtn" type="submit" disabled={pending || !draft.trim()}>
            {pending ? 'Отправляем…' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}
