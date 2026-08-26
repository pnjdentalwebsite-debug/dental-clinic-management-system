import { useEffect, useMemo, useState } from 'react';
import { Building2, UserSquare2, Users } from 'lucide-react';
import { DashboardSummaryCard } from '../components/DashboardSummaryCard';
import { ClinicBranchCard } from '../components/ClinicBranchCard';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { OrganizationActions } from '../components/OrganizationActions';
import { ActivityFeed } from '../components/ActivityFeed';
import { SetupProgressCard } from '../components/SetupProgressCard';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { resolveClinicOwnerContext } from '../services/tenantScope';
import { mockAssociateDentistService } from '../services/mockAssociateDentistService';
import { mockStaffService } from '../services/mockStaffService';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { mockSalesOverviewService } from '../services/mockSalesOverviewService';

interface Props {
  loggedUserName: string;
  loggedClinicName: string;
  loggedPlanName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onEnterBranch?: (clinicId: string, branchName: string) => void;
  loggedUserEmail: string;
}

export function ClinicOwnerDashboardPage({ loggedUserName, loggedClinicName, loggedPlanName, showToast, onEnterBranch, loggedUserEmail }: Props) {
  // Resolve the signed-in clinic owner's subscriber context (self-healing linkage)
  const ownerContext = useMemo(
    () => resolveClinicOwnerContext(loggedUserEmail, loggedClinicName),
    [loggedUserEmail, loggedClinicName]
  );
  const subscriberId = ownerContext.subscriberId;

  // Get real clinics for this subscriber
  const dbClinics = useMemo(
    () => (subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : []),
    [subscriberId]
  );

  // Real branches only — no synthetic fallback data. An empty list renders the empty state below.
  const branches = useMemo(() => {
    return dbClinics.map(c => ({
      id: c.id,
      name: c.name,
      location: [c.city, c.province].filter(Boolean).join(', ') || 'Location pending setup',
      status: c.status === 'active' ? 'Active' : c.status === 'inactive' ? 'Inactive' : c.status === 'draft' ? 'Draft' : 'Archived',
      contact: c.contactNumber || 'Contact number pending setup',
      hours: 'Mon - Sat: 9:00 AM - 6:00 PM'
    }));
  }, [dbClinics]);

  const [updateTick, setUpdateTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setUpdateTick((t) => t + 1);
    window.addEventListener('clinic-bill-payments:updated', handleUpdate);
    window.addEventListener('clinic-progress-notes:updated', handleUpdate);
    window.addEventListener('clinic-subsystem:patients-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('clinic-bill-payments:updated', handleUpdate);
      window.removeEventListener('clinic-progress-notes:updated', handleUpdate);
      window.removeEventListener('clinic-subsystem:patients-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Live real data connections
  const dentists = useMemo(() => mockAssociateDentistService.getDentistsBySubscriberId(subscriberId), [subscriberId, updateTick]);
  const activeDentists = dentists.filter((d) => d.status === 'active' || !d.status).length;

  const staff = useMemo(() => mockStaffService.getStaffBySubscriberId(subscriberId), [subscriberId, updateTick]);
  const activeStaff = staff.filter((s) => s.status === 'active' || !s.status).length;

  const patients = useMemo(() => {
    const seen = new Set<string>();
    return branches.flatMap((branch) => loadPatientDirectoryRecords(branch.id)).filter((patient) => {
      if (seen.has(patient.id)) return false;
      seen.add(patient.id);
      return true;
    });
  }, [branches, updateTick]);
  const totalPatients = patients.length;

  // The owner dashboard defaults to the complete authorized-clinic scope.
  // Branch-specific views are selected inside the sales workspace instead of
  // narrowing the owner dashboard using the display clinic name.
  const salesData = useMemo(() => mockSalesOverviewService.getDataset('all', undefined, loggedUserEmail), [loggedUserEmail, updateTick]);
  const collected = salesData.kpis.collectedAmount;
  const outstanding = salesData.kpis.outstandingReceivables;

  const handleAction = (actionName: string) => {
    showToast(`Action "${actionName}" triggered.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      {/* Section 1: Welcome Header */}
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Welcome, {loggedUserName.split(' ')[0]}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>Manage your dental organization from one place.</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Clinic:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{loggedClinicName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Subscription:</span>{' '}
            <span className="badge-prototype" style={{ background: 'var(--secondary-light)', color: 'var(--secondary-hover)', borderColor: 'var(--border)' }}>
              {loggedPlanName} Subscription
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Organization Summary Cards (100% Real Live Values) */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--card-gap)', margin: 0 }}>
        <DashboardSummaryCard label="Total Clinics" value={String(branches.length)} icon={Building2} trend="Active branches" status="info" />
        <DashboardSummaryCard label="Associate Dentists" value={String(activeDentists)} icon={UserSquare2} trend="Active associates" status="success" />
        <DashboardSummaryCard label="Staff Members" value={String(activeStaff)} icon={Users} trend="Active staff" status="neutral" />
        <DashboardSummaryCard label="Total Patients" value={String(totalPatients)} icon={Users} trend="Registered profiles" status="warning" />
      </div>

      {/* Section 3 & 4 split grid */}
      <div className="sections-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', margin: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Clinic Branch Overview */}
          <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Clinic Branch Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {branches.length === 0 && (
                <div style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                    No clinic branches yet
                  </strong>
                  Your organization has no branch records. Add your first branch from the Clinic Branches page to start operating.
                </div>
              )}
              {branches.map((branch, idx) => (
                <ClinicBranchCard
                  key={idx}
                  name={branch.name}
                  location={branch.location}
                  status={branch.status}
                  contact={branch.contact}
                  hours={branch.hours}
                  onEnter={() => onEnterBranch ? onEnterBranch(branch.id || branch.name, branch.name) : handleAction(`Enter ${branch.name}`)}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <ActivityFeed subscriberId={subscriberId} branchIds={branches.map((branch) => branch.id)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 4: Financial Summary */}
          <FinancialSummaryCard collected={collected} outstanding={outstanding} />

          {/* Section 5: Organization Actions */}
          <OrganizationActions onAction={handleAction} />

          {/* Section 7: Clinic Setup Progress */}
          <SetupProgressCard />
        </div>
      </div>
    </div>
  );
}
