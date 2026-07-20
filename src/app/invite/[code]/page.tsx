import type { Metadata } from 'next';
import PairActions from '../../pair/[code]/PairActions';
import '../../pair/[code]/pair.css';

/**
 * Лендинг реферального приглашения: savel.uz/invite/<SAVEL-XXXX>.
 * Друг пары открыл ссылку — показываем код приглашения крупно: установил
 * приложение → на экране «Соедините профили» вводит этот код («Есть код
 * приглашения от друзей?») → после соединения его паре месяц Savel+.
 */

const PLAY_URL = 'https://savel.uz'; // TODO: заменить на Google Play, когда появится
const APPSTORE_URL = 'https://savel.uz'; // TODO: заменить на App Store

function normalizeCode(raw: string): string | null {
  const code = decodeURIComponent(raw).trim().toUpperCase();
  return /^SAVEL-[A-Z2-9]{4}$/.test(code) ? code : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const valid = normalizeCode(code);
  const title = 'Месяц Savel+ в подарок';
  const description = valid
    ? 'Вас пригласили в Savel — приложение для пар. Установите его и получите месяц Savel+ бесплатно.'
    : 'Savel — приложение для пар.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
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
            <h1 className="pairTitle">Вам дарят месяц&nbsp;Savel+</h1>
            <p className="pairSub">
              Друзья приглашают вас в Savel — приложение для двоих: вопросы, чек-апы отношений,
              традиции и цели. Установите приложение, соедините профили с партнёром и введите код
              приглашения — вашей паре откроется месяц Savel+ бесплатно.
            </p>

            <div className="pairCodeLabel">Код приглашения</div>
            <div className="pairCode">{valid}</div>

            <PairActions code={valid} playUrl={PLAY_URL} appStoreUrl={APPSTORE_URL} />

            <p className="pairHint">
              Куда вводить: экран «Соедините ваши профили» → «Есть код приглашения от друзей?»
            </p>
          </>
        ) : (
          <>
            <h1 className="pairTitle">Ссылка недействительна</h1>
            <p className="pairSub">
              Код в ссылке некорректен. Попросите друзей отправить ссылку из приложения ещё раз.
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
