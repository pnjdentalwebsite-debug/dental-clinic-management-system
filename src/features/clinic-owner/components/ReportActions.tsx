import { FileText, Printer, Download } from 'lucide-react';

interface Props {
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export function ReportActions({ showToast }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Report Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          onClick={() => showToast('Generating operational daily report (mock visual).', 'success')}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        >
          <FileText size={16} /> Generate Full Report
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => showToast('Opening system print settings (mock).', 'info')}
            className="btn btn-outline"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.8rem' }}
          >
            <Printer size={14} /> Print Summary
          </button>
          <button
            onClick={() => showToast('Exporting preview to CSV sheet (mock).', 'success')}
            className="btn btn-outline"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.8rem' }}
          >
            <Download size={14} /> Export Preview
          </button>
        </div>
      </div>
    </div>
  );
}
