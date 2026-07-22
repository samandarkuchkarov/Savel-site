import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminApi';

/**
 * Браузерный мост для живого диалога поддержки: клиентский компонент админки
 * поллит/отправляет сюда С АДМИН-COOKIE, а Next-сервер ходит в API с
 * ADMIN_TOKEN. Токен никогда не попадает в браузерный JavaScript.
 *
 * ⚠️ Путь обязан начинаться с /admin. Админ-cookie ставится с `path: '/admin'`
 * (см. admin/login/page.tsx), а браузер шлёт cookie только на совпадающий по
 * префиксу путь (RFC 6265). Раньше маршрут жил на /api/admin/support — cookie
 * туда НЕ уходил, isAdminAuthed() всегда возвращал false, и диалог показывал
 * «Сессия истекла — войдите заново» на каждой отправке; перелогин не помогал.
 */

const API_URL = process.env.SAVEL_API_URL ?? 'http://localhost:4000';

async function proxy(path: string, init?: RequestInit): Promise<NextResponse> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: 'Сессия истекла — войдите заново' }, { status: 401 });
  }
  try {
    const res = await fetch(`${API_URL}/v1/admin${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': process.env.ADMIN_TOKEN ?? '',
      },
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'API недоступен' }, { status: 502 });
  }
}

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** GET /api/admin/support?threadId=&after=&before=&limit= → страница сообщений. */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const threadId = url.searchParams.get('threadId');
  if (!isUuid(threadId)) {
    return NextResponse.json({ message: 'threadId обязателен' }, { status: 422 });
  }
  const qs = new URLSearchParams();
  for (const key of ['after', 'before', 'limit'] as const) {
    const value = url.searchParams.get(key);
    if (value) qs.set(key, value);
  }
  return proxy(`/support/threads/${threadId}/messages${qs.size ? `?${qs}` : ''}`);
}

/**
 * POST /api/admin/support
 *  { action: 'send', threadId, text, clientId? } — ответ поддержки (идемпотентен);
 *  { action: 'read', threadId, upToMessageId? } — отметить прочитанным.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isUuid(body.threadId)) {
    return NextResponse.json({ message: 'threadId обязателен' }, { status: 422 });
  }
  if (body.action === 'send') {
    return proxy(`/support/threads/${body.threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: body.text, clientId: body.clientId }),
    });
  }
  if (body.action === 'read') {
    return proxy(`/support/threads/${body.threadId}/read`, {
      method: 'POST',
      body: JSON.stringify(isUuid(body.upToMessageId) ? { upToMessageId: body.upToMessageId } : {}),
    });
  }
  return NextResponse.json({ message: 'Неизвестное действие' }, { status: 422 });
}
