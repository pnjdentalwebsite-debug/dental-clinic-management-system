import type { ChangeEvent } from 'react';

interface InfoData {
  name: string;
  type: string;
  regNumber: string;
  status: string;
  establishedDate: string;
}

interface Props {
  data: InfoData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function ClinicInformationForm({ data, onChange }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Clinic Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Clinic Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={data.name}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Clinic Type</label>
            <select
              name="type"
              className="form-input"
              value={data.type}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            >
              <option value="Dental Clinic">Dental Clinic</option>
              <option value="Multi-Specialty Clinic">Multi-Specialty Clinic</option>
              <option value="Dental Hospital">Dental Hospital</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Registration Number</label>
            <input
              type="text"
              name="regNumber"
              className="form-input"
              value={data.regNumber}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Date Established</label>
            <input
              type="date"
              name="establishedDate"
              className="form-input"
              value={data.establishedDate}
              onChange={onChange}
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
