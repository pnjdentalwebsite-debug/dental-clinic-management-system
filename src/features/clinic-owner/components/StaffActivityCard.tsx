import { UserSquare2, Users, CheckSquare } from 'lucide-react';

export function StaffActivityCard() {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Staff & Practitioner Attendance</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <UserSquare2 size={16} style={{ color: 'var(--primary)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Dentists Active</span>
            <strong style={{ color: 'var(--text-primary)' }}>5 Present</strong>
          </div>
        </div>

        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={16} style={{ color: 'var(--secondary)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Staff Present</span>
            <strong style={{ color: 'var(--text-primary)' }}>12 Checked In</strong>
          </div>
        </div>

        <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckSquare size={16} style={{ color: 'var(--success)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Completed Tasks</span>
            <strong style={{ color: 'var(--text-primary)' }}>40 Tasks</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
