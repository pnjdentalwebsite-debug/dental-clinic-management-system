import { Building2, UserSquare2, Users } from 'lucide-react';
import { DashboardSummaryCard } from '../components/DashboardSummaryCard';
import { ClinicBranchCard } from '../components/ClinicBranchCard';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { OrganizationActions } from '../components/OrganizationActions';
import { ActivityFeed } from '../components/ActivityFeed';
import { SetupProgressCard } from '../components/SetupProgressCard';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';

interface Props {
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

function formatClinicAddress(clinic: {
  addressLine1: string;
  addressLine2: string | null;
  barangay: string | null;
  city: string;
  province: string;
  postalCode: string | null;
}) {
  return [clinic.addressLine1, clinic.addressLine2, clinic.barangay, clinic.city, clinic.province, clinic.postalCode]
    .filter(Boolean)
    .join(', ') || 'Address unavailable';
}

function displayStatus(status: string) {
  if (!status) return 'Unavailable';
  return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ClinicOwnerDashboardPage({ showToast }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;

  if (ownerRead.status !== 'ready' || !bootstrap) {
    return (
      <div className="dashboard-panel" role={ownerRead.loading ? 'status' : 'alert'}>
        <h2>{ownerRead.loading ? 'Loading Clinic Owner dashboard…' : 'Clinic Owner dashboard unavailable'}</h2>
        <p>{ownerRead.loading ? 'Loading your RLS-protected tenant data.' : ownerRead.error}</p>
      </div>
    );
  }

  const branches = bootstrap.clinics.map((clinic) => ({
    id: clinic.id,
    clinicNumber: clinic.clinicNumber,
    name: clinic.name,
    isPrimary: clinic.isPrimary,
    location: formatClinicAddress(clinic),
    status: displayStatus(clinic.status),
    contact: clinic.contactNumber || 'Contact unavailable',
    email: clinic.email,
    hours: 'Operating hours unavailable',
  }));

  const handleDeferredAction = (actionName: string) => {
    showToast(`${actionName} is read-only until its real-data cutover is complete.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Welcome, {bootstrap.owner.displayName}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>Manage your dental organization from one place.</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Clinic:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{bootstrap.subscriber.businessName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Subscription:</span>{' '}
            <span className="badge-prototype" style={{ background: 'var(--secondary-light)', color: 'var(--secondary-hover)', borderColor: 'var(--border)' }}>
              {bootstrap.plan.name} Subscription
            </span>
          </div>
        </div>
      </div>

      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--card-gap)', margin: 0 }}>
        <DashboardSummaryCard label="Active Clinics" value={String(bootstrap.resourceCounts.activeClinics)} icon={Building2} trend="Active branches" status="info" />
        <DashboardSummaryCard label="Associate Dentists" value={String(bootstrap.resourceCounts.activeAssociates)} icon={UserSquare2} trend="Active associates" status="success" />
        <DashboardSummaryCard label="Staff Members" value={String(bootstrap.resourceCounts.activeStaff)} icon={Users} trend="Active staff" status="neutral" />
        <DashboardSummaryCard label="Total Patients" value="Unavailable" icon={Users} trend="Pending patient real-data cutover" status="warning" />
      </div>

      <div className="sections-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', margin: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Clinic Branch Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {branches.length === 0 && (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>No clinic branches yet</strong>
                  Your organization has no clinic records in the authenticated tenant scope.
                </div>
              )}
              {branches.map((branch) => (
                <ClinicBranchCard
                  key={branch.id}
                  clinicNumber={branch.clinicNumber}
                  name={branch.name}
                  isPrimary={branch.isPrimary}
                  location={branch.location}
                  status={branch.status}
                  contact={branch.contact}
                  email={branch.email}
                  hours={branch.hours}
                  onEnter={() => handleDeferredAction(`Opening ${branch.name}`)}
                />
              ))}
            </div>
          </div>

          <ActivityFeed events={bootstrap.auditEvents} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FinancialSummaryCard unavailableMessage="Clinical billing totals are deferred until the patient billing real-data cutover." />
          <OrganizationActions onAction={handleDeferredAction} />
          <SetupProgressCard />
        </div>
      </div>
    </div>
  );
}
