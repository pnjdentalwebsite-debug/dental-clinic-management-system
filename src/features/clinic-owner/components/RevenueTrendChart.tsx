export function RevenueTrendChart() {
  const data = [
    { label: 'Q1 Trend', value: 570000, color: 'var(--primary)' },
    { label: 'Q2 Trend', value: 665000, color: 'var(--secondary)' }
  ];

  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Revenue Trend</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Quarterly revenue performance (PHP)</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <span style={{ width: '80px', color: 'var(--text-secondary)' }}>{item.label}</span>
            <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(item.value / maxVal) * 100}%`,
                backgroundColor: item.color,
                transition: 'width 0.8s ease-in-out'
              }} />
            </div>
            <strong style={{ width: '100px', textAlign: 'right', color: 'var(--text-primary)' }}>
              PHP {item.value.toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
