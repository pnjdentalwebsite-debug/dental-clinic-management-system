import type { CalendarScheduleItem, ScheduleAppointment } from '../../types';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { AppointmentStatusHistory, type AppointmentStatusHistoryEntry } from './AppointmentStatusHistory';
import { AppointmentStatusActions } from './AppointmentStatusActions';

type AppointmentDetailsRecord = ScheduleAppointment & {
  scheduleType?: CalendarScheduleItem['type'];
  notes?: string;
};

interface Props {
  appointment: AppointmentDetailsRecord | null;
  statusHistory: AppointmentStatusHistoryEntry[];
  onRequestTransition: (nextStatus: ScheduleAppointment['status'], confirmMessage: string) => void;
}

export function AppointmentDetailsPanel({ appointment, statusHistory, onRequestTransition }: Props) {
  if (!appointment) {
    return (
      <div className="appointment-details-panel appointment-details-panel--empty">
        <strong>Select an appointment</strong>
        <p>Choose a record from the table to preview appointment details.</p>
      </div>
    );
  }

  return (
    <aside className="appointment-details-panel">
      <p className="appointment-details-panel__eyebrow">Appointment Details</p>
      <h3>{appointment.patientName}</h3>
      <AppointmentStatusBadge status={appointment.status} />

      <dl className="appointment-details-panel__list">
        <div>
          <dt>Appointment ID</dt>
          <dd>{appointment.id}</dd>
        </div>
        <div>
          <dt>Patient</dt>
          <dd>{appointment.patientName}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatDate(appointment.date)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{appointment.time}</dd>
        </div>
        <div>
          <dt>Procedure</dt>
          <dd>{appointment.procedure}</dd>
        </div>
        <div>
          <dt>Dentist</dt>
          <dd>{appointment.dentist}</dd>
        </div>
        <div>
          <dt>Booking Source</dt>
          <dd>{formatType(appointment.scheduleType)}</dd>
        </div>
        <div>
          <dt>Front Desk Notes</dt>
          <dd>{appointment.notes || 'No additional booking notes yet.'}</dd>
        </div>
      </dl>

      <AppointmentStatusHistory history={statusHistory} />
      <AppointmentStatusActions
        status={appointment.status}
        onAction={(nextStatus) => {
          const confirmMessage = `Confirm changing appointment status to ${nextStatus}?`;
          onRequestTransition(nextStatus, confirmMessage);
        }}
      />
    </aside>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatType(value?: CalendarScheduleItem['type']) {
  if (!value) return 'Manual appointment';
  if (value === 'online') return 'Online booking';
  if (value === 'recalls') return 'Recall scheduling';
  if (value === 'appointments') return 'Direct appointment';
  return value;
}
