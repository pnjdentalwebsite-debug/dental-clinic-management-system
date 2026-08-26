export function BranchActivityCard() {
  const branches = [
    { name: 'Main Branch (Quezon City)', patients: 25, revenue: 'PHP 12,000' },
    { name: 'South Branch (Makati)', patients: 17, revenue: 'PHP 6,500' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Branch Daily Activity Comparison</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {branches.map((b, idx) => (
          <div key={idx} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'block' }}>{b.patients} Patients</span>
              <span style={{ color: 'var(--success)' }}>{b.revenue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
