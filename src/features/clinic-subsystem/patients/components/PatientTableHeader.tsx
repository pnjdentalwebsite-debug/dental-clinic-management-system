import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface Props {
  lastVisitSort: SortDirection;
  balanceSort: SortDirection;
  onToggleLastVisitSort: () => void;
  onToggleBalanceSort: () => void;
}

const getSortIcon = (direction: SortDirection) => {
  if (direction === 'asc') return <ChevronUp size={14} aria-hidden="true" />;
  if (direction === 'desc') return <ChevronDown size={14} aria-hidden="true" />;
  return <ChevronsUpDown size={14} aria-hidden="true" />;
};

export function PatientTableHeader({ lastVisitSort, balanceSort, onToggleLastVisitSort, onToggleBalanceSort }: Props) {
  return (
    <thead>
      <tr>
        <th>Patient</th>
        <th>Contact</th>
        <th>First Visit</th>
        <th>
          <button type="button" className="patient-table__sortable" onClick={onToggleLastVisitSort} aria-label="Sort by last visit">
            Last Visit
            {getSortIcon(lastVisitSort)}
          </button>
        </th>
        <th>Remarks</th>
        <th>
          <button type="button" className="patient-table__sortable" onClick={onToggleBalanceSort} aria-label="Sort by balance">
            Balance
            {getSortIcon(balanceSort)}
          </button>
        </th>
        <th>Actions</th>
      </tr>
    </thead>
  );
}
