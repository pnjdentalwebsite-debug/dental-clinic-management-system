import { SmartPagination } from './SmartPagination';

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
}

export function DashboardCardPagination({ currentPage, totalItems, itemsPerPage = 5, onPageChange }: Props) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safeCurrentPage - 1) * itemsPerPage + 1;
  const end = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  return (
    <div className="dashboard-card-pagination">
      <div className="dashboard-card-pagination__summary">
        <span>
          Showing {start}-{end} of {totalItems}
        </span>
      </div>

      <SmartPagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
