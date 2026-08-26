import {
  Bell,
  Cake,
  CalendarCheck,
  CalendarRange,
  Globe2,
  Monitor
} from 'lucide-react';
import type { CalendarScheduleItem, CalendarScheduleType } from '../../types';

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  key: string;
}

interface Props {
  days: DayCell[];
  eventsByDate: Map<string, CalendarScheduleItem[]>;
  onDateSelect: (date: Date) => void;
  selectedDateKey: string;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const visibleIconLimit = 5;

export function CalendarGrid({
  days,
  eventsByDate,
  onDateSelect,
  selectedDateKey
}: Props) {
  return (
    <div className="calendar-grid">
      <div className="calendar-grid__weekdays" role="presentation">
        {weekdayLabels.map((weekday) => (
          <div key={weekday} className="calendar-grid__weekday">{weekday}</div>
        ))}
      </div>

      <div className="calendar-grid__body">
        {days.map((day) => {
          const dayEvents = eventsByDate.get(day.key) || [];
          const isSelected = day.key === selectedDateKey;
          const isToday = isSameDay(day.date, new Date());

          return (
            <button
              type="button"
              key={day.key}
              className={`calendar-grid__cell ${day.isCurrentMonth ? '' : 'is-outside'} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => onDateSelect(day.date)}
            >
              <div className="calendar-grid__cell-header">
                <span className={`calendar-grid__day-number ${isToday ? 'is-today' : ''}`}>
                  {day.date.getDate()}
                  {isToday && <span className="calendar-grid__today-label">Today</span>}
                </span>
                {dayEvents.length > 0 && (
                  <span className="calendar-grid__event-count" aria-label={`${dayEvents.length} scheduled items`}>
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {dayEvents.length > 0 && (
                <div className="calendar-grid__events" aria-hidden="true">
                  {dayEvents.slice(0, visibleIconLimit).map((event) => (
                    <span
                      key={event.id}
                      className={`calendar-grid__event-icon calendar-grid__event-icon--${event.type}`}
                      title={event.title}
                    >
                      <CalendarEventIcon type={event.type} />
                    </span>
                  ))}
                  {dayEvents.length > visibleIconLimit && (
                    <span className="calendar-grid__more-events">+{dayEvents.length - visibleIconLimit}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarEventIcon({ type }: { type: CalendarScheduleType }) {
  if (type === 'recalls') return <Bell size={12} aria-hidden="true" />;
  if (type === 'birthdays') return <Cake size={12} aria-hidden="true" />;
  if (type === 'events') return <CalendarRange size={12} aria-hidden="true" />;
  if (type === 'online') return <Monitor size={12} aria-hidden="true" />;
  if (type === 'google') return <Globe2 size={12} aria-hidden="true" />;
  return <CalendarCheck size={12} aria-hidden="true" />;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
