import { UserPlus, Award } from 'lucide-react';

interface ActivityItem {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  icon: any;
}

const mockActivities: ActivityItem[] = [
  { id: '1', timestamp: 'Today, 10:30 AM', event: 'Clinic Profile Updated', details: 'Address and branches updated for Angelo Dental Clinic.', icon: Award },
  { id: '2', timestamp: 'Yesterday, 2:15 PM', event: 'New Staff Member Added', details: 'Dr. Maria Santos was assigned as Associate Dentist.', icon: UserPlus },
  { id: '3', timestamp: 'Jul 26, 2026', event: 'Laboratory Connected', details: 'Connected with Advanced Dental Lab Group.', icon: Award },
];

export function ClinicActivityFeed() {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Recent Activity</h3>
      <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mockActivities.map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="activity-item" style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', flexShrink: 0 }}>
                <Icon size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <strong style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.event}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{act.details}</span>
                <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.timestamp}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
