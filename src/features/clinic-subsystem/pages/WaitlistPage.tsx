import { ClinicSubsystemPlaceholderPage } from '../components/ClinicSubsystemPlaceholderPage';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  onReturnToDashboard: () => void;
}

export function WaitlistPage({ currentClinic, showToast, onReturnToDashboard }: Props) {
  return (
    <ClinicSubsystemPlaceholderPage
      title="Daily Waitlist"
      description={`The daily waitlist workspace for ${currentClinic?.name || 'this clinic branch'} is reserved for a future scheduling release.`}
      returnLabel="Return to Branch Dashboard"
      onReturn={() => {
        showToast('Daily waitlist module is reserved for a future phase.', 'info');
        onReturnToDashboard();
      }}
    />
  );
}
