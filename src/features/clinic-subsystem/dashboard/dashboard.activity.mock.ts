import { BellRing, CalendarCheck2, CreditCard, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardActivityTimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
}

export const dashboardActivityMock = [
  {
    id: 'activity-1',
    title: 'New Patient Registered',
    description: 'Juan Dela Cruz - Patient profile created',
    time: 'Today, 10:30 AM',
    icon: UserPlus
  },
  {
    id: 'activity-2',
    title: 'Appointment Completed',
    description: 'Maria Santos - Dental cleaning completed',
    time: 'Today, 11:45 AM',
    icon: CalendarCheck2
  },
  {
    id: 'activity-3',
    title: 'Recall Reminder Created',
    description: 'Pedro Reyes - Follow-up scheduled',
    time: 'Today, 1:20 PM',
    icon: BellRing
  },
  {
    id: 'activity-4',
    title: 'Payment Recorded',
    description: 'Juan Dela Cruz - Balance updated',
    time: 'Today, 2:05 PM',
    icon: CreditCard
  }
] satisfies DashboardActivityTimelineItem[];
