import type { ChangeEvent } from 'react';

interface OperatingData {
  openTime: string;
  closeTime: string;
  days: string;
}

interface Props {
  data: OperatingData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function ClinicOperatingHours({ data, onChange }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Operating Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Business Days</label>
          <input
            type="text"
            name="days"
            className="form-input"
            value={data.days}
            onChange={onChange}
            placeholder="e.g. Monday - Saturday"
            style={{ borderRadius: '6px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Opening Time</label>
            <input
              type="time"
              name="openTime"
              className="form-input"
              value={data.openTime}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Closing Time</label>
            <input
              type="time"
              name="closeTime"
              className="form-input"
              value={data.closeTime}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
