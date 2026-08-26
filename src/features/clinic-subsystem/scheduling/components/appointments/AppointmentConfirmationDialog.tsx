import { ConfirmationDialog } from '../../../../../components/overlays/ConfirmationDialog';

interface Props {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AppointmentConfirmationDialog({ open, title, description, loading, onConfirm, onCancel }: Props) {
  return (
    <ConfirmationDialog
      open={open}
      title={title}
      description={description}
      confirmLabel="Confirm"
      destructive={title.toLowerCase().includes('cancel') || title.toLowerCase().includes('no show')}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
