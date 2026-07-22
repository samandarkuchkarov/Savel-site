import { NextResponse } from 'next/server';

/**
 * iOS Universal Links: разрешает приложению Savel открывать savel.uz/pair/*.
 * Отдаётся как application/json без расширения — так требует iOS.
 *
 * appID = «<TeamID>.<BundleID>», например «ABCDE12345.com.savel». TeamID берём
 * из env IOS_APP_ID: в Xcode-проекте DEVELOPMENT_TEAM ещё не заведён, а
 * выдумывать его нельзя. Раньше здесь стоял литерал «TEAMID.com.savel» —
 * невалидный appID хуже отсутствия файла: Apple скачивает AASA, не находит
 * такую команду и держит Universal Links сломанными (плюс кеширует ответ).
 * Пока переменная не задана — честный 404.
 *
 * ⚠️ Одного файла мало: в iOS-приложении нужен entitlement Associated Domains
 * (`applinks:savel.uz`), иначе система этот AASA даже не запросит. Сейчас
 * .entitlements в проекте нет — см. DEPLOY.md.
 */

// Ответ зависит от env — не вмораживаем его в билд.
export const dynamic = 'force-dynamic';

export function GET() {
  const appId = process.env.IOS_APP_ID?.trim();
  if (!appId) {
    return new NextResponse('apple-app-site-association is not configured', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: [appId],
            // Те же пути, что у Android-intent-filter.
            components: [{ '/': '/pair/*' }],
          },
        ],
      },
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
