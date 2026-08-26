import { Building, TrendingUp } from 'lucide-react';

export function BranchPerformanceCard() {
  const branches = [
    { name: 'Main Branch (Quezon City)', revenue: 'PHP 150,000', patients: 840, activity: 'High' },
    { name: 'South Branch (Makati)', revenue: 'PHP 95,000', patients: 408, activity: 'Moderate' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Branch Performance Comparison</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {branches.map((b, idx) => (
          <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Building size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{b.name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Patients: {b.patients} | Activity: {b.activity}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{b.revenue}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
