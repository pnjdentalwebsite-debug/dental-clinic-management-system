import { ChevronLeft, ChevronRight } from 'lucide-react';

const ELLIPSIS = 'ellipsis' as const;

type PaginationItem = number | typeof ELLIPSIS;

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

const buildPaginationItems = (currentPage: number, totalPages: number, siblingCount: number): PaginationItem[] => {
  if (totalPages <= 0) return [];

  const totalVisiblePages = siblingCount * 2 + 3;
  if (totalPages <= totalVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const boundaryOffset = siblingCount + 2;
  const safeCurrent = Math.min(Math.max(currentPage, 1), totalPages);

  if (safeCurrent <= boundaryOffset) {
    const startPages = Array.from({ length: siblingCount * 2 + 1 }, (_, index) => index + 1);
    return [...startPages, ELLIPSIS, totalPages];
  }

  if (safeCurrent >= totalPages - siblingCount - 1) {
    const start = totalPages - (siblingCount * 2 + 1) + 1;
    const endPages = Array.from({ length: siblingCount * 2 + 1 }, (_, index) => start + index);
    return [1, ELLIPSIS, ...endPages];
  }

  const middlePages = Array.from({ length: siblingCount * 2 + 1 }, (_, index) => safeCurrent - siblingCount + index);
  return [1, ELLIPSIS, ...middlePages, ELLIPSIS, totalPages];
};

export function SmartPagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }: Props) {
  if (totalPages <= 0) return null;

  const safeCurrent = Math.min(Math.max(currentPage, 1), totalPages);
  const items = buildPaginationItems(safeCurrent, totalPages, siblingCount);

  return (
    <nav className="smart-pagination" aria-label="Pagination">
      <button
        type="button"
        className="smart-pagination__nav"
        onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
        disabled={safeCurrent === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span key={`ellipsis-${index}`} className="smart-pagination__ellipsis" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`smart-pagination__page ${item === safeCurrent ? 'is-active' : ''}`}
            aria-pressed={item === safeCurrent}
            aria-current={item === safeCurrent ? 'page' : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className="smart-pagination__nav"
        onClick={() => onPageChange(Math.min(totalPages, safeCurrent + 1))}
        disabled={safeCurrent === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
