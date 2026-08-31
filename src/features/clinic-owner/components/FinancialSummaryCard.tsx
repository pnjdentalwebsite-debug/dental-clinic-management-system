import { DollarSign, AlertCircle } from 'lucide-react';

interface Props {
  collected?: number;
  outstanding?: number;
  unavailableMessage?: string;
}

export function FinancialSummaryCard({ collected, outstanding, unavailableMessage }: Props) {
  const hasAuthoritativeTotals = typeof collected === 'number' && typeof outstanding === 'number';

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Financial Summary</h3>
      {!hasAuthoritativeTotals ? (
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>Financial totals unavailable</strong>
          {unavailableMessage || 'Authoritative financial data is not available.'}
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Total Collected</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              PHP {collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--warning-light)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Outstanding Balance</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              PHP {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
