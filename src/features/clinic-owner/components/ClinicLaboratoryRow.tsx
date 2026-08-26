import { ClinicLaboratoryStatusBadge } from './ClinicLaboratoryStatusBadge';
import { ClinicLaboratoryActionMenu } from './ClinicLaboratoryActionMenu';

interface LabItem {
  id: string;
  name: string;
  type: string;
  location: string;
  services: string;
  status: string;
  turnaroundTime: string;
  rawStatus?: string;
}

interface Props {
  lab: LabItem;
  isSelected?: boolean;
  onSelect?: () => void;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
  onAction: (action: string, lab: LabItem) => void;
}

export function ClinicLaboratoryRow({
  lab,
  isSelected,
  onSelect,
  isChecked,
  onToggleCheck,
  onAction
}: Props) {
  const initials = lab.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || 'LB';

  const serviceList = lab.services ? lab.services.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.06)' : isChecked ? 'rgba(2, 132, 199, 0.02)' : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
    >
      <td
        style={{ padding: '0.9rem 1rem', width: '40px' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(e);
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}}
          style={{ cursor: 'pointer' }}
        />
      </td>

      {/* Lab Name with Icon Avatar */}
      <td style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(2,132,199,0.12), rgba(147,51,234,0.12))',
              color: '#0284c7',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'grid', gap: '0.1rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              {lab.name}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {lab.id}
            </span>
          </div>
        </div>
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.84rem' }}>
        {lab.type}
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
        {lab.location}
      </td>

      {/* Services Pills */}
      <td style={{ padding: '0.9rem 1rem', maxWidth: '240px' }}>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {serviceList.length > 0 ? (
            serviceList.slice(0, 2).map((srv) => (
              <span
                key={srv}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.2)'
                }}
              >
                {srv}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No active services</span>
          )}
          {serviceList.length > 2 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                backgroundColor: 'var(--background)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
            >
              +{serviceList.length - 2}
            </span>
          )}
        </div>
      </td>

      <td style={{ padding: '0.9rem 1rem' }}>
        <ClinicLaboratoryStatusBadge status={lab.status} />
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
        {lab.turnaroundTime}
      </td>

      <td
        style={{ padding: '0.9rem 1rem', textAlign: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <ClinicLaboratoryActionMenu status={lab.rawStatus || lab.status} onAction={(action) => onAction(action, lab)} />
      </td>
    </tr>
  );
}

