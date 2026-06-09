import Pagination from '../jobs/Pagination';

/**
 * Unified pagination bar for dashboard list pages.
 */
export default function DashboardPagination({
  page,
  totalPages,
  total = 0,
  pageSize = 10,
  onChange,
  className = '',
}) {
  if (totalPages <= 1 && total <= pageSize) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={`ds-pagination-wrap ${className}`.trim()}>
      <span className="ds-pagination-info">
        Showing {from}–{to} of {total.toLocaleString()}
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onChange} />
    </div>
  );
}
