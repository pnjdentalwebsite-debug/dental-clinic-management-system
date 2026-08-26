export function OutstandingBalanceCard() {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Outstanding Balance Overview</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Pending Balance</span>
          <strong style={{ fontSize: '1rem', color: 'var(--danger)' }}>PHP 65,000</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Overdue (&gt; 30 Days)</span>
            <span style={{ fontWeight: 600 }}>PHP 45,000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current (0-30 Days)</span>
            <span style={{ fontWeight: 600 }}>PHP 20,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
