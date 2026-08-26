export function OrganizationPreferenceCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Organization Status</label>
        <span className="badge-prototype" style={{ width: 'fit-content', background: 'var(--success-light)', color: 'var(--success)', borderColor: 'transparent' }}>
          Active Subscription
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Plan Details</label>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Enterprise Dental Suite - 2 Branches Max</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Registered Clinic Owner Email</label>
        <span style={{ color: 'var(--text-muted)' }}>owner@angelodental.com</span>
      </div>
    </div>
  );
}
