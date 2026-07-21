import { revalidatePath } from 'next/cache';
import { adminApi } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';

export const dynamic = 'force-dynamic';

interface AdminSubscription {
  id: string;
  user_name: string | null;
  user_email: string | null;
  provider: string;
  product_id: string;
  status: string;
  expires_at: string | null;
  environment: string;
  created_at: string;
  active: boolean;
}

const STATUS_RU: Record<string, string> = {
  active: 'активна',
  cancelled: 'отменена (до срока)',
  billing_issue: 'проблема оплаты',
  paused: 'на паузе',
  expired: 'истекла',
  revoked: 'отозвана',
};

const PROVIDER_RU: Record<string, string> = {
  admin_test: 'тест (админка)',
  test_store: 'RC Test Store',
  app_store: 'App Store',
  google_play: 'Google Play',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function grantSub(formData: FormData) {
  'use server';
  const user = String(formData.get('user') ?? '').trim();
  const plan = String(formData.get('plan') ?? 'month');
  if (!user) return;
  await adminApi('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ user, plan: plan === 'year' ? 'year' : 'month' }),
  });
  revalidatePath('/admin/subscriptions');
}

async function revokeSub(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await adminApi(`/subscriptions/${id}/revoke`, { method: 'POST' });
  revalidatePath('/admin/subscriptions');
}

/**
 * Подписки Savel+: тестовые выдаются прямо отсюда (внутренний провайдер,
 * без RevenueCat) — с реальным сроком, истечением и отзывом. Позже здесь же
 * будут видны сторовые подписки (App Store / Google Play через RevenueCat).
 */
export default async function SubscriptionsPage() {
  let subs: AdminSubscription[] = [];
  let error: string | null = null;
  try {
    subs = await adminApi<AdminSubscription[]>('/subscriptions');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <div>
      <h1>Подписки</h1>
      <p className="adminSub">
        Тестовая подписка ведёт себя как настоящая: срок истекает сам, отзыв — как refund.
        Доступ пары считается от владельца подписки (плюс действует на текущего партнёра).
      </p>

      <form action={grantSub} className="statCard categoryEditForm adminForm">
        <label>
          <span>Email или ID пользователя</span>
          <input type="text" name="user" placeholder="user@example.com" required />
        </label>
        <label>
          <span>План</span>
          <select name="plan" defaultValue="month">
            <option value="month">Месяц (30 дней)</option>
            <option value="year">Год (365 дней)</option>
          </select>
        </label>
        <button className="adminBtn" type="submit">
          Выдать тестовую подписку
        </button>
      </form>

      {error ? (
        <p className="adminSub">Ошибка: {error}</p>
      ) : subs.length === 0 ? (
        <p className="adminSub">Подписок пока нет.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Провайдер</th>
                <th>Продукт</th>
                <th>Статус</th>
                <th>До</th>
                <th>Выдана</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.user_name || sub.user_email || '—'}</td>
                  <td>{PROVIDER_RU[sub.provider] ?? sub.provider}</td>
                  <td>{sub.product_id}</td>
                  <td style={{ color: sub.active ? '#1f9962' : '#a6938e' }}>
                    {STATUS_RU[sub.status] ?? sub.status}
                    {sub.active ? ' ✓' : ''}
                  </td>
                  <td>{fmtDate(sub.expires_at)}</td>
                  <td>{fmtDate(sub.created_at)}</td>
                  <td>
                    {sub.active && (
                      <form action={revokeSub}>
                        <input type="hidden" name="id" value={sub.id} />
                        <ConfirmButton
                          className="adminGhostBtn"
                          type="submit"
                          confirmText="Отозвать подписку? Доступ пропадёт сразу (как refund).">
                          Отозвать
                        </ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
