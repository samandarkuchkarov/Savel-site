import type { Metadata } from 'next';
import PairActions from './PairActions';
import './pair.css';

/**
 * Лендинг-приглашение: партнёр открыл ссылку savel.uz/pair/<код>.
 * Если приложение установлено и ссылка верифицирована (assetlinks.json) —
 * Android открывает приложение напрямую, эта страница не показывается. Иначе
 * показываем код крупно + кнопки установки (deferred deep linking без SDK:
 * код виден на странице, партнёр вводит его в приложении после установки).
 */

const PLAY_URL = 'https://savel.uz'; // TODO: заменить на Google Play, когда появится
const APPSTORE_URL = 'https://savel.uz'; // TODO: заменить на App Store

function normalizeCode(raw: string): string | null {
  const digits = decodeURIComponent(raw).replace(/\D/g, '');
  return /^\d{6}$/.test(digits) ? digits : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const valid = normalizeCode(code);
  const title = 'Приглашение в Savel';
  const description = valid
    ? `Вас приглашают соединить профили в Savel. Код пары: ${valid}.`
    : 'Соедините профили в Savel.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    robots: { index: false, follow: false }, // страницы кодов не индексируем
  };
}

export default async function PairPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const valid = normalizeCode(code);

  return (
    <main className="pairMain">
      <div className="pairCard">
        <div className="pairBrand">
          Savel <span>♥</span>
        </div>

        {valid ? (
          <>
            <h1 className="pairTitle">Вас приглашают в&nbsp;Savel</h1>
            <p className="pairSub">
              Приложение для двоих — вопросы, чек-апы отношений и тёплые традиции. Установите
              приложение и введите код, чтобы соединить профили.
            </p>

            <div className="pairCodeLabel">Код пары</div>
            <div className="pairCode">{`${valid.slice(0, 3)} ${valid.slice(3)}`}</div>

            <PairActions code={valid} playUrl={PLAY_URL} appStoreUrl={APPSTORE_URL} />

            <p className="pairHint">
              Уже установили приложение? Откройте эту ссылку на телефоне — код подставится
              автоматически.
            </p>
          </>
        ) : (
          <>
            <h1 className="pairTitle">Ссылка недействительна</h1>
            <p className="pairSub">
              Код в ссылке некорректен или устарел. Попросите партнёра поделиться актуальным кодом
              из приложения.
            </p>
            <a className="pairBtn pairBtnPrimary" href="https://savel.uz">
              О приложении Savel
            </a>
          </>
        )}
      </div>
    </main>
  );
}
