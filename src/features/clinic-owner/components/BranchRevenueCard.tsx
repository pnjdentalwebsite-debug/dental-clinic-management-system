export function BranchRevenueCard() {
  const branches = [
    { name: 'Main Branch (Quezon City)', collected: 'PHP 110,000', pending: 'PHP 40,000' },
    { name: 'South Branch (Makati)', collected: 'PHP 70,000', pending: 'PHP 25,000' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Branch Revenue Performance</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {branches.map((b, idx) => (
          <div key={idx} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600, display: 'block' }}>Collected: {b.collected}</span>
              <span style={{ color: 'var(--text-muted)' }}>Pending: {b.pending}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
