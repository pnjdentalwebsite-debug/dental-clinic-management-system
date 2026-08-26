import type { DashboardAppointmentItem } from './dashboard.mock';

export const dashboardOperationalMock = {
  appointments: [
    {
      id: 'op-apt-1',
      time: '09:00 AM',
      patientName: 'Juan Dela Cruz',
      procedure: 'Dental Cleaning',
      dentist: 'Dr. Santos',
      status: 'Confirmed'
    },
    {
      id: 'op-apt-2',
      time: '10:30 AM',
      patientName: 'Maria Santos',
      procedure: 'Consultation',
      dentist: 'Dr. Cruz',
      status: 'Waiting'
    },
    {
      id: 'op-apt-3',
      time: '02:00 PM',
      patientName: 'Pedro Reyes',
      procedure: 'Extraction',
      dentist: 'Dr. Santos',
      status: 'Completed'
    }
  ] satisfies DashboardAppointmentItem[],
  summary: {
    total: 24,
    confirmed: 18,
    waiting: 4,
    completed: 2
  }
};
