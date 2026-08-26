import { Download } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';

export function ExportMenu({ onCurrentPage, onAllRows }: { onCurrentPage: () => void; onAllRows: () => void }) {
  return (
    <RowActionMenu
      ariaLabel="Export report"
      items={[
        { id: 'current', label: 'Export Current Page', icon: Download, onSelect: onCurrentPage },
        { id: 'all', label: 'Export All Filtered Rows', icon: Download, onSelect: onAllRows }
      ]}
    />
  );
}
