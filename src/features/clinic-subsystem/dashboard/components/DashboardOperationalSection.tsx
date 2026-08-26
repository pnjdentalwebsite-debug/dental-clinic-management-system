import { useMemo } from 'react';
import { getClinicScheduleItems } from '../../scheduling/scheduleStorage';
import type { DashboardAppointmentItem } from '../dashboard.mock';
import { AppointmentSummaryPanel } from './AppointmentSummaryPanel';
import { TodayAppointmentsPanel } from './TodayAppointmentsPanel';

interface Props {
  onViewSchedule?: () => void;
}

export function DashboardOperationalSection({ onViewSchedule }: Props) {
  const currentDate = new Date().toISOString().split('T')[0];
  const schedules = useMemo(() => getClinicScheduleItems(), []);

  // Filter actual today's appointments
  const todayAppointments: DashboardAppointmentItem[] = useMemo(() => {
    return schedules
      .filter((s) => s.type !== 'birthdays' && (s.date === currentDate || !s.date))
      .map((s, idx) => ({
        id: s.id || `op-apt-${idx}`,
        time: s.time || s.startTime || '09:00 AM',
        patientName: s.patientName || 'Patient',
        procedure: s.procedure || s.title || 'General Consultation',
        dentist: s.dentist || 'Assigned Associate Dentist',
        status: s.status === 'Completed' ? 'Completed' : s.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'
      }));
  }, [schedules, currentDate]);

  const confirmedCount = todayAppointments.filter((a) => a.status === 'Confirmed').length;
  const waitingCount = todayAppointments.filter((a) => a.status === 'Waiting').length;
  const completedCount = todayAppointments.filter((a) => a.status === 'Completed').length;

  const summaryItems = [
    { label: 'Confirmed', value: String(confirmedCount) },
    { label: 'Waiting', value: String(waitingCount) },
    { label: 'Completed', value: String(completedCount) }
  ];

  return (
    <section className="clinic-dashboard-section clinic-dashboard-section--operational" aria-label="Operational dashboard">
      <div className="clinic-dashboard-operational-grid">
        <TodayAppointmentsPanel
          appointments={todayAppointments}
          onViewSchedule={onViewSchedule || (() => undefined)}
        />
        <AppointmentSummaryPanel items={summaryItems} total={String(todayAppointments.length)} />
      </div>
    </section>
  );
}
