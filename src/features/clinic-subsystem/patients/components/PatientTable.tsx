import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { PatientTableHeader, type SortDirection } from './PatientTableHeader';
import { PatientTableRow } from './PatientTableRow';
import type { PatientPreviewItem } from './patientTypes';

interface Props {
  patients: PatientPreviewItem[];
  totalPatients: number;
  currentPage: number;
  totalPages: number;
  lastVisitSort: SortDirection;
  balanceSort: SortDirection;
  onToggleLastVisitSort: () => void;
  onToggleBalanceSort: () => void;
  onPageChange: (page: number) => void;
  onViewRecord: (patientId: string) => void;
  onEditPatient?: (patientId: string) => void;
  onDeletePatient?: (patientId: string) => void;
}

const buildPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
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
};

export function PatientTable({
  patients,
  totalPatients,
  currentPage,
  totalPages,
  lastVisitSort,
  balanceSort,
  onToggleLastVisitSort,
  onToggleBalanceSort,
  onPageChange,
  onViewRecord,
  onEditPatient,
  onDeletePatient
}: Props) {
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  return (
    <div className="patient-table-shell">
      <table className="patient-table">
        <colgroup>
          <col className="patient-table__col patient-table__col--patient" />
          <col className="patient-table__col patient-table__col--contact" />
          <col className="patient-table__col patient-table__col--visit" />
          <col className="patient-table__col patient-table__col--visit" />
          <col className="patient-table__col patient-table__col--remarks" />
          <col className="patient-table__col patient-table__col--balance" />
          <col className="patient-table__col patient-table__col--actions" />
        </colgroup>
        <PatientTableHeader
          lastVisitSort={lastVisitSort}
          balanceSort={balanceSort}
          onToggleLastVisitSort={onToggleLastVisitSort}
          onToggleBalanceSort={onToggleBalanceSort}
        />
        <tbody>
          {patients.map((patient) => (
            <PatientTableRow
              key={patient.id}
              patient={patient}
              onViewRecord={onViewRecord}
              onEdit={onEditPatient}
              onDelete={onDeletePatient}
            />
          ))}
        </tbody>
      </table>

      {totalPages > 1 ? (
        <div className="patient-table__footer">
          <p className="patient-table__total">
            Showing {(currentPage - 1) * patients.length + 1} to {Math.min(currentPage * patients.length, totalPatients)} of {totalPatients} patients
          </p>
          <div className="patient-table__pagination">
            <button
              type="button"
              className="patient-table__page-nav"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </button>
            {paginationItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="patient-table__page-ellipsis" aria-hidden="true">
                  <MoreHorizontal size={14} />
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`patient-table__page-button ${item === currentPage ? 'is-active' : ''}`}
                  onClick={() => onPageChange(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              className="patient-table__page-nav"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
