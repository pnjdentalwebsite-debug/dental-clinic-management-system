import type { ReactNode } from 'react';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';

interface Props {
  sectionLabel: string;
  title: string;
  subtitle?: string;
  date?: string;
  actions?: ReactNode;
}

export function DashboardHeader(props: Props) {
  return <ClinicPageHeader {...props} />;
}
