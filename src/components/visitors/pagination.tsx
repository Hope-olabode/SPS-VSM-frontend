import { ChevronLeftIcon, ChevronRightIcon } from "@/src/components/icons";

type PaginationProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
};

const pageButton =
  "grid h-7 w-7 place-items-center rounded border text-xs transition disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ page, pageCount, pageSize, total, onPage }: PaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  // show up to 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);

  return (
    <div className="flex flex-col gap-4 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-soft">
        Showing{" "}
        <span className="font-medium text-fg">
          {first}-{last}
        </span>{" "}
        of <span className="font-medium text-fg">{total}</span>
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={`${pageButton} border-line-strong text-muted hover:bg-surface-soft`}
        >
          <ChevronLeftIcon size={14} />
        </button>

        {pages.map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onPage(number)}
            aria-current={number === page ? "page" : undefined}
            className={`${pageButton} ${
              number === page
                ? "border-brand bg-brand font-semibold text-white dark:text-[#04130a]"
                : "border-line-strong text-soft hover:bg-surface-soft"
            }`}
          >
            {number}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className={`${pageButton} border-line-strong text-soft hover:bg-surface-soft`}
        >
          <ChevronRightIcon size={14} />
        </button>
      </nav>
    </div>
  );
}