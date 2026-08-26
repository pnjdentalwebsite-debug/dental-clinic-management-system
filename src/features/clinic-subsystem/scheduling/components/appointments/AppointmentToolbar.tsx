import { AppointmentActions } from './AppointmentActions';

interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  statusFilter: string;
  procedureFilter: string;
  onDateFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onProcedureFilterChange: (value: string) => void;
  onShowToday: () => void;
  onShowNeedsAction: () => void;
  onClearFilters: () => void;
}

const dateOptions = ['All', 'Today', 'Tomorrow', 'This Week'];
const statusOptions = ['All', 'Scheduled', 'Confirmed', 'Waiting', 'In Treatment', 'Completed', 'Cancelled', 'No Show'];
const procedureOptions = ['All', 'Cleaning', 'Extraction', 'Consultation', 'Recall Check', 'Orthodontic Adjustment', 'Online Cleaning Booking'];

export function AppointmentToolbar({
  searchValue,
  onSearchChange,
  dateFilter,
  statusFilter,
  procedureFilter,
  onDateFilterChange,
  onStatusFilterChange,
  onProcedureFilterChange,
  onShowToday,
  onShowNeedsAction,
  onClearFilters
}: Props) {
  return (
    <div className="appointment-toolbar">
      <label className="appointment-toolbar__search">
        <span className="sr-only">Search appointments</span>
        <input
          className="form-input"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search appointment ID, patient, procedure, or dentist"
        />
      </label>

      <div className="appointment-toolbar__filters">
        <select className="form-input" value={dateFilter} onChange={(event) => onDateFilterChange(event.target.value)}>
          {dateOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="form-input" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          {statusOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="form-input" value={procedureFilter} onChange={(event) => onProcedureFilterChange(event.target.value)}>
          {procedureOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <AppointmentActions
        onShowToday={onShowToday}
        onShowNeedsAction={onShowNeedsAction}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}
