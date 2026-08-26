export function CollectionBreakdownCard() {
  const breakdowns = [
    { label: 'Completed Payments', value: 'PHP 180,000', percentage: '73%', color: 'var(--success)' },
    { label: 'Pending Payments', value: 'PHP 45,000', percentage: '18%', color: 'var(--warning)' },
    { label: 'Partial Payments', value: 'PHP 20,000', percentage: '9%', color: 'var(--info)' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Collection Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {breakdowns.map((b, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: b.color }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{b.value}</strong>
              <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.percentage} of total</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
