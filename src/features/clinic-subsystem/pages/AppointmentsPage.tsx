import { ClinicSubsystemPlaceholderPage } from '../components/ClinicSubsystemPlaceholderPage';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  onReturnToDashboard: () => void;
}

export function AppointmentsPage({ currentClinic, showToast, onReturnToDashboard }: Props) {
  return (
    <ClinicSubsystemPlaceholderPage
      title="Appointments"
      description={`Appointment management for ${currentClinic?.name || 'this clinic branch'} will be introduced in a later clinic scheduling phase.`}
      returnLabel="Return to Branch Dashboard"
      onReturn={() => {
        showToast('Appointments module is reserved for a future phase.', 'info');
        onReturnToDashboard();
      }}
    />
  );
}
