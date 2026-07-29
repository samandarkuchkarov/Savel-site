/**
 * Чистая арифметика пагинации: размер страницы и набор номеров под таблицей.
 *
 * Живёт в lib/, а не рядом с компонентом, ровно чтобы быть покрытой тестами:
 * оба правила ниже ломаются молча — окно номеров просто нарисует не те кнопки,
 * а смена размера страницы незаметно увезёт читателя в другое место списка.
 */

/** Допустимые размеры страницы. Всё, что не отсюда, — подделка из адресной строки. */
export const LIST_LIMITS = [20, 50, 100] as const;
export const DEFAULT_LIMIT = 20;

/**
 * ?limit= из URL → безопасный размер страницы. Белый список, а не Math.min:
 * произвольный limit=73 сделал бы кнопки размера бессмысленными (ни одна не
 * подсвечена), а limit=100000 — положил бы запрос.
 */
export function parseLimit(raw: string | undefined): number {
  const n = Number(raw);
  return (LIST_LIMITS as readonly number[]).includes(n) ? n : DEFAULT_LIMIT;
}

/**
 * Страница, на которую надо перейти при смене размера, чтобы читатель остался
 * у той же записи. Со страницы 3 по 20 (записи 41–60) при переходе на 50 записей
 * запись 41 лежит на первой странице — туда и ведём. Сброс на первую страницу
 * терял бы место в списке каждый раз, когда просто хочется видеть больше строк.
 */
export function pageForLimit(page: number, oldLimit: number, newLimit: number): number {
  const firstIndex = (Math.max(page, 1) - 1) * oldLimit; // 0-based индекс первой видимой записи
  return Math.floor(firstIndex / newLimit) + 1;
}

/**
 * Номера страниц под таблицей: всегда первая и последняя, окно вокруг текущей,
 * 'gap' на месте пропуска. Первая и последняя обязаны присутствовать всегда —
 * иначе «дойти до 20-й страницы» снова стоит 19 кликов.
 *
 * Ширина набора держится постоянной (до 7 номеров), чтобы кнопки не прыгали
 * под курсором при переходе между страницами.
 */
export function pageWindow(page: number, pages: number): (number | 'gap')[] {
  const current = Math.min(Math.max(page, 1), Math.max(pages, 1));
  const wanted = new Set<number>([1, pages, current - 1, current, current + 1]);
  // У краёв окно нельзя строить симметрично — оно упирается в границу и набор
  // становится куцым. Добираем номера с той стороны, где место осталось.
  if (current <= 3) [2, 3, 4].forEach(p => wanted.add(p));
  if (current >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach(p => wanted.add(p));

  const list = [...wanted].filter(p => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  list.forEach((p, i) => {
    const prev = list[i - 1];
    if (prev === undefined) {
      out.push(p);
      return;
    }
    // Многоточие вместо ОДНОЙ страницы — враньё: оно занимает столько же места,
    // сколько сам номер, но кликнуть по нему нельзя. Такой разрыв заполняем.
    if (p - prev === 2) out.push(prev + 1);
    else if (p - prev > 2) out.push('gap');
    out.push(p);
  });
  return out;
}
