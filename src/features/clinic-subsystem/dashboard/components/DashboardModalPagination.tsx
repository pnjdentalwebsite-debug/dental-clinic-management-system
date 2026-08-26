import { SmartPagination } from './SmartPagination';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  siblingCount?: number;
}

export function DashboardModalPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  siblingCount = 1
}: Props) {
  if (totalItems <= 0 || totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safeCurrentPage - 1) * itemsPerPage + 1;
  const end = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  return (
    <div className="dashboard-modal-pagination">
      <div className="dashboard-modal-pagination__summary">
        <span>
          Showing {start}-{end} of {totalItems}
        </span>
        <strong>
          Page {safeCurrentPage} of {totalPages}
        </strong>
      </div>

      <div className="dashboard-modal-pagination__footer">
        <SmartPagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={onPageChange} siblingCount={siblingCount} />
        <strong className="dashboard-modal-pagination__indicator">
          Page {safeCurrentPage} of {totalPages}
        </strong>
      </div>
    </div>
  );
}
