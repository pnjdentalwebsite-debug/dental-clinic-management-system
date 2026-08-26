import { CheckCircle2, Circle } from 'lucide-react';

export function SetupProgressCard() {
  const steps = [
    { label: 'Owner Account', completed: true },
    { label: 'Clinic Profile', completed: true },
    { label: 'Subscription Setup', completed: true },
    { label: 'Master Files', completed: false },
    { label: 'Staff Configuration', completed: false },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Clinic Setup Progress</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{
          position: 'relative',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          border: '6px solid var(--border)',
          borderTopColor: 'var(--secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: 'var(--text-primary)',
          flexShrink: 0
        }}>
          {percentage}%
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Almost Ready!</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Complete master files and staff configuration to unlock clinical workflows.</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            {step.completed ? (
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            ) : (
              <Circle size={16} style={{ color: 'var(--text-muted)' }} />
            )}
            <span style={{ color: step.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
