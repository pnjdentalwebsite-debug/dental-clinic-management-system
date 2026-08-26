import type { LucideIcon } from 'lucide-react';
import { ClinicMetricCard } from '../../components/ClinicMetricCard';
import type { DashboardTrendStatus } from '../dashboard.mock';

interface Props {
  title: string;
  value: string;
  description: string;
  trend: string;
  trendStatus: DashboardTrendStatus;
  icon: LucideIcon;
}

export function DashboardKPICard(props: Props) {
  return <ClinicMetricCard {...props} />;
}
