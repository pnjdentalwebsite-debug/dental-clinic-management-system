import { AlertCircle, CalendarDays, RotateCcw } from 'lucide-react';

interface Props {
  onShowToday?: () => void;
  onShowNeedsAction?: () => void;
  onClearFilters?: () => void;
}

export function AppointmentActions({ onShowToday, onShowNeedsAction, onClearFilters }: Props) {
  return (
    <div className="appointment-actions">
      <button type="button" className="btn btn-outline appointment-actions__button" onClick={onShowToday}>
        <CalendarDays size={14} aria-hidden="true" />
        Today Queue
      </button>
      <button type="button" className="btn btn-outline appointment-actions__button" onClick={onShowNeedsAction}>
        <AlertCircle size={14} aria-hidden="true" />
        Needs Action
      </button>
      <button type="button" className="btn btn-outline appointment-actions__button" onClick={onClearFilters}>
        <RotateCcw size={14} aria-hidden="true" />
        Clear Filters
      </button>
    </div>
  );
}
