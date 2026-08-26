import type { ScheduleAppointment } from '../../types';
import { AppointmentRow } from './AppointmentRow';

type AppointmentMenuAction = 'view' | 'edit' | 'confirm' | 'reschedule' | 'cancel' | 'delete';

interface Props {
  appointments: ScheduleAppointment[];
  selectedAppointmentId?: string;
  onSelectAppointment: (appointment: ScheduleAppointment) => void;
  activeMenuAppointmentId?: string | null;
  onToggleMenu?: (appointmentId: string) => void;
  onMenuAction?: (action: AppointmentMenuAction, appointment: ScheduleAppointment) => void;
}

export function AppointmentTable({
  appointments,
  selectedAppointmentId,
  onSelectAppointment,
  activeMenuAppointmentId,
  onToggleMenu,
  onMenuAction
}: Props) {
  return (
    <div className="appointment-table">
      <div className="appointment-table__header">
        <span>Booking</span>
        <span>Schedule</span>
        <span>Visit Details</span>
        <span>Status</span>
        <span>Open</span>
      </div>
      <div className="appointment-table__body">
        {appointments.map((appointment) => (
          <AppointmentRow
            key={appointment.id}
            appointment={appointment}
            onSelect={onSelectAppointment}
            isSelected={selectedAppointmentId === appointment.id}
            showMenu={activeMenuAppointmentId === appointment.id}
            onToggleMenu={onToggleMenu}
            onMenuAction={onMenuAction}
          />
        ))}
      </div>
    </div>
  );
}
