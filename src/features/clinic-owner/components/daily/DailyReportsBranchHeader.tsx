import { Calendar, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import type { BranchScopeOption } from '../../types/clinicAnalytics';

interface Props {
  selectedDate: string;
  formattedDateString: string;
  onDateChange: (date: string) => void;
  availableBranches: BranchScopeOption[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onPrintReport: () => void;
  onExportReport: () => void;
}

export function DailyReportsBranchHeader({
  selectedDate,
  formattedDateString,
  onDateChange,
  availableBranches,
  selectedBranchId,
  onSelectBranch,
  onPrintReport,
  onExportReport
}: Props) {
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      onDateChange(d.toISOString().split('T')[0]);
    }
  };

  const handleSetToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  return (
    <div
      className="dashboard-panel"
      style={{
        margin: 0,
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Top row: Title + Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#d97706'
              }}
            >
              Daily Operations & Audit
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}
            >
              End-of-Day Reconciliation
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Daily Reports & EOD Closing
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            End-of-day cash drawer reconciliation, dentist treatment productivity, and lab logistics ledger.
          </p>
        </div>

        {/* Print & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onPrintReport}
            style={{
              padding: '0.5rem 0.95rem',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              width: 'auto'
            }}
          >
            <Printer size={15} />
            Print Closing Sheet
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExportReport}
            style={{
              padding: '0.5rem 0.95rem',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              width: 'auto'
            }}
          >
            <Download size={15} />
            Export Audit PDF
          </button>
        </div>
      </div>

      {/* Date Switcher & Branch Selector Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Date Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleShiftDate(-1)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', width: 'auto', display: 'flex', alignItems: 'center' }}
            title="Previous Day"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSetToday}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', width: 'auto', fontWeight: 700 }}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleShiftDate(1)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', width: 'auto', display: 'flex', alignItems: 'center' }}
            title="Next Day"
          >
            <ChevronRight size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.4rem' }}>
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.4rem' }}>
              {formattedDateString}
            </span>
          </div>
        </div>

        {/* Branch Scope Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Branch:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onSelectBranch(e.target.value)}
            style={{
              padding: '0.45rem 2rem 0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              minWidth: '220px'
            }}
          >
            <option value="all">🏢 All Branches (Consolidated Audit)</option>
            {availableBranches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
