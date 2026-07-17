import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, adminAssetUrl, type AdminCategory } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

/** Swap the category with its neighbour and renumber sorts 1..n (fixes duplicates too). */
async function moveCategory(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const direction = String(formData.get('direction') ?? '');
  const list = await adminApi<AdminCategory[]>('/categories');
  const index = list.findIndex(category => category.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  // Весь порядок одним запросом (одна транзакция на сервере): пачка
  // параллельных PATCH при обрыве оставляла порядок наполовину применённым.
  await adminApi('/reorder', {
    method: 'POST',
    body: JSON.stringify({ entity: 'categories', ids: next.map(item => item.id) }),
  });
  revalidatePath('/admin/categories');
}

export default async function AdminCategoriesPage() {
  let categories: AdminCategory[] = [];
  let error: string | null = null;
  try {
    categories = await adminApi<AdminCategory[]>('/categories');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Категории вопросов</h1>
          <p className="adminSub">
            Приложение показывает эти категории на вкладке «Пульс» — изменения видны сразу.
          </p>
        </div>
        <Link className="adminBtn adminBtnLink" href="/admin/categories/new">
          Создать категорию
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
                <th>Подзаголовок</th>
                <th>ID</th>
                <th>Порядок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id}>
                  <td>
                    {category.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(category.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{category.title}</td>
                  <td>{category.subtitle || '—'}</td>
                  <td>{category.id}</td>
                  <td>
                    <form action={moveCategory} className="sortCell">
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        title="Поднять выше"
                        aria-label={`Поднять «${category.title}» выше`}>
                        ↑
                      </button>
                      <button
                        className="sortBtn"
                        type="submit"
                        name="direction"
                        value="down"
                        disabled={index === categories.length - 1}
                        title="Опустить ниже"
                        aria-label={`Опустить «${category.title}» ниже`}>
                        ↓
                      </button>
                    </form>
                  </td>
                  <td>
                    {category.active ? (
                      <span className="pill pillGreen">вкл</span>
                    ) : (
                      <span className="pill pillMuted">выкл</span>
                    )}
                  </td>
                  <td>
                    <Link className="adminGhostLink" href={`/admin/categories/${category.id}`}>
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
