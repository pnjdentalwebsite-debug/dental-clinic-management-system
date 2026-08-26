import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  CreditCard,
  Scale,
  ShieldCheck,
  BellRing,
  Database,
  Save,
  RotateCcw,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Sliders,
  X
} from 'lucide-react';
import {
  clinicOwnerSettingsStore,
  type ClinicOwnerSettings,
  CLINIC_OWNER_SETTINGS_UPDATED_EVENT
} from '../services/clinicOwnerSettingsStore';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockAssociateDentistService } from '../services/mockAssociateDentistService';
import { mockStaffService } from '../services/mockStaffService';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';

interface Props {
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  loggedPlanName?: string;
  loggedClinicName?: string;
  loggedUserEmail?: string;
  loggedUserName?: string;
}

type TabKey = 'organization' | 'subscription' | 'financial' | 'security' | 'alerts' | 'backup';

export function GeneralSettingsPage({
  showToast,
  loggedPlanName = '',
  loggedClinicName = '',
  loggedUserEmail = '',
  loggedUserName = ''
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('organization');
  const [settings, setSettings] = useState<ClinicOwnerSettings>(clinicOwnerSettingsStore.getSettings());
  const [isDirty, setIsDirty] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  // Derive real subscriber and user context
  const usersRaw = typeof window !== 'undefined' ? localStorage.getItem('pnj_mock_platform_users') : null;
  const users = usersRaw ? JSON.parse(usersRaw) : [];
  const matchedUser = users.find((u: any) => u.email?.toLowerCase() === loggedUserEmail?.toLowerCase());
  const subscriberId = matchedUser?.subscriberId || matchedUser?.id || '';

  // Real live counts from services
  const dbClinics = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
  const realBranchesCount = dbClinics.length;
  
  const allDentists = subscriberId ? mockAssociateDentistService.getDentistsBySubscriberId(subscriberId) : [];
  const realDentistsCount = allDentists.filter((d) => d.status === 'active' || !d.status).length;

  const allStaff = subscriberId ? mockStaffService.getStaffBySubscriberId(subscriberId) : [];
  const realStaffCount = allStaff.filter((s) => s.status === 'active' || !s.status).length;

  const scopedPatients = useMemo(() => {
    const seen = new Set<string>();
    return dbClinics.flatMap((clinic) => loadPatientDirectoryRecords(clinic.id)).filter((patient) => {
      if (seen.has(patient.id)) return false;
      seen.add(patient.id);
      return true;
    });
  }, [dbClinics]);

  // Real plan determination
  const rawPlan = (loggedPlanName || matchedUser?.planName || settings.subscription.planTier || 'Max').trim();
  
  let resolvedPlanName = 'Max Plan';
  let planCode: 'basic' | 'plus' | 'max' = 'max';
  
  if (/max/i.test(rawPlan)) {
    resolvedPlanName = 'Max Plan';
    planCode = 'max';
  } else if (/plus/i.test(rawPlan)) {
    resolvedPlanName = 'Plus Plan';
    planCode = 'plus';
  } else if (/basic/i.test(rawPlan)) {
    resolvedPlanName = 'Basic Plan';
    planCode = 'basic';
  } else {
    resolvedPlanName = rawPlan.endsWith('Plan') ? rawPlan : `${rawPlan} Plan`;
    planCode = 'max';
  }

  // Quotas definition based on real plan tier
  const planQuotas = {
    basic: {
      branches: 1,
      dentists: 1,
      staff: 3,
      monthlyPrice: '5,000.00',
      isUnlimited: false
    },
    plus: {
      branches: 3,
      dentists: 6,
      staff: 20,
      monthlyPrice: '8,500.00',
      isUnlimited: false
    },
    max: {
      branches: 100,
      dentists: 100,
      staff: 100,
      monthlyPrice: '10,000.00',
      isUnlimited: true
    }
  }[planCode];

  // Sync with store updates
  useEffect(() => {
    const handleSync = () => {
      setSettings(clinicOwnerSettingsStore.getSettings());
      setIsDirty(false);
    };
    window.addEventListener(CLINIC_OWNER_SETTINGS_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CLINIC_OWNER_SETTINGS_UPDATED_EVENT, handleSync);
  }, []);

  const handleSave = () => {
    clinicOwnerSettingsStore.updateSettings(settings);
    setIsDirty(false);
    showToast('Clinic Owner Settings saved & synchronized in real-time!', 'success');
  };

  const handleReset = () => {
    const fresh = clinicOwnerSettingsStore.resetSettings();
    setSettings(fresh);
    setIsDirty(false);
    showToast('Settings restored to organization defaults.', 'info');
  };

  const updateOrg = (field: keyof ClinicOwnerSettings['organization'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      organization: { ...prev.organization, [field]: value }
    }));
    setIsDirty(true);
  };

  const updateFin = (field: keyof ClinicOwnerSettings['financial'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      financial: { ...prev.financial, [field]: value }
    }));
    setIsDirty(true);
  };

  const updateSec = (field: keyof ClinicOwnerSettings['security'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value }
    }));
    setIsDirty(true);
  };

  const updateRolePerm = (
    role: 'associateDentist' | 'receptionStaff',
    perm: string,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        rolePermissions: {
          ...prev.security.rolePermissions,
          [role]: {
            ...prev.security.rolePermissions[role],
            [perm]: value
          }
        }
      }
    }));
    setIsDirty(true);
  };

  const updateAlert = (field: keyof ClinicOwnerSettings['alerts'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, [field]: value }
    }));
    setIsDirty(true);
  };

  // Real backup export handlers
  const handleExportJSON = () => {
    const exportData = {
      organizationSettings: settings,
      clinicName: loggedClinicName || settings.organization.clinicDisplayName,
      exportedBy: loggedUserName || 'Clinic Administrator',
      activePlan: resolvedPlanName,
      branches: dbClinics,
      dentists: allDentists,
      staff: allStaff,
      patients: scopedPatients,
      financials: aggregateClinicFinancials(scopedPatients),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dental_clinic_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full JSON backup downloaded successfully.', 'success');
  };

  const handleExportCSV = () => {
    const patients = scopedPatients;
    const headers = ['Patient ID', 'Full Name', 'Age', 'Gender', 'Contact', 'Outstanding Balance', 'First Visit', 'Last Visit'];
    const rows = patients.map((p: any) => [
      p.patientCode || p.id,
      `"${p.fullName}"`,
      p.age,
      p.gender,
      `"${p.contactNumber || 'N/A'}"`,
      p.outstandingBalance,
      p.firstVisitDate || 'N/A',
      p.lastVisitDate || 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_ledger_roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Patient roster CSV exported successfully.', 'success');
  };

  const navTabs = [
    { key: 'organization' as TabKey, label: 'Organization & Identity', icon: Building2, desc: 'TIN, business name, currency & formats' },
    { key: 'subscription' as TabKey, label: 'Subscription & Quotas', icon: CreditCard, desc: 'Tier status, branch & staff seat limits' },
    { key: 'financial' as TabKey, label: 'Financial & Tax Rules', icon: Scale, desc: 'VAT classification, HMO aging & cash float' },
    { key: 'security' as TabKey, label: 'Security & Permissions', icon: ShieldCheck, desc: '2FA, session timeout & role access matrix' },
    { key: 'alerts' as TabKey, label: 'Executive Alerts & Reports', icon: BellRing, desc: 'Daily EOD email digest & critical events' },
    { key: 'backup' as TabKey, label: 'Data Backup & Export', icon: Database, desc: 'One-click JSON & CSV data bank dumps' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Banner Header */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid var(--border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Sliders size={20} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Clinic Console Settings
            </h1>
            {isDirty && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  color: '#d97706',
                  border: '1px solid rgba(217, 119, 6, 0.25)'
                }}
              >
                Unsaved Changes
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.84rem' }}>
            Centralized administration parameters, organization identity, role security, and real-time live sync.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!isDirty}
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Settings Body Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Vertical Nav Tabs */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '0.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'var(--secondary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div style={{ display: 'grid' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {tab.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Tab Content Card */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            minHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* TAB 1: ORGANIZATION & IDENTITY */}
          {activeTab === 'organization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Organization Profile & Tax Identity
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Legal business registration details and global system formatting rules.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Legal Business Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.organization.legalBusinessName}
                    onChange={(e) => updateOrg('legalBusinessName', e.target.value)}
                    placeholder="e.g. Angelo Dental Health Management Inc."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Clinic Display Brand</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.organization.clinicDisplayName}
                    onChange={(e) => updateOrg('clinicDisplayName', e.target.value)}
                    placeholder="e.g. Angelo Dental Clinic"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>BIR Tax Identification Number (TIN)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.organization.tinNumber}
                    onChange={(e) => updateOrg('tinNumber', e.target.value)}
                    placeholder="000-000-000-000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Primary Organization Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={settings.organization.primaryEmail}
                    onChange={(e) => updateOrg('primaryEmail', e.target.value)}
                    placeholder="admin@angelodental.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Primary Contact Hotline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.organization.primaryPhone}
                    onChange={(e) => updateOrg('primaryPhone', e.target.value)}
                    placeholder="+63 917 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Operating Currency</label>
                  <select
                    className="form-input"
                    value={settings.organization.currency}
                    onChange={(e) => updateOrg('currency', e.target.value)}
                  >
                    <option value="PHP (₱)">Philippine Peso (PHP ₱)</option>
                    <option value="USD ($)">US Dollar (USD $)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Date Format</label>
                  <select
                    className="form-input"
                    value={settings.organization.dateFormat}
                    onChange={(e) => updateOrg('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 23/08/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/23/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-23)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Time Notation</label>
                  <select
                    className="form-input"
                    value={settings.organization.timeFormat}
                    onChange={(e) => updateOrg('timeFormat', e.target.value as any)}
                  >
                    <option value="12h">12-Hour AM/PM (e.g. 02:30 PM)</option>
                    <option value="24h">24-Hour Military (e.g. 14:30)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION & QUOTAS */}
          {activeTab === 'subscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Platform Subscription & Resource Quotas
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Current tenant tier allowances, registered facilities, and rostered seats.
                </p>
              </div>

              {/* Tier Banner */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(79, 123, 245, 0.08)',
                  border: '1px solid rgba(79, 123, 245, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {resolvedPlanName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}
                    >
                      Active
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Billed {settings.subscription.billingCycle || 'Monthly'} • Next renewal scheduled on September 23, 2026.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBillingModalOpen(true)}
                  style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <ExternalLink size={14} />
                  View Billing & Invoices
                </button>
              </div>

              {/* Resource Quota Progress Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Clinic Branches */}
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Clinic Branches</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {planQuotas.isUnlimited ? `${realBranchesCount} / Unlimited` : `${realBranchesCount} / ${planQuotas.branches}`}
                    </span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${planQuotas.isUnlimited ? Math.min(100, Math.max(10, realBranchesCount * 10)) : Math.min(100, (realBranchesCount / planQuotas.branches) * 100)}%`,
                        backgroundColor: 'var(--primary)',
                        borderRadius: 999
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    {planQuotas.isUnlimited ? 'Unlimited branches capacity' : `${Math.max(0, planQuotas.branches - realBranchesCount)} branches available`}
                  </span>
                </div>

                {/* Associate Dentists */}
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Associate Dentists</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {planQuotas.isUnlimited ? `${realDentistsCount} / Unlimited` : `${realDentistsCount} / ${planQuotas.dentists}`}
                    </span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${planQuotas.isUnlimited ? Math.min(100, Math.max(10, realDentistsCount * 10)) : Math.min(100, (realDentistsCount / planQuotas.dentists) * 100)}%`,
                        backgroundColor: '#10b981',
                        borderRadius: 999
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    {planQuotas.isUnlimited ? 'Unlimited seats capacity' : `${Math.max(0, planQuotas.dentists - realDentistsCount)} seats available`}
                  </span>
                </div>

                {/* Clinic Staff Accounts */}
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Clinic Staff Accounts</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {planQuotas.isUnlimited ? `${realStaffCount} / Unlimited` : `${realStaffCount} / ${planQuotas.staff}`}
                    </span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${planQuotas.isUnlimited ? Math.min(100, Math.max(10, realStaffCount * 10)) : Math.min(100, (realStaffCount / planQuotas.staff) * 100)}%`,
                        backgroundColor: '#f59e0b',
                        borderRadius: 999
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    {planQuotas.isUnlimited ? 'Unlimited slots capacity' : `${Math.max(0, planQuotas.staff - realStaffCount)} slots available`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL & TAX RULES */}
          {activeTab === 'financial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Multi-Branch Financial & Tax Rules
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Establish unified tax rates, HMO receivable aging terms, and standard petty cash baselines.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>VAT Tax Classification</label>
                  <select
                    className="form-input"
                    value={settings.financial.taxMode}
                    onChange={(e) => updateFin('taxMode', e.target.value as any)}
                  >
                    <option value="non_vat">Non-VAT / VAT-Exempt Practice</option>
                    <option value="vat_registered">VAT-Registered Entity (12% Output Tax)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>HMO Aging Flag Threshold (Days)</label>
                  <select
                    className="form-input"
                    value={settings.financial.hmoAgingThresholdDays}
                    onChange={(e) => updateFin('hmoAgingThresholdDays', Number(e.target.value))}
                  >
                    <option value={15}>15 Days (Strict)</option>
                    <option value={30}>30 Days (Standard Practice)</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days (Extended)</option>
                    <option value={90}>90 Days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Standard Drawer Starting Float (PHP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.financial.pettyCashStandardFloat}
                    onChange={(e) => updateFin('pettyCashStandardFloat', Number(e.target.value))}
                    placeholder="5000"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Used as the default opening drawer baseline for Daily EOD cash reconciliation.
                  </span>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.financial.autoFlagOverdueInstallments}
                      onChange={(e) => updateFin('autoFlagOverdueInstallments', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Auto-Flag Overdue Installment Plans
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Highlights pending patient payment plans in Sales Overview aging feeds.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & ROLE PERMISSIONS */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Security Policies & Role Permission Matrix
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Account safeguards, inactivity logout timers, and role-based feature authorizations.
                </p>
              </div>

              {/* Security Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorEnabled}
                      onChange={(e) => updateSec('twoFactorEnabled', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Two-Factor Authentication (2FA)
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Require OTP authentication for Clinic Owner sign-in sessions.
                      </span>
                    </div>
                  </label>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Session Inactivity Timeout</label>
                  <select
                    className="form-input"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => updateSec('sessionTimeoutMinutes', Number(e.target.value))}
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={240}>4 Hours</option>
                    <option value={480}>8 Hours (Standard Shift)</option>
                  </select>
                </div>
              </div>

              {/* Role Permission Matrix Table */}
              <div>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Subsystem Role Access Matrix
                </strong>
                <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="data-table" style={{ margin: 0, fontSize: '0.82rem', width: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)' }}>
                        <th style={{ padding: '0.75rem 0.85rem' }}>System Permission</th>
                        <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Associate Dentist</th>
                        <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Reception Staff</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.7rem 0.85rem' }}>
                          <strong>View Sales & Revenue Analytics</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Access financial ledgers and sales charts</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.associateDentist.viewFinancials}
                            onChange={(e) => updateRolePerm('associateDentist', 'viewFinancials', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.receptionStaff.viewFinancials}
                            onChange={(e) => updateRolePerm('receptionStaff', 'viewFinancials', e.target.checked)}
                          />
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.7rem 0.85rem' }}>
                          <strong>Edit Master File Catalog</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Create, update, or remove master clinical codes</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.associateDentist.editMasterFiles}
                            onChange={(e) => updateRolePerm('associateDentist', 'editMasterFiles', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.receptionStaff.editMasterFiles}
                            onChange={(e) => updateRolePerm('receptionStaff', 'editMasterFiles', e.target.checked)}
                          />
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.7rem 0.85rem' }}>
                          <strong>Permanent Patient Record Deletion</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Purge patient profile and clinical history data</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.associateDentist.deletePatients}
                            onChange={(e) => updateRolePerm('associateDentist', 'deletePatients', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.receptionStaff.deletePatients}
                            onChange={(e) => updateRolePerm('receptionStaff', 'deletePatients', e.target.checked)}
                          />
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.7rem 0.85rem' }}>
                          <strong>Issue & Sign Clinical Prescriptions</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Generate official PDF prescription pads</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.associateDentist.issuePrescriptions}
                            onChange={(e) => updateRolePerm('associateDentist', 'issuePrescriptions', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.receptionStaff.issuePrescriptions}
                            onChange={(e) => updateRolePerm('receptionStaff', 'issuePrescriptions', e.target.checked)}
                          />
                        </td>
                      </tr>

                      <tr>
                        <td style={{ padding: '0.7rem 0.85rem' }}>
                          <strong>Export End-of-Day Audit Reports</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Download daily financial PDF audit sheets</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.associateDentist.exportReports}
                            onChange={(e) => updateRolePerm('associateDentist', 'exportReports', e.target.checked)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.7rem' }}>
                          <input
                            type="checkbox"
                            checked={settings.security.rolePermissions.receptionStaff.exportReports}
                            onChange={(e) => updateRolePerm('receptionStaff', 'exportReports', e.target.checked)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EXECUTIVE ALERTS & REPORTS */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Executive Alerts & Automated Digests
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Configure automated email dispatches and real-time operational notifications.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={settings.alerts.dailyEodDigest}
                      onChange={(e) => updateAlert('dailyEodDigest', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                        Daily End-of-Day (EOD) Financial Digest Email
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Sends daily breakdown of gross billed, collections, walk-ins, and doctor productions every 8:00 PM.
                      </span>
                    </div>
                  </label>

                  {settings.alerts.dailyEodDigest && (
                    <div className="form-group" style={{ marginTop: '0.5rem', maxWidth: '400px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Recipient Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={settings.alerts.eodRecipientEmail}
                        onChange={(e) => updateAlert('eodRecipientEmail', e.target.value)}
                        placeholder="owner@dentalclinic.com"
                      />
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Critical Activity Real-Time Alerts</strong>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.alerts.notifyOnPatientDelete}
                      onChange={(e) => updateAlert('notifyOnPatientDelete', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Notify whenever a patient profile is permanently deleted
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.alerts.notifyOnHighValueVoid}
                      onChange={(e) => updateAlert('notifyOnHighValueVoid', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Notify on bill cancellations or payment refunds exceeding ₱5,000
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.alerts.notifyOnLowInventory}
                      onChange={(e) => updateAlert('notifyOnLowInventory', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Notify on dental laboratory dispatch delays or delayed turnarounds
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Data Bank Backup & Portable Exports
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Generate instantaneous snapshots of your entire clinic platform, patients, and financial ledgers.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Download size={20} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Complete JSON Backup</strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      Exports organization settings, all clinic branches, associate doctors, active staff, master file dictionaries, and full patient directories.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExportJSON}
                    style={{ marginTop: '1.25rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                  >
                    <Download size={14} />
                    Download JSON Archive
                  </button>
                </div>

                <div
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Patient Directory & Ledger CSV</strong>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      Exports a spreadsheet-ready tabular file containing registered patient details, balances, and visit timestamps.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleExportCSV}
                    style={{ marginTop: '1.25rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                  >
                    <FileSpreadsheet size={14} />
                    Export CSV Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Card Footer */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Last synchronized: {new Date(settings.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!isDirty}
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
              >
                <Save size={13} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING HISTORY MODAL (High z-index) */}
      {billingModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setBillingModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: '650px',
              padding: '1.5rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Subscription Billing History
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Invoices and official receipts for {loggedClinicName || settings.organization.clinicDisplayName}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setBillingModalOpen(false)}
                style={{ padding: '0.3rem', width: 'auto', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', minHeight: '160px' }}>
              <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Invoice #</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Plan Tier</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Billing Period</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}><strong>INV-2026-0801</strong></td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{resolvedPlanName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>Aug 1, 2026 – Aug 31, 2026</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>PHP {planQuotas.monthlyPrice}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>Paid</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.65rem 0.75rem' }}><strong>INV-2026-0701</strong></td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{resolvedPlanName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>Jul 1, 2026 – Jul 31, 2026</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>PHP {planQuotas.monthlyPrice}</td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.15rem 0.45rem', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>Paid</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setBillingModalOpen(false)} style={{ width: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
