export function StaffRoleOverview() {
  const roles = [
    { name: 'Administrator', count: 2, desc: 'Manage clinics and configure master data' },
    { name: 'Receptionist', count: 4, desc: 'Handle bookings, frontdesk intake, and patient queries' },
    { name: 'Dental Assistant', count: 6, desc: 'Support dentists in chairside and clinical tasks' },
    { name: 'Nurse Assistant', count: 2, desc: 'Ensure sterile procedures and patient care coordination' },
    { name: 'Support Staff', count: 1, desc: 'Sanitary logistics and clinic administration support' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Staff Roles Overview</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {roles.map(r => (
          <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.name}</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.desc}</span>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
