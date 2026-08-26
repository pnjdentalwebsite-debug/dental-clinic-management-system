export function PatientGrowthCard() {
  const data = [
    { month: 'Jan', count: 120, trend: '+5%' },
    { month: 'Feb', count: 180, trend: '+8%' },
    { month: 'Mar', count: 240, trend: '+12%' },
    { month: 'Apr', count: 210, trend: '-2%' },
    { month: 'May', count: 290, trend: '+15%' },
    { month: 'Jun', count: 320, trend: '+10%' }
  ];

  const maxVal = Math.max(...data.map(d => d.count));

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Patient Growth</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>New registrations trend</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
            <span style={{ width: '40px', color: 'var(--text-secondary)' }}>{item.month}</span>
            <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${(item.count / maxVal) * 100}%`,
                backgroundColor: 'var(--secondary)',
                transition: 'width 0.8s ease-in-out'
              }} />
            </div>
            <strong style={{ width: '60px', textAlign: 'right', color: 'var(--text-primary)' }}>
              {item.count}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
