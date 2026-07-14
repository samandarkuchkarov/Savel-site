import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, adminAssetUrl, type AdminCollection } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

/** Swap the collection with its neighbour and renumber sorts 1..n. */
async function moveCollection(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  const list = await adminApi<AdminCollection[]>('/collections');
  const index = list.findIndex(collection => collection.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  await Promise.all(
    next.map((collection, i) =>
      collection.sort === i + 1
        ? Promise.resolve()
        : adminApi(`/collections/${collection.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ sort: i + 1 }),
          }),
    ),
  );
  revalidatePath('/admin/collections');
}

export default async function AdminCollectionsPage() {
  let collections: AdminCollection[] = [];
  let error: string | null = null;
  try {
    collections = await adminApi<AdminCollection[]>('/collections');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Подборки вопросов</h1>
          <p className="adminSub">
            Подборка привязывается к категории и содержит вопросы с вариантами ответов —
            правильного ответа нет, варианты помогают партнёрам узнать друг друга.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/collections/new">
          Создать подборку
        </Link>
      </div>

      {error ? (
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>API недоступен</b>
          <span>{error}</span>
        </div>
      ) : (
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
              {collections.map((collection, index) => (
                <tr key={collection.id}>
                  <td>
                    {collection.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(collection.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{collection.title}</td>
                  <td>{collection.category_title ?? <span className="pill pillMuted">без категории</span>}</td>
                  <td>{collection.question_count}</td>
                  <td>
                    <form action={moveCollection} className="sortCell">
                      <input type="hidden" name="id" value={collection.id} />
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        title="Поднять выше"
                        aria-label={`Поднять «${collection.title}» выше`}>
                        ↑
                      </button>
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="down"
                        disabled={index === collections.length - 1}
                        title="Опустить ниже"
                        aria-label={`Опустить «${collection.title}» ниже`}>
                        ↓
                      </button>
                    </form>
                  </td>
                  <td>
                    {collection.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <Link className="adminGhostLink" href={`/admin/collections/${collection.id}`}>
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))}
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: '#8b7d78' }}>
                    Пока нет ни одной подборки — создайте первую.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
