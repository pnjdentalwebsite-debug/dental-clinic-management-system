import { ClinicStatusCard } from '../../components/ClinicStatusCard';

interface StatusItem {
  id: string;
  label: string;
  value: string;
}

interface Props {
  items: StatusItem[];
}

export function DashboardStatusSection({ items }: Props) {
  return <ClinicStatusCard items={items} />;
}
