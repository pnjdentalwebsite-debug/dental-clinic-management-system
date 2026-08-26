import { CalendarDays, CreditCard, Smile, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DashboardTrendStatus = 'positive' | 'negative' | 'neutral';
export type DashboardSortDirection = 'asc' | 'desc';

export interface DashboardKPIItem {
  id: string;
  title: string;
  value: string;
  description: string;
  trend: string;
  trendStatus: DashboardTrendStatus;
  icon: LucideIcon;
}

export interface DashboardAppointmentItem {
  id: string;
  time: string;
  patientName: string;
  procedure: string;
  dentist: string;
  status: 'Confirmed' | 'Waiting' | 'Completed' | 'Cancelled';
}

export interface DashboardBirthdayItem {
  id: string;
  patientName: string;
  birthday: string;
  contact: string;
}

export interface DashboardBalanceItem {
  id: string;
  patientName: string;
  amount: string;
  lastBillDate: string;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
}

export interface DashboardQuickActionItem {
  id: string;
  label: string;
  description: string;
  icon: 'add-patient' | 'appointment' | 'calendar' | 'records';
}

export interface DashboardSummaryItem {
  label: string;
  value: string;
}

const appointmentTimes = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM'
];

const appointmentNames = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Pedro Reyes',
  'Ana Villanueva',
  'Carlo Mendoza',
  'Liza Perez',
  'Mark Bautista',
  'Nina Torres',
  'Owen Garcia',
  'Paula Lim',
  'Leah Cruz',
  'Noah Santos'
];

const appointmentProcedures = [
  'Dental Cleaning',
  'Consultation',
  'Extraction',
  'Filling',
  'Crown Fitting',
  'Tooth Polishing',
  'Root Canal Review',
  'Checkup',
  'Scaling',
  'Maintenance Visit',
  'Orthodontic Review',
  'Follow-up'
];

const appointmentDentists = ['Dr. Santos', 'Dr. Reyes', 'Dr. Cruz'];
const appointmentStatuses: DashboardAppointmentItem['status'][] = ['Confirmed', 'Waiting', 'Completed', 'Confirmed', 'Waiting'];

const birthdayDates = [
  'July 28',
  'August 5',
  'September 9',
  'October 1',
  'October 15',
  'November 4',
  'November 21',
  'December 7',
  'January 12',
  'February 8',
  'March 16',
  'April 2'
];

const birthdayNames = [
  'Juan Dela Cruz',
  'Maria Santos',
  'Ana Villanueva',
  'Pedro Reyes',
  'Carlo Mendoza',
  'Liza Perez',
  'Mark Bautista',
  'Nina Torres',
  'Owen Garcia',
  'Paula Lim',
  'Leah Cruz',
  'Noah Santos'
];

const balanceNames = [
  'Juan Dela Cruz',
  'Pedro Reyes',
  'Ana Villanueva',
  'Carlo Mendoza',
  'Liza Perez',
  'Mark Bautista',
  'Nina Torres',
  'Owen Garcia',
  'Paula Lim',
  'Leah Cruz',
  'Noah Santos',
  'Mia Flores',
  'Ella Cruz',
  'Zoe Martin',
  'Ava Gomez'
];

const billDates = [
  '2026-07-28',
  '2026-07-22',
  '2026-06-02',
  '2026-07-18',
  '2026-07-11',
  '2026-06-29',
  '2026-07-20',
  '2026-06-15',
  '2026-07-05',
  '2026-07-01',
  '2026-06-21',
  '2026-06-08'
];

const formatCurrency = (value: number) => `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const dashboardMockData = {
  kpis: [
    {
      id: 'kpi-total-patients',
      title: 'Total Patients',
      value: '1,250',
      description: 'Registered patient records',
      trend: '↑ +12% from last week',
      trendStatus: 'positive',
      icon: Users
    },
    {
      id: 'kpi-completed-visits',
      title: 'Completed Visits',
      value: '18',
      description: 'Completed visits / active consultations',
      trend: '↑ +8% from last week',
      trendStatus: 'positive',
      icon: CalendarDays
    },
    {
      id: 'kpi-waiting-patients',
      title: 'Waiting',
      value: '4',
      description: 'Patients waiting today',
      trend: '↓ -3% from last week',
      trendStatus: 'negative',
      icon: Smile
    },
    {
      id: 'kpi-revenue',
      title: 'Revenue',
      value: 'PHP 45,000',
      description: 'Current clinic revenue balance',
      trend: '↑ +15% from last week',
      trendStatus: 'positive',
      icon: CreditCard
    }
  ] satisfies DashboardKPIItem[],
  quickSummary: {
    appointments: Array.from({ length: 36 }, (_, index) => ({
      id: `summary-apt-${index + 1}`,
      time: appointmentTimes[index % appointmentTimes.length],
      patientName: appointmentNames[index % appointmentNames.length],
      procedure: appointmentProcedures[index % appointmentProcedures.length],
      dentist: appointmentDentists[index % appointmentDentists.length],
      status: appointmentStatuses[index % appointmentStatuses.length]
    })) satisfies DashboardAppointmentItem[],
    birthdays: Array.from({ length: 25 }, (_, index) => ({
      id: `bday-${index + 1}`,
      patientName: birthdayNames[index % birthdayNames.length],
      birthday: birthdayDates[index % birthdayDates.length],
      contact: `0912${String(7000000 + index * 137).slice(-7)}`
    })) satisfies DashboardBirthdayItem[],
    balances: Array.from({ length: 45 }, (_, index) => ({
      id: `bal-${index + 1}`,
      patientName: balanceNames[index % balanceNames.length],
      amount: formatCurrency(425 + index * 85),
      lastBillDate: billDates[index % billDates.length]
    })) satisfies DashboardBalanceItem[]
  }
};
