import { AnalyticsLayout } from '../analytics/components/AnalyticsLayout';
import { OverviewResultsPage } from '../analytics/pages/OverviewResultsPage';

interface Props {
  currentRoute: string;
  currentClinic: any;
  onNavigate: (route: string) => void;
}

export function AnalyticsOverviewPage({ currentRoute, currentClinic, onNavigate }: Props) {
  return (
    <AnalyticsLayout currentRoute={currentRoute} currentClinic={currentClinic} onNavigate={onNavigate}>
      <OverviewResultsPage currentClinic={currentClinic} />
    </AnalyticsLayout>
  );
}
