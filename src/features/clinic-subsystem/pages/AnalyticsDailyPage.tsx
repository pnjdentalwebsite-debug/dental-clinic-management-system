import { AnalyticsLayout } from '../analytics/components/AnalyticsLayout';
import { DailyResultsPage } from '../analytics/pages/DailyResultsPage';

interface Props {
  currentRoute: string;
  currentClinic: any;
  onNavigate: (route: string) => void;
}

export function AnalyticsDailyPage({ currentRoute, currentClinic, onNavigate }: Props) {
  return (
    <AnalyticsLayout currentRoute={currentRoute} currentClinic={currentClinic} onNavigate={onNavigate}>
      <DailyResultsPage currentClinic={currentClinic} />
    </AnalyticsLayout>
  );
}
