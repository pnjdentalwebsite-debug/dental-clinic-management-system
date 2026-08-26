import type { ScheduleAppointment } from '../../types';

interface Props {
  event: ScheduleAppointment;
}

export function CalendarEvent({ event }: Props) {
  return (
    <article className={`calendar-event calendar-event--${event.status.toLowerCase()}`}>
      <strong className="calendar-event__patient">{event.patientName}</strong>
      <span className="calendar-event__type">{event.procedure}</span>
      <div className="calendar-event__meta">
        <span>{event.time}</span>
        <span>{event.status}</span>
      </div>
    </article>
  );
}
