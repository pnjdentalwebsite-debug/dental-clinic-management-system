export function FinancialActivityCard() {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Today's Financial Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Collected Today</span>
          <strong style={{ fontSize: '1rem', color: 'var(--success)' }}>PHP 18,500</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Verification</span>
          <strong style={{ fontSize: '1rem', color: 'var(--warning)' }}>PHP 7,000</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Transaction Count</span>
          <span style={{ fontWeight: 600 }}>24 Payments</span>
        </div>
      </div>
    </div>
  );
}
