import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO string "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: string; // ISO string "YYYY-MM-DD"
  minDate?: string; // ISO string "YYYY-MM-DD"
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
// Support historical years back to 1900 up to future planning years (2036+)
const years = Array.from({ length: currentYear - 1900 + 15 }, (_, i) => 1900 + i);

const isSameDay = (d1: Date | null, d2: Date | null) => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const formatDateForInput = (isoString: string) => {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length !== 3) return isoString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const parseDateStart = (isoString?: string) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export function DatePicker({ value, onChange, placeholder = 'dd/mm/yyyy', disabled = false, maxDate, minDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxDateObj = parseDateStart(maxDate);
  const minDateObj = parseDateStart(minDate);

  // Parse initial selected date
  const selectedDate = value ? new Date(value) : null;

  // Track navigation date (starts on selectedDate or today)
  const [navDate, setNavDate] = useState(() => selectedDate || new Date());

  // Update navigation date if selected date changes
  useEffect(() => {
    if (value) {
      setNavDate(new Date(value));
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navMonth = navDate.getMonth();
  const navYear = navDate.getFullYear();

  const handlePrevMonth = () => {
    setNavDate(new Date(navYear, navMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(navYear, navMonth + 1, 1));
  };

  const handleMonthChange = (m: number) => {
    setNavDate(new Date(navYear, m, 1));
  };

  const handleYearChange = (y: number) => {
    setNavDate(new Date(y, navMonth, 1));
  };

  const handleDayClick = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (maxDateObj && checkDate > maxDateObj) return;
    if (minDateObj && checkDate < minDateObj) return;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (maxDateObj && today > maxDateObj) return;
    if (minDateObj && today < minDateObj) return;

    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  // Generate calendar days
  const firstDayIndex = new Date(navYear, navMonth, 1).getDay();
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const prevMonthDays = new Date(navYear, navMonth, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  const today = new Date();

  // Preceding month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      date: new Date(navYear, navMonth - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      date: new Date(navYear, navMonth, i),
      isCurrentMonth: true
    });
  }

  // Succeeding month days
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      date: new Date(navYear, navMonth + 1, i),
      isCurrentMonth: false
    });
  }

  return (
    <div className="custom-datepicker-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div className="input-with-icon-wrapper" onClick={() => !disabled && setIsOpen(!isOpen)} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="text"
          value={formatDateForInput(value)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <button type="button" className="datepicker-toggle-btn" aria-label="Open calendar" disabled={disabled}>
          <Calendar size={14} className="input-right-icon" />
        </button>
      </div>

      {isOpen && (
        <div className="custom-datepicker-popover">
          <header className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <div className="datepicker-selects">
              <select
                className="datepicker-select"
                value={navMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                className="datepicker-select"
                value={navYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" className="datepicker-nav-btn" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </header>

          <div className="datepicker-weekdays">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="datepicker-days-grid">
            {cells.map((cell, idx) => {
              const isSelected = isSameDay(cell.date, selectedDate);
              const isTodayDay = isSameDay(cell.date, today);

              const cellDateStart = new Date(cell.date);
              cellDateStart.setHours(0, 0, 0, 0);
              const isFutureDisabled = maxDateObj ? cellDateStart > maxDateObj : false;
              const isPastDisabled = minDateObj ? cellDateStart < minDateObj : false;
              const isCellDisabled = isFutureDisabled || isPastDisabled;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isCellDisabled}
                  className={`datepicker-day-cell ${cell.isCurrentMonth ? '' : 'is-outside-month'} ${isSelected ? 'is-selected' : ''} ${isTodayDay ? 'is-today' : ''} ${isCellDisabled ? 'is-disabled' : ''}`}
                  style={isCellDisabled ? { opacity: 0.35, cursor: 'not-allowed', textDecoration: 'line-through' } : undefined}
                  onClick={() => handleDayClick(cell.date)}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          <footer className="datepicker-footer">
            <button type="button" className="datepicker-footer-btn" onClick={handleClear}>Clear</button>
            <button
              type="button"
              className="datepicker-footer-btn"
              onClick={handleToday}
              disabled={Boolean(maxDateObj && parseDateStart(new Date().toISOString())! > maxDateObj)}
            >
              Today
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
