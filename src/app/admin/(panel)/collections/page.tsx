import Link from 'next/link';
import { adminApi, adminAssetUrl, type AdminCollection } from '@/lib/adminApi';
import { matchesText, sliceList } from '@/lib/listSlice';
import { listHref, parseListQuery, type RawListParams } from '../listQuery';
import { ListSearch } from '../ListToolbar';
import Pagination from '../Pagination';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<RawListParams> };

export default async function AdminCollectionsPage({ searchParams }: Props) {
  const query = parseListQuery(await searchParams);
  let collections: AdminCollection[] = [];
  let error: string | null = null;
  try {
    collections = await adminApi<AdminCollection[]>('/collections');
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  const view = sliceList(collections, query, (c, needle) =>
    matchesText(needle, c.title, c.title_uz, c.title_en, c.category_title),
  );

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">Подборки вопросов</h1>
          <p className="adminSub">
            Подборка привязывается к категории и содержит вопросы с вариантами ответов —
            правильного ответа нет, варианты помогают партнёрам узнать друг друга. Порядок
            показа задаётся на странице категории — там подборки и чек-апы идут одним списком.
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
        <>
        <ListSearch
          basePath="/admin/collections"
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
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {view.items.map(collection => (
                <tr key={collection.id}>
                  <td>
                    {collection.image_url ? (
                      <img className="catThumb" src={adminAssetUrl(collection.image_url)} alt="" />
                    ) : (
                      <span className="catThumb catThumbEmpty">нет</span>
                    )}
                  </td>
                  <td>
                    {collection.title}
                    {collection.plus ? <span className="pill pillCoral">Savel+</span> : null}
                  </td>
                  <td>{collection.category_title ?? <span className="pill pillMuted">без категории</span>}</td>
                  <td>{collection.question_count}</td>
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
              {view.items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-soft)' }}>
                    {query.q
                      ? 'Ничего не найдено — измените запрос.'
                      : 'Пока нет ни одной подборки — создайте первую.'}
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
          pageHref={page => listHref('/admin/collections', query, { page })}
          sizeHref={(limit, page) => listHref('/admin/collections', query, { limit, page })}
        />
        </>
      )}
    </>
  );
}
