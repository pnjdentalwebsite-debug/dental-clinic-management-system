import { ClinicSubsystemPlaceholderPage } from '../components/ClinicSubsystemPlaceholderPage';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  onReturnToDashboard: () => void;
}

export function CalendarPage({ currentClinic, showToast, onReturnToDashboard }: Props) {
  return (
    <ClinicSubsystemPlaceholderPage
      title="Calendar Module"
      description={`Calendar scheduling for ${currentClinic?.name || 'this clinic branch'} is not implemented yet. This route is reserved for the future scheduling phase.`}
      returnLabel="Return to Branch Dashboard"
      onReturn={() => {
        showToast('Calendar module is reserved for a future phase.', 'info');
        onReturnToDashboard();
      }}
    />
  );
}
