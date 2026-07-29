import Link from 'next/link';
import { LIST_LIMITS, pageForLimit, pageWindow } from '@/lib/listPaging';

type Props = {
  page: number;
  limit: number;
  total: number;
  /** Ссылка на страницу N этого же списка (со всеми фильтрами). */
  pageHref: (page: number) => string;
  /** Ссылка на тот же список с другим размером страницы; без неё выбор размера не показываем. */
  sizeHref?: (limit: number, page: number) => string;
};

/**
 * Пагинация таблиц админки: номера страниц + размер страницы.
 *
 * Было prev/next — и до 20-й страницы приходилось жать 19 раз. Поэтому первая
 * и последняя страницы присутствуют в наборе всегда (см. pageWindow), а размер
 * страницы переключается ссылками, а не select-ом: серверный компонент, JS для
 * этого не нужен.
 */
export default function Pagination({ page, limit, total, pageHref, sizeHref }: Props) {
  const pages = Math.max(1, Math.ceil(total / limit));
  // Одна страница — номера не нужны, но выбор размера показать стоит: список
  // мог влезть в одну страницу как раз потому, что размер уже подняли до 100.
  const showSizes = sizeHref && total > LIST_LIMITS[0];
  if (pages <= 1 && !showSizes) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="adminPager">
      <span className="adminPagerInfo">
        {from}–{to} из {total}
      </span>

      {pages > 1 ? (
        <nav className="adminPagerBtns" aria-label="Страницы">
          {page > 1 ? (
            <Link className="sortBtn" href={pageHref(page - 1)} aria-label="Предыдущая страница" rel="prev">
              ←
            </Link>
          ) : (
            <span className="sortBtn" aria-disabled="true">
              ←
            </span>
          )}

          {pageWindow(page, pages).map((item, i) =>
            item === 'gap' ? (
              // Не кнопка и не ссылка: пропуск нельзя «нажать», и он не должен
              // ловить фокус с клавиатуры.
              <span key={`gap-${i}`} className="pagerGap" aria-hidden="true">
                …
              </span>
            ) : item === page ? (
              <span key={item} className="sortBtn pagerNow" aria-current="page">
                {item}
              </span>
            ) : (
              <Link
                key={item}
                className="sortBtn"
                href={pageHref(item)}
                aria-label={`Страница ${item}`}>
                {item}
              </Link>
            ),
          )}

          {page < pages ? (
            <Link className="sortBtn" href={pageHref(page + 1)} aria-label="Следующая страница" rel="next">
              →
            </Link>
          ) : (
            <span className="sortBtn" aria-disabled="true">
              →
            </span>
          )}
        </nav>
      ) : null}

      {showSizes ? (
        <div className="pagerSizes">
          <span className="adminPagerInfo">На странице:</span>
          {LIST_LIMITS.map(size =>
            size === limit ? (
              <span key={size} className="filterChip filterChipOn" aria-current="true">
                {size}
              </span>
            ) : (
              <Link
                key={size}
                className="filterChip"
                // Ведём на страницу с той же первой записью: поднять размер
                // списка не должно означать «начать просмотр заново».
                href={sizeHref!(size, pageForLimit(page, limit, size))}
                aria-label={`Показывать по ${size} на странице`}>
                {size}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
