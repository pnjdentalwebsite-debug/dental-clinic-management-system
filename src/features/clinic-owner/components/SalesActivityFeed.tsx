import { DollarSign, RefreshCcw } from 'lucide-react';

export function SalesActivityFeed() {
  const activities = [
    { label: 'Patient Treatment Payment', value: '+PHP 5,000', time: 'Today, 2:30 PM', type: 'collection' },
    { label: 'Dental Service Payment', value: '+PHP 3,500', time: 'Today, 11:15 AM', type: 'collection' },
    { label: 'Outstanding Balance Updated', value: 'PHP 2,000', time: 'Yesterday, 4:00 PM', type: 'update' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Recent Sales Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activities.map((act, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                padding: '0.4rem',
                borderRadius: '50%',
                backgroundColor: act.type === 'collection' ? 'var(--success-light)' : 'var(--primary-light)',
                color: act.type === 'collection' ? 'var(--success)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {act.type === 'collection' ? <DollarSign size={14} /> : <RefreshCcw size={14} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.time}</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.9rem', color: act.type === 'collection' ? 'var(--success)' : 'var(--text-primary)' }}>
              {act.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
