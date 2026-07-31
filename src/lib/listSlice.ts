/**
 * Поиск + постраничный срез для списков, которые API отдаёт ЦЕЛИКОМ (подборки,
 * чек-апы, контент категории). Серверную пагинацию для них заводить незачем —
 * это редактируемые справочники, они укладываются в один ответ, а порядок
 * элементов там задаёт админ. А вот рисовать 450 строк разом нельзя: после
 * импорта каталога страница превращалась в бесконечную простыню.
 */
export interface SliceQuery {
  q: string;
  page: number;
  limit: number;
}

export interface Slice<T> {
  /** Сколько всего после поиска (не после среза). */
  total: number;
  /** Номер страницы ПОСЛЕ зажима в границы — его же показывает пагинация. */
  page: number;
  items: T[];
}

export function sliceList<T>(
  all: T[],
  query: SliceQuery,
  /** Совпадение со строкой поиска; на вход приходит уже приведённая к нижнему регистру. */
  match: (item: T, needle: string) => boolean,
): Slice<T> {
  const needle = query.q.trim().toLowerCase();
  const filtered = needle ? all.filter(item => match(item, needle)) : all;
  const pages = Math.max(1, Math.ceil(filtered.length / query.limit));
  // Зажимаем страницу: поиск сужает список, и сохранённая в ссылке 8-я страница
  // иначе показала бы пустую таблицу вместо найденного.
  const page = Math.min(Math.max(query.page, 1), pages);
  return {
    total: filtered.length,
    page,
    items: filtered.slice((page - 1) * query.limit, page * query.limit),
  };
}

/** Ищем по всем языкам сразу: название на узбекском — такой же ориентир, как русское. */
export const matchesText = (needle: string, ...fields: (string | null | undefined)[]) =>
  fields.some(field => field?.toLowerCase().includes(needle));
