import { NextResponse } from 'next/server';

/**
 * iOS Universal Links: разрешает приложению Savel открывать savel.uz/pair/*.
 * TEAMID подставим из Apple Developer при сборке iOS (сейчас плейсхолдер —
 * файл готов, чтобы включить одной правкой). Отдаётся как application/json без
 * расширения — так требует iOS.
 */
const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'TEAMID.com.savel',
        paths: ['/pair/*'],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(AASA);
}
