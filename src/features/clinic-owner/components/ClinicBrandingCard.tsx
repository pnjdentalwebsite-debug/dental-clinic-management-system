import { Upload, HelpCircle } from 'lucide-react';

interface Props {
  logoUrl?: string;
  onUploadMock: () => void;
}

export function ClinicBrandingCard({ logoUrl, onUploadMock }: Props) {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Clinic Branding</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Clinic Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>No Logo</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Clinic Logo</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommend PNG or JPG, at least 512x512px. Max size 2MB.</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onUploadMock}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'fit-content' }}
            >
              <Upload size={14} />
              <span>Choose Logo File</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--secondary-light)', border: '1px solid #ccfbf1', borderRadius: 'var(--radius-md)' }}>
          <HelpCircle size={16} style={{ color: 'var(--secondary-hover)', marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary-hover)', margin: 0 }}>
            Your clinic brand assets will be visible to your patients on scheduling sheets, portal headers, and invoices.
          </p>
        </div>
      </div>
    </div>
  );
}
