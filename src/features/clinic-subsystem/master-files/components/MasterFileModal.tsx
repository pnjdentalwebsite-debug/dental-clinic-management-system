import type { ReactNode } from 'react';
import { Modal } from '../../../../components/overlays/Modal';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  preview?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg';
}

export function MasterFileModal({
  open,
  title,
  description,
  preview,
  footer,
  children,
  onClose,
  width = 'lg'
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      headerContent={preview ? <div className="master-file-record-modal__header-stack">{preview}</div> : undefined}
      onClose={onClose}
      width={width}
      footer={footer}
    >
      <div className="master-file-record-modal">
        <div className="master-file-record-modal__body">
          {children}
        </div>
      </div>
    </Modal>
  );
}
