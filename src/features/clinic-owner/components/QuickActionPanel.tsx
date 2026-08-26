import { UserPlus, PlusCircle, Building, FlaskConical } from 'lucide-react';

interface Props {
  onAction?: (actionName: string) => void;
}

export function QuickActionPanel({ onAction }: Props) {
  const actions = [
    { name: 'Add Dentist', label: 'Add Dentist', icon: UserPlus, color: 'var(--primary)' },
    { name: 'Add Staff', label: 'Add Staff', icon: PlusCircle, color: 'var(--secondary)' },
    { name: 'Add Branch', label: 'Add Branch', icon: Building, color: 'var(--info)' },
    { name: 'Connect Laboratory', label: 'Connect Laboratory', icon: FlaskConical, color: 'var(--success)' },
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {actions.map(act => {
          const Icon = act.icon;
          return (
            <button
              key={act.name}
              type="button"
              className="btn btn-outline"
              onClick={() => onAction?.(act.name)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                gap: '0.5rem',
                height: '100px',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card-bg)',
                transition: 'var(--transition)'
              }}
            >
              <Icon size={20} style={{ color: act.color }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
