import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminApi';

/**
 * Мост для живого монитора сервера: браузер держит EventSource сюда (с
 * админ-cookie), а Next тянет SSE из API с ADMIN_TOKEN и переливает поток как
 * есть. Токен в браузерный JavaScript не попадает.
 *
 * ⚠️ Путь обязан начинаться с /admin — админ-cookie выставлен с `path: '/admin'`,
 * и на /api/... браузер его просто не пришлёт (та же грабля, что была у
 * поддержки: см. комментарий в api/support/route.ts).
 */

const API_URL = process.env.SAVEL_API_URL ?? 'http://localhost:4000';

// Поток бесконечный: кэшировать и пытаться отрендерить статически нечего.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: 'Сессия истекла — войдите заново' }, { status: 401 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/admin/system/stream`, {
      headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN ?? '', Accept: 'text/event-stream' },
      // Закрытая вкладка обязана обрывать и запрос к API, иначе подписчики
      // копились бы на сервере, а сэмплер писал бы в никуда.
      signal: request.signal,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'API недоступен' }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ message: `API ${upstream.status}` }, { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
