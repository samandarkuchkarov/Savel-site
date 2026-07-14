import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { adminApi, adminAssetUrl, type AdminCheckupCollection } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

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
  await Promise.all(
    next.map((c, i) =>
      c.sort === i + 1
        ? Promise.resolve()
        : adminApi(`/checkup-collections/${c.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ sort: i + 1 }),
          }),
    ),
  );
  revalidatePath('/admin/checkup');
}

export default async function AdminCheckupPage() {
  let checkups: AdminCheckupCollection[] = [];
  let error: string | null = null;
  try {
    checkups = await adminApi<AdminCheckupCollection[]>('/checkup-collections');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

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
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Вопросов</th>
                <th>Порядок</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {checkups.map((checkup, index) => (
                <tr key={checkup.id}>
                  <td>
                    {checkup.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(checkup.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>{checkup.title}</td>
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
              ))}
              {checkups.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: '#8b7d78' }}>
                    Пока нет ни одного чек-апа — создайте первый.
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
