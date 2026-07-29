/**
 * Общий разбор ?q=/?sort=/?page=/?limit= для списков админки и сборка ссылок,
 * которые НЕ теряют остальные параметры. Раньше каждая ссылка склеивалась
 * вручную, и переход на вторую страницу сбрасывал поиск (а смена сортировки —
 * страницу).
 */
import { DEFAULT_LIMIT, parseLimit } from '@/lib/listPaging';

export interface ListQuery {
  /** Строка поиска (уже обрезанная); пустая — поиска нет. */
  q: string;
  /** Ключ сортировки из белого списка страницы; пустой — серверный дефолт. */
  sort: string;
  page: number;
  /** Размер страницы из белого списка (см. listPaging). */
  limit: number;
}

export type RawListParams = { page?: string; q?: string; sort?: string; limit?: string };

export function parseListQuery(params: RawListParams): ListQuery {
  return {
    q: (params.q ?? '').trim(),
    sort: (params.sort ?? '').trim(),
    page: Math.max(Number(params.page) || 1, 1),
    limit: parseLimit(params.limit),
  };
}

/**
 * Ссылка на тот же список с изменённой частью запроса. Смена поиска, сортировки
 * или размера страницы ВСЕГДА возвращает на первую страницу: остаться на 7-й
 * странице нового результата — почти наверняка пустой экран. Исключение —
 * когда страница задана в patch явно (так делает переключатель размера: он сам
 * считает, где теперь лежит первая видимая запись).
 */
export function listHref(basePath: string, current: ListQuery, patch: Partial<ListQuery>): string {
  const next = { ...current, ...patch };
  const resetsPage =
    patch.page === undefined &&
    (patch.q !== undefined || patch.sort !== undefined || patch.limit !== undefined);
  const page = resetsPage ? 1 : next.page;

  const search = new URLSearchParams();
  if (next.q) search.set('q', next.q);
  if (next.sort) search.set('sort', next.sort);
  if (page > 1) search.set('page', String(page));
  if (next.limit !== DEFAULT_LIMIT) search.set('limit', String(next.limit));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Query-строка для запроса к API. */
export function apiListQuery(current: ListQuery): string {
  const search = new URLSearchParams({
    page: String(current.page),
    limit: String(current.limit),
  });
  if (current.q) search.set('q', current.q);
  if (current.sort) search.set('sort', current.sort);
  return search.toString();
}
