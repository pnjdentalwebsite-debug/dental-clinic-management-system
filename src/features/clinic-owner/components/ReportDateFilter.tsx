import { Calendar } from 'lucide-react';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export function ReportDateFilter({ selectedDate, onDateChange, showToast }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Calendar size={18} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Date:</span>
        <select
          value={selectedDate}
          onChange={(e) => { onDateChange(e.target.value); showToast(`Report date changed to ${e.target.value}.`, 'info'); }}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="2026-07-28">July 28, 2026</option>
          <option value="2026-07-27">July 27, 2026</option>
          <option value="2026-07-26">July 26, 2026</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => { onDateChange('2026-07-28'); showToast('Loaded today\'s operational metrics.', 'success'); }}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          Today
        </button>
        <button
          onClick={() => { onDateChange('2026-07-27'); showToast('Loaded yesterday\'s metrics.', 'info'); }}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          Previous Day
        </button>
      </div>
    </div>
  );
}
