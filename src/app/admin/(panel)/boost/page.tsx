import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, type AdminBoostRecommendation, type BoostRecommendationKind } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';

export const dynamic = 'force-dynamic';

const KIND_TITLES: Record<BoostRecommendationKind, string> = {
  challenge: 'Челленджи',
  date: 'Свидания',
  tradition: 'Традиции',
  goal: 'Цели',
};

/** Стрелка ↑/↓: сервер меняет позиции с соседом внутри вида (транзакция). */
async function moveRec(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('direction') ?? '');
  if (!id || (dir !== 'up' && dir !== 'down')) return;
  await adminApi(`/boost-recommendations/${id}/move`, {
    method: 'POST',
    body: JSON.stringify({ dir }),
  });
  revalidatePath('/admin/boost');
}

async function deleteRec(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await adminApi(`/boost-recommendations/${id}`, { method: 'DELETE' });
  revalidatePath('/admin/boost');
}

export default async function AdminBoostPage() {
  let recs: AdminBoostRecommendation[] = [];
  let error: string | null = null;
  try {
    recs = await adminApi<AdminBoostRecommendation[]>('/boost-recommendations');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Рекомендации Буста</h1>
          <p className="adminSub">
            Готовые идеи челленджей, свиданий и традиций в приложении. Бесплатным парам видны
            первые 3 каждого вида (порядок ниже), остальные — с Savel+.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/boost/new">
          Добавить рекомендацию
        </Link>
      </div>

      {error ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : (
        (Object.keys(KIND_TITLES) as BoostRecommendationKind[]).map(kind => {
          const items = recs.filter(r => r.kind === kind);
          return (
            <section key={kind} style={{ marginTop: 22 }}>
              <h2 className="adminH2">{KIND_TITLES[kind]}</h2>
              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th style={{ width: 56 }}>Эмодзи</th>
                      <th>Название</th>
                      <th>Подзаголовок</th>
                      <th style={{ width: 96 }}>Порядок</th>
                      <th style={{ width: 180 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((rec, index) => (
                      <tr key={rec.id}>
                        <td style={{ color: index < 3 ? '#2fbe7e' : '#8b7d78' }}>
                          {index + 1}
                          {index < 3 ? ' · free' : ''}
                        </td>
                        <td style={{ fontSize: 20 }}>{rec.emoji ?? '—'}</td>
                        <td>{rec.title}</td>
                        <td style={{ color: '#8b7d78' }}>{rec.subtitle ?? '—'}</td>
                        <td>
                          <form action={moveRec} className="sortCell">
                            <input type="hidden" name="id" value={rec.id} />
                            <button
                              className="sortBtn"
                              type="submit"
                              name="direction"
                              value="up"
                              disabled={index === 0}
                              title="Поднять выше"
                              aria-label={`Поднять «${rec.title}» выше`}>
                              ↑
                            </button>
                            <button
                              className="sortBtn"
                              type="submit"
                              name="direction"
                              value="down"
                              disabled={index === items.length - 1}
                              title="Опустить ниже"
                              aria-label={`Опустить «${rec.title}» ниже`}>
                              ↓
                            </button>
                          </form>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Link className="adminGhostLink" href={`/admin/boost/${rec.id}`}>
                              Редактировать
                            </Link>
                            <form action={deleteRec}>
                              <input type="hidden" name="id" value={rec.id} />
                              <ConfirmButton
                                className="adminGhostLink adminDanger"
                                type="submit"
                                confirmText={`Удалить рекомендацию «${rec.title}»?`}>
                                Удалить
                              </ConfirmButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ color: '#8b7d78' }}>
                          Пока пусто — добавьте первую.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
