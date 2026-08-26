export function ClinicPreferenceForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Clinic Display Name</label>
        <input
          type="text"
          defaultValue="Angelo Dental Clinic"
          className="form-control"
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Default Branch</label>
        <select
          defaultValue="main"
          className="form-control"
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
        >
          <option value="main">Main Branch (Quezon City)</option>
          <option value="south">South Branch (Makati)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '180px' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Clinic Timezone</label>
          <select
            defaultValue="Asia/Manila"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
          >
            <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '180px' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Date Format</label>
          <select
            defaultValue="YYYY-MM-DD"
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Language Preference</label>
        <select
          defaultValue="en"
          className="form-control"
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
        >
          <option value="en">English (US)</option>
          <option value="fil">Filipino</option>
        </select>
      </div>
    </div>
  );
}
