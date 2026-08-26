import { UserSquare2, Users, Building2, ChevronRight } from 'lucide-react';

interface Props {
  onAction: (actionName: string) => void;
}

export function OrganizationActions({ onAction }: Props) {
  const actions = [
    { name: 'Manage Associate Dentists', label: 'Manage Associate Dentists', icon: UserSquare2, color: 'var(--primary)', desc: 'Assign associates and manage licenses' },
    { name: 'Manage Staff Registries', label: 'Manage Staff Registries', icon: Users, color: 'var(--secondary)', desc: 'Configure reception and assistant staff access' },
    { name: 'Edit Global Master Directory', label: 'Edit Global Master Directory', icon: Building2, color: 'var(--info)', desc: 'Setup diagnostic catalogs and directory parameters' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Organization Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {actions.map(act => {
          const Icon = act.icon;
          return (
            <button
              key={act.name}
              type="button"
              onClick={() => onAction(act.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--card-bg)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition)'
              }}
              className="org-action-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${act.color}15`,
                  color: act.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.desc}</span>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
