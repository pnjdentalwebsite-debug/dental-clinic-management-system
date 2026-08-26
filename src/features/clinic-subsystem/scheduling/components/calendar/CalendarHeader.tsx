import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface Props {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  viewMode: 'month' | 'week' | 'day' | 'list';
  onViewModeChange: (mode: 'month' | 'week' | 'day' | 'list') => void;
}

const viewModes: Array<{ key: 'month' | 'week' | 'day' | 'list'; label: string }> = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
  { key: 'list', label: 'List' }
];

export function CalendarHeader({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onToday,
  viewMode,
  onViewModeChange
}: Props) {
  return (
    <div className="calendar-header">
      <div className="calendar-header__nav">
        <button type="button" className="calendar-header__icon-btn" onClick={onPreviousMonth} aria-label="Previous month">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button type="button" className="calendar-header__today" onClick={onToday}>
          Today
        </button>
        <button type="button" className="calendar-header__icon-btn" onClick={onNextMonth} aria-label="Next month">
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <div className="calendar-header__title">
          <CalendarDays size={16} aria-hidden="true" />
          <h3>{monthLabel}</h3>
        </div>
      </div>

      <div className="calendar-header__views" role="group" aria-label="Calendar view mode">
        {viewModes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className={`calendar-header__view-btn ${viewMode === mode.key ? 'is-active' : ''}`}
            onClick={() => onViewModeChange(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
