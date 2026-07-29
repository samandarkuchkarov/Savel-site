import Link from 'next/link';
import { DEFAULT_LIMIT } from '@/lib/listPaging';
import { listHref, type ListQuery } from './listQuery';

/**
 * Поиск над таблицей списка. Обычная GET-форма — работает без JS, ссылка с
 * результатом копируется и открывается заново. Сортировка и размер страницы не
 * теряются: они едут скрытыми полями, иначе поиск сбрасывал бы и выбранный
 * порядок, и «показывать по 100».
 */
export function ListSearch({
  basePath,
  query,
  placeholder,
  total,
}: {
  basePath: string;
  query: ListQuery;
  placeholder: string;
  /** Сколько нашлось — показываем только когда поиск активен. */
  total?: number;
}) {
  return (
    <form className="adminForm listToolbar" action={basePath} method="get">
      <input type="search" name="q" placeholder={placeholder} defaultValue={query.q} />
      {query.sort ? <input type="hidden" name="sort" value={query.sort} /> : null}
      {query.limit !== DEFAULT_LIMIT ? (
        <input type="hidden" name="limit" value={query.limit} />
      ) : null}
      <button className="adminBtn" type="submit">
        Найти
      </button>
      {query.q ? (
        <>
          <Link className="adminGhostLink" href={listHref(basePath, query, { q: '' })}>
            Сбросить
          </Link>
          <span className="listToolbarNote">
            {total === 0 ? 'ничего не найдено' : `найдено: ${total}`} по запросу «{query.q}»
          </span>
        </>
      ) : null}
    </form>
  );
}

/**
 * Заголовок сортируемой колонки. Клик переключает направление: сначала — тот
 * порядок, который для колонки полезнее (обычно по убыванию: самые дорогие,
 * самые новые), повторный клик разворачивает.
 */
export function SortHeader({
  label,
  basePath,
  query,
  asc,
  desc,
  /** Что применить первым кликом; по умолчанию — по убыванию. */
  first = 'desc',
  align,
}: {
  label: string;
  basePath: string;
  query: ListQuery;
  asc: string;
  desc: string;
  first?: 'asc' | 'desc';
  align?: 'right';
}) {
  // Направления ('asc'/'desc') и ключи сортировки ('cost_asc'/'cost_desc') —
  // РАЗНЫЕ вещи: смешивать их нельзя, иначе ссылка ведёт на текущий же порядок
  // и заголовок перестаёт переключаться.
  const active: 'asc' | 'desc' | null =
    query.sort === asc ? 'asc' : query.sort === desc ? 'desc' : null;
  const nextDir: 'asc' | 'desc' = active === first ? (first === 'desc' ? 'asc' : 'desc') : first;
  const nextKey = nextDir === 'asc' ? asc : desc;

  return (
    <th className={align === 'right' ? 'sortableTh sortableThRight' : 'sortableTh'}>
      <Link
        className={`sortLink${active ? ' sortLinkOn' : ''}`}
        href={listHref(basePath, query, { sort: nextKey })}
        aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'}>
        {label}
        <span aria-hidden="true" className="sortArrow">
          {active === 'asc' ? '↑' : active === 'desc' ? '↓' : '↕'}
        </span>
      </Link>
    </th>
  );
}
