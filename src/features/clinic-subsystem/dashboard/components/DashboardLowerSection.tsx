import { useMemo } from 'react';
import { Building2, Stethoscope, UserPlus, Users } from 'lucide-react';
import { mockAssociateDentistService } from '../../../clinic-owner/services/mockAssociateDentistService';
import { mockStaffService } from '../../../clinic-owner/services/mockStaffService';
import type { DashboardActivityTimelineItem } from '../dashboard.activity.mock';
import { dashboardQuickActionsMock } from '../dashboard.quick-actions.mock';
import type { DashboardStatusItem } from '../dashboard.status.mock';
import { ClinicStatusOverview } from './ClinicStatusOverview';
import { QuickActionsPanel } from './QuickActionsPanel';
import { RecentActivityTimeline } from './RecentActivityTimeline';

interface Props {
  recentActivity?: DashboardActivityTimelineItem[];
  activeChairsCount?: number;
  onAction: (label: string) => void;
}

export function DashboardLowerSection({ recentActivity, activeChairsCount = 3, onAction }: Props) {
  const activeDentistsCount = useMemo(() => {
    return mockAssociateDentistService.listDentists().filter((d) => d.status === 'active' || !d.status).length;
  }, []);

  const activeStaffCount = useMemo(() => {
    return mockStaffService.listStaff().filter((s) => s.status === 'active' || !s.status).length;
  }, []);

  const statusItems: DashboardStatusItem[] = useMemo(() => [
    {
      id: 'status-active-dentists',
      title: 'Active Dentists',
      value: String(activeDentistsCount),
      description: 'Currently assigned doctors',
      icon: Stethoscope
    },
    {
      id: 'status-available-staff',
      title: 'Available Staff',
      value: String(activeStaffCount),
      description: 'Available support staff',
      icon: Users
    },
    {
      id: 'status-operating-rooms',
      title: 'Operating Rooms',
      value: String(activeChairsCount),
      description: 'Ready for procedures',
      icon: Building2
    }
  ], [activeDentistsCount, activeStaffCount, activeChairsCount]);

  const fallbackRecentActivity: DashboardActivityTimelineItem[] = useMemo(() => [
    {
      id: 'act-1',
      title: 'Clinic Hub Active',
      description: 'Angelo Dental Clinic operational workspace active.',
      time: 'Today',
      icon: UserPlus
    }
  ], []);

  const displayActivity = recentActivity && recentActivity.length > 0 ? recentActivity : fallbackRecentActivity;

  return (
    <section className="clinic-dashboard-section clinic-dashboard-section--lower" aria-label="Clinic branch overview and activity">
      <ClinicStatusOverview items={statusItems} />

      <div className="clinic-dashboard-lower__grid">
        <RecentActivityTimeline items={displayActivity} />
        <QuickActionsPanel actions={dashboardQuickActionsMock} onAction={onAction} />
      </div>
    </section>
  );
}
