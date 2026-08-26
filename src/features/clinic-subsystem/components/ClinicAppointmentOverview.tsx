import { ArrowRight } from 'lucide-react';
import { ClinicAppointmentItem } from './ClinicAppointmentItem';

interface AppointmentItem {
  id: string;
  time: string;
  patientName: string;
  procedure: string;
  dentist: string;
  status: 'Confirmed' | 'Waiting' | 'Completed' | 'Cancelled';
}

interface SummaryItem {
  id: string;
  label: string;
  value: string;
}

interface Props {
  appointments: AppointmentItem[];
  summary: SummaryItem[];
  onViewSchedule: () => void;
}

export function ClinicAppointmentOverview({ appointments, summary, onViewSchedule }: Props) {
  return (
    <section className="clinic-dashboard-overview" aria-label="Today's appointment overview">
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
              <ClinicAppointmentItem
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

      <section className="dashboard-panel clinic-dashboard-panel clinic-appointment-summary">
        <div className="clinic-dashboard-panel__header">
          <div>
            <h2 className="clinic-dashboard-panel__title">Appointment Summary</h2>
            <p className="clinic-dashboard-panel__subtitle">Compact schedule totals for today.</p>
          </div>
        </div>
        <div className="clinic-appointment-summary__total">
          <span>Today's Total</span>
          <strong>24</strong>
        </div>
        <div className="clinic-appointment-summary__list">
          {summary.length > 0 ? (
            summary.map((item) => (
              <div key={item.id} className="clinic-appointment-summary__item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))
          ) : (
            <div className="clinic-dashboard-empty-state clinic-dashboard-empty-state--inline">
              <strong>No summary available yet.</strong>
              <p>Schedule totals will appear here once branch data is available.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
