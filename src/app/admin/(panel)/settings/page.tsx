import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi, type AdminPricing } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

/**
 * «Значения» — динамические параметры приложения, редактируемые без релиза.
 * Пока здесь цены Savel+: приложение берёт их из GET /billing/plans, а строки
 * пейволла («$X в месяц», «ВЫГОДА N%») сервер считает сам из двух чисел —
 * несогласованные цифры показать невозможно.
 */

async function savePricing(formData: FormData) {
  'use server';
  const monthUsd = Number(String(formData.get('monthUsd') ?? '').replace(',', '.'));
  const yearUsd = Number(String(formData.get('yearUsd') ?? '').replace(',', '.'));
  if (!Number.isFinite(monthUsd) || monthUsd <= 0 || !Number.isFinite(yearUsd) || yearUsd <= 0) {
    redirect('/admin/settings?error=' + encodeURIComponent('Введите положительные числа'));
  }
  try {
    await adminApi('/settings/pricing', {
      method: 'PUT',
      body: JSON.stringify({ monthUsd, yearUsd }),
    });
  } catch (error) {
    // Показываем ЧЕЛОВЕЧЕСКУЮ причину (валидация API), а не «Application error».
    const message = error instanceof Error ? error.message : 'Не удалось сохранить';
    redirect('/admin/settings?error=' + encodeURIComponent(message));
  }
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  let pricing: AdminPricing | null = null;
  try {
    pricing = await adminApi<AdminPricing>('/settings/pricing');
  } catch {
    // API недоступен — честно скажем об этом ниже, не маскируя под пустую форму.
  }

  return (
    <>
      <h1 className="adminH1">Значения</h1>
      <p className="adminSub">
        Динамические параметры приложения — меняются сразу, без релиза в сторы.
      </p>

      {saved ? <p className="savedBanner">✓ Сохранено — приложение уже видит новые цены</p> : null}
      {error ? <p className="loginError">{error}</p> : null}

      {!pricing ? (
        <p className="adminSub">API недоступен — обновите страницу позже.</p>
      ) : (
        <>
          <h2 className="adminH2">Цены Savel+</h2>
          <form action={savePricing} className="adminForm" style={{ alignItems: 'flex-end' }}>
            <label className="fieldCol">
              <span>Месяц, $</span>
              <input
                type="number"
                name="monthUsd"
                step="0.01"
                min="0.01"
                required
                defaultValue={pricing.monthUsd}
              />
            </label>
            <label className="fieldCol">
              <span>Год (одним платежом), $</span>
              <input
                type="number"
                name="yearUsd"
                step="0.01"
                min="0.01"
                required
                defaultValue={pricing.yearUsd}
              />
            </label>
            <button className="adminBtn" type="submit">
              Сохранить
            </button>
          </form>

          <h2 className="adminH2" style={{ marginTop: 26 }}>
            Как это увидит пользователь
          </h2>
          <div className="statGrid" style={{ maxWidth: 560 }}>
            {pricing.preview.map(plan => (
              <div className="statCard" key={plan.id}>
                <b>{plan.price}</b>
                <span>
                  {plan.title} · {plan.note}
                  {plan.badge ? ` · ${plan.badge}` : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="adminSub" style={{ marginTop: 14 }}>
            «$ в месяц» у годового плана и «ВЫГОДА N%» считаются автоматически из двух цен.
          </p>
        </>
      )}
    </>
  );
}
