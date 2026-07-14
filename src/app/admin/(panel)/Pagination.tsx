import Link from 'next/link';

type Props = {
  basePath: string;
  page: number;
  limit: number;
  total: number;
};

/** Prev/next pager for admin tables (server-rendered, ?page= links). */
export default function Pagination({ basePath, page, limit, total }: Props) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (p: number) => `${basePath}?page=${p}`;

  return (
    <div className="adminPager">
      <span className="adminPagerInfo">
        {from}–{to} из {total}
      </span>
      <div className="adminPagerBtns">
        {page > 1 ? (
          <Link className="sortBtn" href={href(page - 1)} aria-label="Предыдущая страница">
            ←
          </Link>
        ) : (
          <span className="sortBtn" aria-disabled="true">
            ←
          </span>
        )}
        <span className="adminPagerInfo">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link className="sortBtn" href={href(page + 1)} aria-label="Следующая страница">
            →
          </Link>
        ) : (
          <span className="sortBtn" aria-disabled="true">
            →
          </span>
        )}
      </div>
    </div>
  );
}
