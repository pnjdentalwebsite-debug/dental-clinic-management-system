import type { DashboardQuickActionItem } from './dashboard.mock';

export const dashboardQuickActionsMock = [
  {
    id: 'quick-add-patient',
    label: 'Add Patient',
    description: 'Prepare a new patient intake record.',
    icon: 'add-patient'
  },
  {
    id: 'quick-create-appointment',
    label: 'Create Appointment',
    description: 'Open the appointment scheduling flow.',
    icon: 'appointment'
  },
  {
    id: 'quick-view-calendar',
    label: 'View Calendar',
    description: 'Review the branch schedule board.',
    icon: 'calendar'
  },
  {
    id: 'quick-patient-records',
    label: 'Patient Records',
    description: 'Open the patient records workspace.',
    icon: 'records'
  }
] satisfies DashboardQuickActionItem[];
