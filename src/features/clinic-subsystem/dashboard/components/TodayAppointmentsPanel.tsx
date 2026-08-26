import { ArrowRight } from 'lucide-react';
import type { DashboardAppointmentItem } from '../dashboard.mock';
import { AppointmentListItem } from './AppointmentListItem';

interface Props {
  appointments: DashboardAppointmentItem[];
  onViewSchedule: () => void;
}

export function TodayAppointmentsPanel({ appointments, onViewSchedule }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel clinic-appointment-overview">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Today's Appointments</h2>
          <p className="clinic-dashboard-panel__subtitle">Daily dental schedule visibility for the selected clinic branch.</p>
        </div>
        <button type="button" className="clinic-appointment-overview__link" onClick={onViewSchedule}>
          View Full Schedule <ArrowRight size={16} />
        </button>
      </div>
      <div className="clinic-appointment-list">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <AppointmentListItem
              key={appointment.id}
              time={appointment.time}
              patientName={appointment.patientName}
              procedure={appointment.procedure}
              dentist={appointment.dentist}
              status={appointment.status}
            />
          ))
        ) : (
          <div className="clinic-dashboard-empty-state">
            <strong>No appointments scheduled today.</strong>
            <p>The dashboard is ready to show live clinic appointments when data is connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
