import type { ReactNode } from 'react';
import { Modal } from '../../../../components/overlays/Modal';
import { DashboardSortControl } from './DashboardSortControl';

interface SortOption {
  value: string;
  label: string;
}

interface Props {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  sortMode: string;
  onSortModeChange: (value: string) => void;
  sortOptions: SortOption[];
  sortLabel?: string;
  footerContent?: ReactNode;
}

export function DashboardModal({
  open,
  title,
  description,
  children,
  onClose,
  sortMode,
  onSortModeChange,
  sortOptions,
  sortLabel,
  footerContent
}: Props) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose} width="lg" footer={footerContent}>
      <div className="dashboard-modal">
        <div className="dashboard-modal__toolbar">
          <DashboardSortControl sortMode={sortMode} onChange={onSortModeChange} options={sortOptions} label={sortLabel} />
        </div>
        <div className="dashboard-modal__list">{children}</div>
      </div>
    </Modal>
  );
}
