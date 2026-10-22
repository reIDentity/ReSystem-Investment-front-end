import type { ActivityPagination as Pagination } from "@/lib/platform/api.generated";

export function ActivityPagination({ pagination, busy, onPage, onIntent }: { pagination: Pagination; busy: boolean; onPage: (page: number) => void; onIntent?: (page: number) => void }) {
  const { page, pageSize, total, totalPages } = pagination;
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages].filter(value => value >= 1 && value <= totalPages))].sort((a, b) => a - b);
  return <div className="iv-activity-pagination">
    <p role="status">Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} transactions</p>
    <nav aria-label="Activity pages">
      <button className="iv-button iv-small" disabled={busy || page <= 1} onPointerEnter={() => page > 1 && onIntent?.(page - 1)} onFocus={() => page > 1 && onIntent?.(page - 1)} onClick={() => onPage(page - 1)}>Previous</button>
      {pages.map((number, index) => <span key={number}>
        {index > 0 && number > pages[index - 1] + 1 ? <span className="iv-page-gap" aria-hidden="true">…</span> : null}
        <button className={`iv-button iv-small${number === page ? " iv-primary" : ""}`} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} disabled={busy || number === page} onPointerEnter={() => onIntent?.(number)} onFocus={() => onIntent?.(number)} onClick={() => onPage(number)}>{number.toLocaleString()}</button>
      </span>)}
      <button className="iv-button iv-small" disabled={busy || totalPages === 0 || page >= totalPages} onPointerEnter={() => page < totalPages && onIntent?.(page + 1)} onFocus={() => page < totalPages && onIntent?.(page + 1)} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  </div>;
}
