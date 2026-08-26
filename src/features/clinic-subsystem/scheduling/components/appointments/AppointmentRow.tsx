import { CalendarCheck2, Eye, MoreHorizontal, PencilLine, Trash2, XCircle } from 'lucide-react';
import type { ScheduleAppointment } from '../../types';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

type AppointmentMenuAction = 'view' | 'edit' | 'confirm' | 'reschedule' | 'cancel' | 'delete';

interface Props {
  appointment: ScheduleAppointment;
  onSelect: (appointment: ScheduleAppointment) => void;
  isSelected: boolean;
  showMenu?: boolean;
  onToggleMenu?: (appointmentId: string) => void;
  onMenuAction?: (action: AppointmentMenuAction, appointment: ScheduleAppointment) => void;
}

const menuItems: Array<{ action: AppointmentMenuAction; label: string; icon: typeof Eye }> = [
  { action: 'view', label: 'View Appointment Details', icon: Eye },
  { action: 'edit', label: 'Edit Appointment', icon: PencilLine },
  { action: 'confirm', label: 'Confirm Appointment', icon: CalendarCheck2 },
  { action: 'reschedule', label: 'Reschedule Appointment', icon: PencilLine },
  { action: 'cancel', label: 'Cancel Appointment', icon: XCircle },
  { action: 'delete', label: 'Delete Appointment', icon: Trash2 }
];

export function AppointmentRow({
  appointment,
  onSelect,
  isSelected,
  showMenu = false,
  onToggleMenu,
  onMenuAction
}: Props) {
  const initials = appointment.patientName
    .split(/[,\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className={`appointment-row ${isSelected ? 'is-selected' : ''}`}>
      <button
        type="button"
        className="appointment-row__surface"
        onClick={() => onSelect(appointment)}
      >
        <div className="appointment-row__group appointment-row__group--booking">
          <span className="appointment-row__avatar">{initials || 'PT'}</span>
          <div className="appointment-row__identity">
            <strong>{appointment.patientName}</strong>
            <span>{appointment.id}</span>
          </div>
        </div>

        <div className="appointment-row__group">
          <strong>{formatDate(appointment.date)}</strong>
          <span>{appointment.time}</span>
        </div>

        <div className="appointment-row__group appointment-row__group--visit">
          <strong>{appointment.procedure}</strong>
          <span>{appointment.dentist || 'Unassigned'}</span>
        </div>

        <div className="appointment-row__status">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </button>

      <div className="appointment-row__actions">
        <button
          type="button"
          className="appointment-row__icon-button"
          aria-label={`View ${appointment.patientName} appointment`}
          onClick={() => onMenuAction?.('view', appointment)}
        >
          <Eye size={15} />
        </button>
        <button
          type="button"
          className="appointment-row__icon-button"
          aria-label={`Edit ${appointment.patientName} appointment`}
          onClick={() => onMenuAction?.('edit', appointment)}
        >
          <PencilLine size={15} />
        </button>
        <div className="appointment-row__menu-shell">
          <button
            type="button"
            className="appointment-row__icon-button"
            aria-label={`More appointment actions for ${appointment.patientName}`}
            aria-expanded={showMenu}
            onClick={() => onToggleMenu?.(appointment.id)}
          >
            <MoreHorizontal size={15} />
          </button>

          {showMenu ? (
            <div className="appointment-row__menu">
              {menuItems.map(({ action, label, icon: Icon }) => (
                <button
                  key={action}
                  type="button"
                  className={`appointment-row__menu-item${action === 'delete' ? ' is-danger' : ''}`}
                  onClick={() => onMenuAction?.(action, appointment)}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
