export function RevenueChartCard() {
  const data = [
    { month: 'Jan', revenue: 180000 },
    { month: 'Feb', revenue: 200000 },
    { month: 'Mar', revenue: 210000 },
    { month: 'Apr', revenue: 190000 },
    { month: 'May', revenue: 230000 },
    { month: 'Jun', revenue: 245000 }
  ];

  const maxVal = Math.max(...data.map(d => d.revenue));

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Revenue Performance</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Monthly revenue trend (PHP)</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <span style={{ width: '40px', color: 'var(--text-secondary)' }}>{item.month}</span>
            <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${(item.revenue / maxVal) * 100}%`,
                backgroundColor: 'var(--primary)',
                transition: 'width 0.8s ease-in-out'
              }} />
            </div>
            <strong style={{ width: '90px', textAlign: 'right', color: 'var(--text-primary)' }}>
              PHP {item.revenue.toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
