import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, adminAssetUrl, type AdminExpert } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

/**
 * Порядок меняем перестановкой с соседом и перенумерацией 1..n.
 *
 * У экспертов НЕТ общей ручки /reorder (она знает только про контентные
 * таблицы), поэтому шлём отдельные PATCH. Пачка запросов при обрыве оставит
 * порядок наполовину применённым — приемлемо: список короткий, а последствие
 * косметическое (карточки встанут не в том порядке до следующей правки).
 */
async function moveExpert(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  if (direction !== 'up' && direction !== 'down') return;
  const list = await adminApi<AdminExpert[]>('/experts');
  const index = list.findIndex(expert => expert.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  await Promise.all(
    next.map((expert, i) =>
      adminApi(`/experts/${expert.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ sort: i + 1 }),
      }),
    ),
  );
  revalidatePath('/admin/experts');
}

export default async function AdminExpertsPage() {
  let experts: AdminExpert[] = [];
  let error: string | null = null;
  try {
    experts = await adminApi<AdminExpert[]>('/experts');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Savel love эксперты</h1>
          <p className="adminSub">
            Карточки блогеров и специалистов в «Пульсе» под категориями. Тап открывает профиль
            эксперта в его соцсети — изменения видны сразу.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/experts/new">
          Добавить эксперта
        </Link>
      </div>

      {error ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : experts.length === 0 ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>Пока никого</b>
          <span>Блок в приложении не показывается, пока нет ни одного активного эксперта.</span>
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Имя</th>
                <th>Кто это</th>
                <th>Ссылки</th>
                <th>Порядок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {experts.map((expert, index) => (
                <tr key={expert.id}>
                  <td>
                    {expert.photo_url ? (
                      <img className="catThumb" src={adminAssetUrl(expert.photo_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{expert.name}</td>
                  <td>{expert.title || '—'}</td>
                  <td>
                    {/* rel обязателен: ссылка ведёт наружу, и без noopener чужая
                        страница получает доступ к window.opener админки. */}
                    {expert.links.length
                      ? expert.links.map(link => (
                          <a
                            key={link.id}
                            className="adminGhostLink"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginRight: 10 }}>
                            {link.label || link.kind}
                          </a>
                        ))
                      : '—'}
                  </td>
                  <td>
                    <div className="sortCell">
                      <form action={moveExpert}>
                        <input type="hidden" name="id" value={expert.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          className="sortBtn"
                          type="submit"
                          disabled={index === 0}
                          title="Поднять выше"
                          aria-label={`Поднять «${expert.name}» выше`}>
                          ↑
                        </button>
                      </form>
                      <form action={moveExpert}>
                        <input type="hidden" name="id" value={expert.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          className="sortBtn"
                          type="submit"
                          disabled={index === experts.length - 1}
                          title="Опустить ниже"
                          aria-label={`Опустить «${expert.name}» ниже`}>
                          ↓
                        </button>
                      </form>
                    </div>
                  </td>
                  <td>
                    {expert.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <Link className="adminGhostLink" href={`/admin/experts/${expert.id}`}>
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
