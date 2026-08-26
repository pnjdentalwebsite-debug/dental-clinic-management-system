import { ClinicPageHeader } from '../components/ClinicPageHeader';
import { SettingsWorkspacePage } from '../settings/pages/SettingsWorkspacePage';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onReturnToDashboard: () => void;
}

export function SettingsPage({ currentClinic, showToast, onReturnToDashboard }: Props) {
  const currentDateLabel = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="clinic-settings">
      <ClinicPageHeader
        sectionLabel="SETTINGS"
        title="Settings"
        subtitle="Manage clinic preferences and workspace behavior."
        date={currentDateLabel}
        actions={(
          <button type="button" className="btn btn-outline clinic-settings__return" onClick={onReturnToDashboard}>
            Return to Branch Dashboard
          </button>
        )}
      />
      <SettingsWorkspacePage currentClinic={currentClinic} showToast={showToast} />
    </div>
  );
}
