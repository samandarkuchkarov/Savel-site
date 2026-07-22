import type { Metadata } from 'next';
import PairActions from '../../pair/[code]/PairActions';
import RetryButton from './RetryButton';
import { fetchInviteStatus } from '@/lib/inviteApi';
import { INVITE_METADATA, inviteViewModel } from '@/lib/inviteView';
import '../../pair/[code]/pair.css';

/**
 * Лендинг реферального приглашения: savel.uz/invite/<SAVEL-XXXXXX>.
 * Код и кнопки установки показываются ТОЛЬКО после подтверждения кода сервером
 * (GET /public/referrals/:code/status): несуществующий, отозванный или истёкший
 * код страницу приглашения не собирает. Месяц Savel+ приглашённой паре НЕ
 * обещается — награда программы уходит пригласившему. Проверка информационная —
 * истину решает POST /referral/redeem при вводе кода в приложении.
 */

const PLAY_URL = 'https://savel.uz'; // TODO: заменить на Google Play, когда появится
const APPSTORE_URL = 'https://savel.uz'; // TODO: заменить на App Store

// Статус кода не кешируем: код могут отозвать в любой момент.
export const dynamic = 'force-dynamic';

/** Новые коды — SAVEL-XXXXXX (6), legacy — SAVEL-XXXX (4); принимаем 4–8. */
function normalizeCode(raw: string): string | null {
  const code = decodeURIComponent(raw).trim().toUpperCase();
  return /^SAVEL-[A-Z2-9]{4,8}$/.test(code) ? code : null;
}

/**
 * Metadata всегда нейтральна (см. INVITE_METADATA): og-обещание подарка по
 * одному совпадению regex рисовало бы фейковые превью для любых выдуманных
 * кодов. Индексацию оставляем закрытой.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: INVITE_METADATA.title,
    description: INVITE_METADATA.description,
    openGraph: {
      title: INVITE_METADATA.title,
      description: INVITE_METADATA.description,
      type: 'website',
    },
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeCode(code);
  // Формат заведомо неверен — API не дёргаем вовсе.
  const status = normalized ? await fetchInviteStatus(normalized) : null;
  const view = inviteViewModel(normalized !== null, status);

  return (
    <main className="pairMain">
      <div className="pairCard">
        <div className="pairBrand">
          Savel <span>♥</span>
        </div>

        <h1 className="pairTitle">{view.title}</h1>
        <p className="pairSub">{view.sub}</p>

        {view.showGift && normalized ? (
          <>
            <div className="pairCodeLabel">Код приглашения</div>
            <div className="pairCode">{normalized}</div>

            <PairActions code={normalized} playUrl={PLAY_URL} appStoreUrl={APPSTORE_URL} />

            <p className="pairHint">
              Куда вводить: экран «Соедините ваши профили» → «Есть код приглашения от друзей?»
            </p>
          </>
        ) : view.showRetry ? (
          <RetryButton />
        ) : (
          <a className="pairBtn pairBtnPrimary" href="https://savel.uz">
            О приложении Savel
          </a>
        )}
      </div>
    </main>
  );
}
