import { Building2, Stethoscope, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardStatusItem {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export const dashboardStatusMock = [
  {
    id: 'status-active-dentists',
    title: 'Active Dentists',
    value: '4',
    description: 'Currently assigned doctors',
    icon: Stethoscope
  },
  {
    id: 'status-available-staff',
    title: 'Available Staff',
    value: '8',
    description: 'Available support staff',
    icon: Users
  },
  {
    id: 'status-operating-rooms',
    title: 'Operating Rooms',
    value: '3',
    description: 'Ready for procedures',
    icon: Building2
  }
] satisfies DashboardStatusItem[];
