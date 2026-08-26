export function ClinicActivitySummary() {
  const activities = [
    { label: 'Completed Treatments', count: 35 },
    { label: 'New Patient Registrations', count: 8 },
    { label: 'Follow-up Visits', count: 12 }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Clinic Activity Overview</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activities.map((a, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.label}</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{a.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
