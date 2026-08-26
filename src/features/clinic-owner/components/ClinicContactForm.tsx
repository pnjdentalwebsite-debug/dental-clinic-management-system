import type { ChangeEvent } from 'react';

interface ContactData {
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
}

interface Props {
  data: ContactData;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ClinicContactForm({ data, onChange }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Contact Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Primary Contact Person *</label>
            <input
              type="text"
              name="contactPerson"
              className="form-input"
              value={data.contactPerson}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={data.email}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Phone Number *</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              value={data.phone}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Website / Social Link</label>
            <input
              type="text"
              name="website"
              className="form-input"
              value={data.website}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
