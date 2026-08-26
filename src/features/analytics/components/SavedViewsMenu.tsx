import { useState } from 'react';
import { Copy, FileText, Pencil, Save, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { AnalyticsReportKey, SavedReportView } from '../types';

interface Props {
  reportKey: AnalyticsReportKey;
  views: SavedReportView[];
  onSave: (name: string) => void;
  onApply: (view: SavedReportView) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedViewsMenu({ reportKey, views, onSave, onApply, onRename, onDuplicate, onDelete }: Props) {
  const [modal, setModal] = useState<'save' | 'rename' | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SavedReportView | null>(null);
  const reportViews = views.filter(item => item.reportKey === reportKey);
  return (
    <>
      <RowActionMenu
        ariaLabel="Saved report views"
        items={[
          { id: 'save', label: 'Save Current View', icon: Save, onSelect: () => { setName(''); setModal('save'); } },
          { id: 'sep', separator: true },
          ...reportViews.flatMap(view => [
            { id: `apply-${view.id}`, label: `Apply ${view.name}`, icon: FileText, onSelect: () => onApply(view) },
            { id: `rename-${view.id}`, label: `Rename ${view.name}`, icon: Pencil, onSelect: () => { setSelected(view); setName(view.name); setModal('rename'); } },
            { id: `duplicate-${view.id}`, label: `Duplicate ${view.name}`, icon: Copy, onSelect: () => onDuplicate(view.id) },
            { id: `delete-${view.id}`, label: `Delete ${view.name}`, icon: Trash2, destructive: true, onSelect: () => onDelete(view.id) },
            { id: `sep-${view.id}`, separator: true }
          ])
        ]}
      />
      <Modal
        open={Boolean(modal)}
        title={modal === 'rename' ? 'Rename Saved View' : 'Save Report View'}
        description="Saved views store mock frontend filters only. They do not schedule reports."
        onClose={() => setModal(null)}
        footer={<><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => { if (modal === 'rename' && selected) onRename(selected.id, name); else onSave(name); setModal(null); }}>Save View</button></>}
      >
        <label className="filter-control"><span>View Name</span><input className="form-input" value={name} onChange={event => setName(event.target.value)} /></label>
      </Modal>
    </>
  );
}
