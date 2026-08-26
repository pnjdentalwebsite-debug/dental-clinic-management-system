import type { ScheduleStatus } from '../../types';

interface Props {
  status: ScheduleStatus;
  onAction: (nextStatus: ScheduleStatus) => void;
}

const actionMap: Record<ScheduleStatus, Array<{ label: string; nextStatus: ScheduleStatus; confirmLabel: string }>> = {
  Scheduled: [
    { label: 'Confirm Appointment', nextStatus: 'Confirmed', confirmLabel: 'Confirm appointment to Confirmed?' },
    { label: 'Cancel Appointment', nextStatus: 'Cancelled', confirmLabel: 'Confirm changing appointment status to Cancelled?' }
  ],
  Confirmed: [
    { label: 'Check In Patient', nextStatus: 'Waiting', confirmLabel: 'Confirm changing appointment status to Waiting?' },
    { label: 'Mark No Show', nextStatus: 'No Show', confirmLabel: 'Confirm changing appointment status to No Show?' },
    { label: 'Cancel Appointment', nextStatus: 'Cancelled', confirmLabel: 'Confirm changing appointment status to Cancelled?' }
  ],
  Waiting: [
    { label: 'Start Treatment', nextStatus: 'In Treatment', confirmLabel: 'Confirm changing appointment status to In Treatment?' }
  ],
  'In Treatment': [
    { label: 'Complete Treatment', nextStatus: 'Completed', confirmLabel: 'Confirm changing appointment status to Completed?' }
  ],
  Completed: [],
  Cancelled: [],
  'No Show': []
};

export function AppointmentStatusActions({ status, onAction }: Props) {
  const actions = actionMap[status] || [];

  return (
    <div className="appointment-status-actions">
      <h4>Available Actions</h4>
      {actions.length > 0 ? (
        <div className="appointment-status-actions__list">
          {actions.map((action) => (
            <button
              key={action.nextStatus}
              type="button"
              className="btn btn-outline appointment-status-actions__button"
              onClick={() => onAction(action.nextStatus)}
              data-confirm-label={action.confirmLabel}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="appointment-status-actions__empty">No actions available for the current status.</p>
      )}
    </div>
  );
}
