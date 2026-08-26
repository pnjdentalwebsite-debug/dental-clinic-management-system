interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  hideControls?: boolean;
}

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('ellipsis');
  items.push(totalPages);
  return items;
}

export function MasterFilePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  hideControls = false
}: Props) {
  const pageItems = buildPageItems(currentPage, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = totalItems === 0 ? 0 : Math.min(totalItems, currentPage * itemsPerPage);

  return (
    <div className="master-file-pagination">
      <span className="master-file-pagination__summary">Showing {start}-{end} of {totalItems} records</span>
      {!hideControls ? (
        <div className="master-file-pagination__controls">
          <button type="button" className="btn btn-outline master-file-pagination__nav" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
            «
          </button>
          <button type="button" className="btn btn-outline master-file-pagination__nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            ‹
          </button>
          <div className="master-file-pagination__pages">
            {pageItems.map((item, index) => item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="master-file-pagination__ellipsis">...</span>
            ) : (
              <button
                key={item}
                type="button"
                className={`master-file-pagination__page ${item === currentPage ? 'is-active' : ''}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline master-file-pagination__nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            ›
          </button>
          <button type="button" className="btn btn-outline master-file-pagination__nav" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
            »
          </button>
          <span className="master-file-pagination__indicator">Page {currentPage} of {totalPages}</span>
        </div>
      ) : null}
    </div>
  );
}
