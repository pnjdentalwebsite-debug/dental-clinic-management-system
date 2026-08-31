import { Building2, Calendar, CalendarDays, Pencil, Phone, Stethoscope, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DentistStatusBadge } from './DentistStatusBadge';
import type { ClinicOwnerAssociateDirectoryItem } from '../../../infrastructure/supabase/clinicOwnerAssociateApi';

interface Props {
  dentist: ClinicOwnerAssociateDirectoryItem | null;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
}

function activeScheduleDays(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, schedule]) => schedule && typeof schedule === 'object' && (schedule as Record<string, unknown>).enabled === true)
    .map(([day]) => day.slice(0, 3));
}

function dateLabel(value: string | null) {
  if (!value) return 'Unavailable';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DentistProfilePreview({ dentist, onClose, onView, onEdit, readOnly = false }: Props) {
  if (!dentist) {
    return (
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '340px', color: 'var(--text-muted)', textAlign: 'center', gap: '0.9rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><User size={28} style={{ opacity: 0.6 }} /></div>
        <div><strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '0.2rem' }}>No Dentist Selected</strong><p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>Select an associate dentist from the directory to inspect details.</p></div>
      </div>
    );
  }

  const initials = dentist.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DR';
  const activeDays = activeScheduleDays(dentist.workSchedule);
  const clinics = dentist.clinics.length
    ? dentist.clinics.map((clinic) => `${clinic.clinicName} (${clinic.assignmentStatus})`).join(', ')
    : 'No clinic assignments configured';

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', position: 'relative', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <button type="button" onClick={onClose} aria-label="Close associate preview" style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}><X size={18} /></button>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '20px', background: dentist.calendarColor ? `linear-gradient(135deg, ${dentist.calendarColor}25, ${dentist.calendarColor}45)` : 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(20,184,166,0.14))', color: dentist.calendarColor || 'var(--primary)', border: `2px solid ${dentist.calendarColor ? dentist.calendarColor + '60' : 'rgba(99, 102, 241, 0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800 }}>{initials}</div>
          <div style={{ textAlign: 'center', display: 'grid', gap: '0.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dentist.displayName}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{dentist.associateNumber || 'Not configured'}</span>
          </div>
          <DentistStatusBadge status={dentist.accountStatus} />
        </div>

        <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.85rem' }}>
          <Detail icon={Stethoscope} label="Designation & Specialization" value={[dentist.designation, dentist.specialization].filter(Boolean).join(' • ') || 'Not configured'} />
          <Detail icon={Phone} label="Mobile Number" value={dentist.mobile || 'Unavailable'} />
          <Detail icon={Building2} label="Assigned Clinics" value={clinics} />
          {activeDays.length > 0 ? <Detail icon={CalendarDays} label="Weekly Schedule" value={activeDays.join(', ')} /> : <Detail icon={CalendarDays} label="Weekly Schedule" value="Not configured" />}
          <Detail icon={Calendar} label="Date Registered" value={dateLabel(dentist.createdAt)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" style={{ flex: 1, minWidth: '120px', height: '38px', fontSize: '0.85rem' }} onClick={onView}>View Profile</button>
        <button type="button" className="btn btn-primary" disabled={readOnly} title={readOnly ? 'Available after secure provisioning cutover' : undefined} style={{ flex: 1, minWidth: '120px', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: readOnly ? 0.6 : 1, cursor: readOnly ? 'not-allowed' : 'pointer' }} onClick={onEdit}><Pencil size={14} /> Edit Associate</button>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}><Icon size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} /><div style={{ wordBreak: 'break-word' }}><div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</div><strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.84rem' }}>{value}</strong></div></div>;
}
