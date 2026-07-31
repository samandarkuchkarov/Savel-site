import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, adminAssetUrl, type AdminCheckupCollection } from '@/lib/adminApi';
import { matchesText, sliceList } from '@/lib/listSlice';
import { listHref, parseListQuery, type RawListParams } from '../listQuery';
import { ListSearch } from '../ListToolbar';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<RawListParams> };

/** Swap a checkup with its neighbour and renumber sorts 1..n. */
async function moveCheckup(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  const list = await adminApi<AdminCheckupCollection[]>('/checkup-collections');
  const index = list.findIndex(c => c.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  // Весь порядок одним запросом (одна транзакция на сервере): пачка
  // параллельных PATCH при обрыве оставляла порядок наполовину применённым.
  await adminApi('/reorder', {
    method: 'POST',
    body: JSON.stringify({ entity: 'checkups', ids: next.map(item => item.id) }),
  });
  revalidatePath('/admin/checkup');
}

export default async function AdminCheckupPage({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  let checkups: AdminCheckupCollection[] = [];
  let error: string | null = null;
  try {
    checkups = await adminApi<AdminCheckupCollection[]>('/checkup-collections');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  const view = sliceList(checkups, query, (c, needle) =>
    matchesText(needle, c.title, c.title_uz, c.title_en, c.category_title),
  );
  // Позиция в ПОЛНОМ списке: стрелки двигают чек-ап среди всех, а не среди
  // показанных, — иначе на второй странице «вверх» упиралось бы в её начало.
  const positions = new Map(checkups.map((c, i) => [c.id, i]));

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Чек-апы</h1>
          <p className="adminSub">
            Каждый чек-ап — отдельный набор утверждений, которые пара оценивает сердечками. У
            каждого свой результат и динамика.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/checkup/new">
          Создать чек-ап
        </Link>
      </div>

      {error ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : (
        <>
        <ListSearch
          basePath="/admin/checkup"
          query={query}
          placeholder="Название или категория"
          total={view.total}
        />
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Вопросов</th>
                <th>Порядок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {view.items.map(checkup => {
                const index = positions.get(checkup.id) ?? 0;
                return (
                <tr key={checkup.id}>
                  <td>
                    {checkup.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(checkup.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{checkup.title}</td>
                  <td>
                    {checkup.category_title ?? (
                      <span className="mutedFaint" title="Доступен только через расписание">
                        без категории
                      </span>
                    )}
                  </td>
                  <td>{checkup.question_count}</td>
                  <td>
                    <form action={moveCheckup} className="sortCell">
                      <input type="hidden" name="id" value={checkup.id} />
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        title="Поднять выше"
                        aria-label={`Поднять «${checkup.title}» выше`}>
                        ↑
                      </button>
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="down"
                        disabled={index === checkups.length - 1}
                        title="Опустить ниже"
                        aria-label={`Опустить «${checkup.title}» ниже`}>
                        ↓
                      </button>
                    </form>
                  </td>
                  <td>
                    {checkup.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <Link className="adminGhostLink" href={`/admin/checkup/${checkup.id}`}>
                      Редактировать
                    </Link>
                  </td>
                </tr>
                );
              })}
              {view.items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: 'var(--text-soft)' }}>
                    {query.q
                      ? 'Ничего не найдено — измените запрос.'
                      : 'Пока нет ни одного чек-апа — создайте первый.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={view.page}
          limit={query.limit}
          total={view.total}
          pageHref={page => listHref('/admin/checkup', query, { page })}
          sizeHref={(limit, page) => listHref('/admin/checkup', query, { limit, page })}
        />
        </>
      )}
    </>
  );
}
