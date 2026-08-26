import type { ChangeEvent } from 'react';

interface AddressData {
  country: string;
  region: string;
  province: string;
  city: string;
  street: string;
  postalCode: string;
}

interface Props {
  data: AddressData;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ClinicAddressForm({ data, onChange }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Address Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Country *</label>
            <input
              type="text"
              name="country"
              className="form-input"
              value={data.country}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Region</label>
            <input
              type="text"
              name="region"
              className="form-input"
              value={data.region}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Province *</label>
            <input
              type="text"
              name="province"
              className="form-input"
              value={data.province}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>City *</label>
            <input
              type="text"
              name="city"
              className="form-input"
              value={data.city}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Street Address *</label>
            <input
              type="text"
              name="street"
              className="form-input"
              value={data.street}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Postal Code *</label>
            <input
              type="text"
              name="postalCode"
              className="form-input"
              value={data.postalCode}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
