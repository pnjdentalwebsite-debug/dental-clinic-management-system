import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  footerPrefix?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  children,
  footerPrefix,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={loading ? () => undefined : onCancel}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      role={destructive ? 'alertdialog' : 'dialog'}
      plainCloseButton
      footer={(
        <div className="confirmation-dialog__footer">
          {footerPrefix ? <div className="confirmation-dialog__footer-prefix">{footerPrefix}</div> : null}
          <div className="confirmation-dialog__footer-actions">
            <button className="btn btn-outline confirmation-dialog__cancel" style={{ width: 'auto' }} type="button" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className={`btn btn-primary confirmation-dialog__confirm ${destructive ? 'is-destructive' : ''}`}
              style={{ width: 'auto', backgroundColor: destructive ? 'var(--danger)' : undefined }}
              type="button"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      )}
    >
      <div className="confirmation-dialog">
        <div className={`confirmation-dialog__summary ${destructive ? 'is-destructive' : ''}`}>
          <div className="confirmation-dialog__icon">
            <AlertTriangle size={18} />
          </div>
          <div className="confirmation-dialog__copy">
            <strong>{destructive ? 'This action will remove the selected record.' : 'Please review this action before continuing.'}</strong>
            <span>{description}</span>
          </div>
        </div>
        {children}
      </div>
    </Modal>
  );
}
