import { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  RotateCcw, 
  Save, 
  Upload, 
  ShieldCheck,
  Server,
  Layers,
  Database,
  Lock,
  Globe,
  Palette,
  CreditCard,
  UserCheck,
  ToggleRight,
  History,
  AlertTriangle,
  BarChart3,
  Search,
  Sparkles,
  Clock,
  Check,
  Plus,
  Trash2,
  Copy,
  Filter
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { DonutPieChart, type PieChartDataPoint } from '../../analytics/components/charts/DonutPieChart';
import { HorizontalBarChart, type HorizontalBarDataPoint } from '../../analytics/components/charts/HorizontalBarChart';
import { mockPlatformSettingsService, PLATFORM_SETTINGS_CHANGED_EVENT } from '../services/mockPlatformSettingsService';
import type { FeatureFlagStatus, PlatformSettings, SettingsGroupKey, SettingsHistoryRecord } from '../types';

interface Props {
  route?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell?: () => void;
}

type TabKey = 'overview' | 'general' | 'branding' | 'registration' | 'payments' | 'security' | 'features' | 'history';

const labelize = (value: string) => value.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()).trim();

export function PlatformSettingsPage({ showToast, refreshShell }: Props) {
  const [, setVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [resetGroup, setResetGroup] = useState<SettingsGroupKey | 'all' | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [diffRecord, setDiffRecord] = useState<SettingsHistoryRecord | null>(null);

  const refresh = () => {
    setVersion(prev => prev + 1);
    refreshShell?.();
  };

  useEffect(() => {
    const handleStateChange = () => refresh();
    window.addEventListener(PLATFORM_SETTINGS_CHANGED_EVENT, handleStateChange);
    window.addEventListener('storage', handleStateChange);
    return () => {
      window.removeEventListener(PLATFORM_SETTINGS_CHANGED_EVENT, handleStateChange);
      window.removeEventListener('storage', handleStateChange);
    };
  }, []);

  const settings = mockPlatformSettingsService.getSettings();
  const history = mockPlatformSettingsService.getSettingsHistory();

  // Metrics computations
  const featureEntries = Object.entries(settings.features);
  const totalFeatures = featureEntries.length;
  const enabledFeatures = featureEntries.filter(([, status]) => status === 'enabled').length;
  const devFeatures = featureEntries.filter(([, status]) => status === 'under_development').length;

  const exportSettings = () => {
    const payload = mockPlatformSettingsService.exportSettings();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnj-platform-settings-${payload.manifest.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    refresh();
    showToast('Settings export downloaded.', 'success');
  };

  const importSettings = () => {
    try {
      const result = mockPlatformSettingsService.importSettings(JSON.parse(importText));
      if (!result.ok) showToast(result.error || 'Settings import failed.', 'error');
      else {
        setImportOpen(false);
        setImportText('');
        refresh();
        showToast('Settings imported successfully.', 'success');
      }
    } catch {
      showToast('Import must be valid JSON.', 'error');
    }
  };

  const confirmReset = () => {
    if (!resetGroup) return;
    const result = resetGroup === 'all' ? mockPlatformSettingsService.resetAllSettings() : mockPlatformSettingsService.resetGroup(resetGroup);
    if (!result.ok) showToast(result.error || 'Reset failed.', 'error');
    else {
      setResetGroup(null);
      refresh();
      showToast(resetGroup === 'all' ? 'All settings reset to defaults.' : `${labelize(resetGroup)} settings reset to defaults.`, 'success');
    }
  };

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER (2-Button Standard) */}
      <PlatformPageHeader
        title="System Settings"
        subtitle="Manage system preferences, clinic branding, security rules, feature controls, and maintenance mode."
        breadcrumbs={['Platform', 'System & Tools', 'System Settings']}
        secondaryAction={{
          label: 'Import Settings',
          icon: Upload,
          onClick: () => setImportOpen(true)
        }}
        primaryAction={{
          label: 'Export Settings',
          icon: Download,
          onClick: exportSettings
        }}
        overflowActions={[
          {
            id: 'preview',
            label: 'View Settings File Details',
            icon: Eye,
            onSelect: () => setPreviewOpen(true)
          },
          {
            id: 'history',
            label: 'View Change History',
            icon: History,
            onSelect: () => setActiveTab('history')
          },
          {
            id: 'reset-all',
            label: 'Reset All to Default',
            icon: RotateCcw,
            destructive: true,
            onSelect: () => setResetGroup('all')
          }
        ]}
      />

      {/* 2. MAINTENANCE ALERT BANNER (IF ACTIVE) */}
      {settings.maintenance.enabled && (
        <div style={{
          backgroundColor: '#fffbeb',
          borderRadius: '12px',
          border: '1px solid #fde68a',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#92400e',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Maintenance Mode Active:</strong> {settings.maintenance.message || 'Platform is temporarily undergoing scheduled maintenance.'}
            {settings.maintenance.estimatedCompletion && <span> (Estimated completion: {settings.maintenance.estimatedCompletion})</span>}
          </div>
        </div>
      )}

      {/* 3. TOP 4 HERO KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1rem'
      }}>
        {/* Metric 1: System Modules */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Active System Modules
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {enabledFeatures} / {totalFeatures}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '12px',
              backgroundColor: enabledFeatures === totalFeatures ? '#f0fdf4' : '#fef3c7',
              color: enabledFeatures === totalFeatures ? '#16a34a' : '#d97706'
            }}>
              {Math.round((enabledFeatures / totalFeatures) * 100)}% Active
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {devFeatures > 0 ? `${devFeatures} modules under development` : 'All modules fully operational'}
          </span>
        </div>

        {/* Metric 2: Security & Session Safeguards */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Security & Redaction
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fdf2f8', color: '#db2777' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {settings.security.mockSessionTimeoutMinutes}m
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              color: '#16a34a'
            }}>
              Redaction Enforced
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Mask contact info: {settings.security.maskContactInformation ? 'Enabled' : 'Off'}
          </span>
        </div>

        {/* Metric 3: Storage & Restore Limits */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Restore Snapshots Quota
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {settings.auditData.maximumLocalRestorePoints}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb'
            }}>
              Pre-Reset Active
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Max backup file: {settings.auditData.maximumBackupFileSizeMb} MB
          </span>
        </div>

        {/* Metric 4: System Operational State */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Operational Status
            </span>
            <div style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: settings.maintenance.enabled ? '#fffbeb' : '#f0fdf4',
              color: settings.maintenance.enabled ? '#d97706' : '#16a34a'
            }}>
              <Server size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {settings.maintenance.enabled ? 'Maintenance' : 'Operational'}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '12px',
              backgroundColor: settings.maintenance.enabled ? '#fef3c7' : '#dcfce7',
              color: settings.maintenance.enabled ? '#d97706' : '#15803d'
            }}>
              {settings.maintenance.enabled ? 'Restricted' : 'Normal'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Last modified: {new Date(settings.updatedAt).toLocaleDateString('en-PH')}
          </span>
        </div>
      </div>

      {/* 4. SECONDARY SYSTEM GOVERNANCE PROTOCOL RIBBON */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.775rem',
        color: '#475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Server size={14} color="#2563eb" />
            <strong>Environment:</strong> {settings.general.environmentLabel || 'Development Environment'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={14} color="#16a34a" />
            <strong>Regional:</strong> {settings.regional.locale} ({settings.regional.timezone}) • {settings.regional.currency} (₱)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} color="#7c3aed" />
            <strong>Schema:</strong> v{settings.schemaVersion} Verified
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
            {history.length} change ledger events
          </span>
        </div>
      </div>

      {/* 5. SEGMENTED CATEGORY TABS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        overflowX: 'auto',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.35rem'
      }}>
        {[
          { key: 'overview', label: 'Overview & Health', icon: Layers },
          { key: 'general', label: 'General & Regional', icon: Globe },
          { key: 'branding', label: 'Branding & Theme', icon: Palette },
          { key: 'registration', label: 'Registration & Subscriptions', icon: UserCheck },
          { key: 'payments', label: 'Payments & Gateways', icon: CreditCard },
          { key: 'security', label: 'Security & Session Rules', icon: Lock },
          { key: 'features', label: 'Feature Controls (On/Off)', icon: ToggleRight },
          { key: 'history', label: `Change History (${history.length})`, icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={isActive ? '#38bdf8' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. TAB CONTENT PANELS */}
      {activeTab === 'overview' && (
        <SettingsOverviewTab
          settings={settings}
          history={history}
          onSelectTab={setActiveTab}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'general' && (
        <GeneralRegionalPanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'branding' && (
        <BrandingPanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'registration' && (
        <RegistrationSubscriptionsPanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsPanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'security' && (
        <SecurityAuditPanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
          onReset={setResetGroup}
        />
      )}

      {activeTab === 'features' && (
        <FeatureFlagsMaintenancePanel
          settings={settings}
          showToast={showToast}
          refresh={refresh}
        />
      )}

      {activeTab === 'history' && (
        <HistoryLedgerTab
          history={history}
          onViewDiff={setDiffRecord}
          onResetAll={() => setResetGroup('all')}
        />
      )}

      {/* 7. MODALS & DIALOGS */}
      {/* Snapshot Preview Modal */}
      <Modal
        open={previewOpen}
        title="Settings File Preview"
        description="Current system settings and configuration values."
        onClose={() => setPreviewOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto', fontSize: '0.8rem', gap: '0.4rem' }}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                showToast('Settings copied to clipboard.', 'success');
              }}
            >
              <Copy size={13} /> Copy Settings
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.8rem' }}
                onClick={exportSettings}
              >
                <Download size={13} /> Download File
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto', padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                onClick={() => setPreviewOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <span><strong>Version:</strong> <code style={{ fontFamily: 'monospace' }}>v1-verified</code></span>
            <span><strong>Timestamp:</strong> {new Date().toLocaleString('en-PH')}</span>
          </div>
          <pre style={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            overflowX: 'auto',
            maxHeight: '400px',
            lineHeight: '1.4',
            margin: 0
          }}>
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        open={importOpen}
        title="Import System Settings"
        description="Upload a settings backup file or paste file contents to update platform configuration."
        onClose={() => setImportOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto', fontSize: '0.8rem' }}
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto', fontSize: '0.8rem' }}
              onClick={importSettings}
              disabled={!importText.trim()}
            >
              <Upload size={13} /> Apply Settings
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc'
          }}>
            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <Upload size={24} color="#2563eb" />
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>Click to upload settings file (.json)</span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Supports exported settings backup files</span>
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const content = ev.target?.result as string;
                      if (content) setImportText(content);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Or Paste File Content</span>
          <textarea
            className="form-input"
            rows={8}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.775rem' }}
            value={importText}
            onChange={event => setImportText(event.target.value)}
            placeholder="{ ...paste settings content here... }"
          />
        </div>
      </Modal>

      {/* Diff Inspector Modal */}
      {diffRecord && (
        <Modal
          open={Boolean(diffRecord)}
          title={`Changes Comparison: ${diffRecord.settingsHistoryNumber}`}
          description={`Category: ${labelize(diffRecord.group)} • Changed on ${new Date(diffRecord.changedAt).toLocaleString('en-PH')}`}
          onClose={() => setDiffRecord(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.8rem', gap: '0.4rem' }}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(diffRecord, null, 2));
                  showToast('Changes comparison copied.', 'success');
                }}
              >
                <Copy size={13} /> Copy Changes
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto', padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                onClick={() => setDiffRecord(null)}
              >
                Close Comparison
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              fontSize: '0.825rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div><strong>Reason / Action:</strong> {diffRecord.reason}</div>
              <div><strong>Modified Fields:</strong> {diffRecord.changedFields.length > 0 ? diffRecord.changedFields.map(f => (
                <span key={f} style={{ margin: '0 0.2rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.725rem' }}>{f}</span>
              )) : <span style={{ color: '#64748b' }}>Full Category State Updated</span>}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                  PREVIOUS VALUES (BEFORE)
                </span>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {JSON.stringify(diffRecord.beforeSnapshot, null, 2)}
                </pre>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                  UPDATED VALUES (AFTER)
                </span>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#4ade80',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {JSON.stringify(diffRecord.afterSnapshot, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(resetGroup)}
        title={resetGroup === 'all' ? 'Reset all settings to system defaults?' : `Reset ${labelize(resetGroup || '')} settings?`}
        description={resetGroup === 'all'
          ? "This will restore defaults across all configuration categories (General, Branding, Registration, Payments, Security, Feature Controls). A safety record will automatically be saved in the change history."
          : `This will restore defaults for the ${labelize(resetGroup || '')} configuration domain. A pre-reset safety snapshot will automatically be archived in the history ledger.`
        }
        confirmLabel="Reset Settings"
        destructive
        onCancel={() => setResetGroup(null)}
        onConfirm={confirmReset}
      />
    </main>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENTS & TAB PANELS
// -------------------------------------------------------------

function SettingsOverviewTab({
  settings,
  history,
  onSelectTab,
  onReset
}: {
  settings: PlatformSettings;
  history: SettingsHistoryRecord[];
  onSelectTab: (tab: TabKey) => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [showAnalytics, setShowAnalytics] = useState(true);

  // 100% Real data calculations from settings store
  const featureEntries = Object.entries(settings.features);
  const totalFeatures = featureEntries.length;
  const enabledFeatures = featureEntries.filter(([, status]) => status === 'enabled').length;
  const devFeatures = featureEntries.filter(([, status]) => status === 'under_development').length;
  const disabledFeatures = featureEntries.filter(([, status]) => status === 'disabled').length;
  const internalFeatures = featureEntries.filter(([, status]) => status === 'internal_only').length;

  const featureChartData: PieChartDataPoint[] = [
    { label: 'Enabled', value: enabledFeatures, color: '#16a34a', formattedValue: `${enabledFeatures} Active` },
    { label: 'Under Development', value: devFeatures, color: '#d97706', formattedValue: `${devFeatures} In Dev` },
    { label: 'Disabled', value: disabledFeatures, color: '#dc2626', formattedValue: `${disabledFeatures} Disabled` },
    { label: 'Internal Only', value: internalFeatures, color: '#7c3aed', formattedValue: `${internalFeatures} Internal` },
  ].filter(d => d.value > 0);

  const governanceDensityData: HorizontalBarDataPoint[] = [
    {
      label: 'Security Safeguards & Audit Quota',
      value: Object.keys(settings.security).length + Object.keys(settings.auditData).length,
      formattedValue: `${Object.keys(settings.security).length + Object.keys(settings.auditData).length} rules`,
      sublabel: `${settings.security.mockSessionTimeoutMinutes}m Session • Sensitive-Data Redacted • Checkpoint Protection`,
      badge: '#1 Safeguards',
      color: '#7c3aed'
    },
    {
      label: 'System Feature Controls & Modules',
      value: Object.keys(settings.features).length,
      formattedValue: `${enabledFeatures} of ${totalFeatures} active`,
      sublabel: 'Turn individual system features and modules on or off',
      badge: '#2 Modules',
      color: '#16a34a'
    },
    {
      label: 'Registration & Subscription Policies',
      value: Object.keys(settings.registration).length + Object.keys(settings.subscriptions).length,
      formattedValue: `${Object.keys(settings.registration).length + Object.keys(settings.subscriptions).length} policies`,
      sublabel: `Auto account setup active • ${settings.subscriptions.renewalWarningDays}d renewal warning`,
      badge: '#3 Policies',
      color: '#2563eb'
    },
    {
      label: 'General Identity & Regional Locale',
      value: Object.keys(settings.general).length + Object.keys(settings.regional).length,
      formattedValue: `${Object.keys(settings.general).length + Object.keys(settings.regional).length} properties`,
      sublabel: `${settings.regional.locale} (${settings.regional.timezone}) • Currency ${settings.regional.currency} (₱)`,
      badge: '#4 Regional',
      color: '#0284c7'
    },
    {
      label: 'Branding, Typography & Color Theme',
      value: Object.keys(settings.branding).length,
      formattedValue: `${Object.keys(settings.branding).length} properties`,
      sublabel: `Sidebar ${settings.branding.sidebarTheme.toUpperCase()} • Primary ${settings.branding.primaryColor}`,
      badge: '#5 Theme',
      color: '#ec4899'
    },
    {
      label: 'Payment Methods & Verification',
      value: Object.keys(settings.payments).length,
      formattedValue: `${settings.payments.acceptedMethods.length} methods`,
      sublabel: `${settings.payments.acceptedMethods.join(', ')} • Reference Required`,
      badge: '#6 Methods',
      color: '#f59e0b'
    }
  ];

  const cards: Array<{ key: SettingsGroupKey; tab: TabKey; title: string; desc: string; icon: typeof Globe; count: string }> = [
    { key: 'general', tab: 'general', title: 'General & Regional', desc: 'Platform name, support contacts, timezone, PHP currency.', icon: Globe, count: '5 properties' },
    { key: 'branding', tab: 'branding', title: 'Branding & Theme', desc: 'Logo typography, primary/accent colors, sidebar dark/light.', icon: Palette, count: '5 properties' },
    { key: 'registration', tab: 'registration', title: 'Registration & Subscriptions', desc: 'Self-service signups, email verify, renewal warning days.', icon: UserCheck, count: '9 properties' },
    { key: 'payments', tab: 'payments', title: 'Payments & Gateways', desc: 'GCash, Maya, Bank Transfer, Demo payment switches.', icon: CreditCard, count: '4 properties' },
    { key: 'security', tab: 'security', title: 'Security & Session Rules', desc: 'Session timeouts, privacy protection, backup limits.', icon: Lock, count: '19 properties' },
    { key: 'features', tab: 'features', title: 'Feature Controls (On/Off)', desc: '18 system feature controls, maintenance mode access.', icon: ToggleRight, count: '18 modules' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. VISUAL ANALYTICS TOOLBAR & CHARTS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                System Settings & Feature Status Analytics
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Live overview and status breakdown of platform configuration categories
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '30px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => setShowAnalytics(prev => !prev)}
          >
            <BarChart3 size={13} />
            {showAnalytics ? 'Hide Visual Analytics' : 'Show Visual Analytics'}
          </button>
        </div>

        {showAnalytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <DonutPieChart
              title="System Features Status Distribution"
              subtitle="Live breakdown of 18 system module operational states"
              data={featureChartData}
              centerLabel="Active Modules"
              centerValue={`${enabledFeatures}/${totalFeatures}`}
              size={190}
            />

            <HorizontalBarChart
              title="Settings Categories Summary"
              subtitle="Configuration properties and safety rules by category"
              data={governanceDensityData}
              showRank
              color="#2563eb"
            />
          </div>
        )}
      </div>

      {/* Category Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '1rem'
      }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                      <Icon size={16} />
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{card.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{card.count}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                  {card.desc}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    height: '30px',
                    width: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                    padding: '0 0.65rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={() => onReset(card.key)}
                >
                  <RotateCcw size={12} /> Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    height: '30px',
                    width: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                    padding: '0 0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                  onClick={() => onSelectTab(card.tab)}
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Ledger Changes */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={16} color="#2563eb" />
            Recent Settings Governance Activity
          </h3>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '28px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              padding: '0 0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onSelectTab('history')}
          >
            View All ({history.length})
          </button>
        </div>

        {history.length === 0 ? (
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '1rem 0 0' }}>No settings change records logged yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.slice(0, 4).map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{item.settingsHistoryNumber}</span>
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.7rem'
                  }}>
                    {labelize(item.group)}
                  </span>
                  <span style={{ color: '#475569' }}>{item.reason}</span>
                </div>
                <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                  {new Date(item.changedAt).toLocaleString('en-PH')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GeneralRegionalPanel({
  settings,
  showToast,
  refresh,
  onReset
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [generalDraft, setGeneralDraft] = useState(settings.general);
  const [regionalDraft, setRegionalDraft] = useState(settings.regional);

  const save = () => {
    if (!generalDraft.platformName.trim()) {
      showToast('Platform Name cannot be empty.', 'error');
      return;
    }
    if (!generalDraft.supportEmail.includes('@')) {
      showToast('Please provide a valid support email address.', 'error');
      return;
    }

    mockPlatformSettingsService.updateSettingsGroup('general', generalDraft, 'Updated platform identity and support routing');
    mockPlatformSettingsService.updateSettingsGroup('regional', regionalDraft, 'Updated regional timezone and locale formatting');
    refresh();
    showToast('General and regional configuration saved.', 'success');
  };

  const sampleDate = new Date();
  const timeFormatted = regionalDraft.timeFormat === '12h'
    ? sampleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
    : sampleDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="#2563eb" />
            General & Regional Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Configure system identity, support contacts, timezone, and Philippine locale formatting.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onReset('general')}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={save}
          >
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>System Name *</span>
          <input className="form-input" value={generalDraft.platformName} onChange={e => setGeneralDraft(prev => ({ ...prev, platformName: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Support Email Address *</span>
          <input className="form-input" type="email" value={generalDraft.supportEmail} onChange={e => setGeneralDraft(prev => ({ ...prev, supportEmail: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Support Phone Number</span>
          <input className="form-input" value={generalDraft.supportPhone} onChange={e => setGeneralDraft(prev => ({ ...prev, supportPhone: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>System Environment Name</span>
          <input className="form-input" value={generalDraft.environmentLabel} onChange={e => setGeneralDraft(prev => ({ ...prev, environmentLabel: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Timezone</span>
          <select className="form-input" value={regionalDraft.timezone} onChange={e => setRegionalDraft(prev => ({ ...prev, timezone: e.target.value }))}>
            <option value="Asia/Manila">Asia/Manila (PHT UTC+08:00 - Philippine Standard Time)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT UTC+08:00)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST UTC+09:00)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
          </select>
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Language & Region Code</span>
          <input className="form-input" value={regionalDraft.locale} onChange={e => setRegionalDraft(prev => ({ ...prev, locale: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Currency</span>
          <select className="form-input" value={regionalDraft.currency} disabled>
            <option value="PHP">PHP (Philippine Peso ₱ - Standard Currency)</option>
          </select>
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Time Format</span>
          <select className="form-input" value={regionalDraft.timeFormat} onChange={e => setRegionalDraft(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }))}>
            <option value="12h">12-Hour Clock (e.g. 08:30 PM)</option>
            <option value="24h">24-Hour Format (e.g. 20:30)</option>
          </select>
        </label>
      </div>

      {/* Live Formatted Output Preview */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.825rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} color="#2563eb" />
          <span><strong>Sample Date & Time Display:</strong> {sampleDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}, {timeFormatted}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span><strong>Sample Currency Display:</strong> <code style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>₱7,990.00 PHP</code></span>
        </div>
      </div>
    </div>
  );
}

function BrandingPanel({
  settings,
  showToast,
  refresh,
  onReset
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [draft, setDraft] = useState(settings.branding);

  const primaryPresets = ['#2563eb', '#059669', '#7c3aed', '#0f172a', '#0284c7'];
  const accentPresets = ['#38bdf8', '#f59e0b', '#ec4899', '#10b981', '#6366f1'];

  const save = () => {
    if (!draft.logoText.trim()) {
      showToast('Brand Logo text cannot be empty.', 'error');
      return;
    }
    mockPlatformSettingsService.updateSettingsGroup('branding', draft, 'Updated platform visual branding and theme');
    refresh();
    showToast('Branding settings saved successfully.', 'success');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={18} color="#ec4899" />
            Branding & Theme Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Customize system brand name, navigation sidebar colors, and visual highlights.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onReset('branding')}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={save}
          >
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>System Brand Name</span>
          <input className="form-input" value={draft.logoText} onChange={e => setDraft(prev => ({ ...prev, logoText: e.target.value }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Sidebar Color Theme</span>
          <select className="form-input" value={draft.sidebarTheme} onChange={e => setDraft(prev => ({ ...prev, sidebarTheme: e.target.value as 'dark' | 'light' }))}>
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
        </label>

        {/* Primary Color Picker & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Primary Color</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="color" style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} value={draft.primaryColor} onChange={e => setDraft(prev => ({ ...prev, primaryColor: e.target.value }))} />
            <input className="form-input" style={{ fontFamily: 'monospace' }} value={draft.primaryColor} onChange={e => setDraft(prev => ({ ...prev, primaryColor: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
            {primaryPresets.map(preset => (
              <button
                key={preset}
                type="button"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: preset,
                  border: draft.primaryColor === preset ? '2px solid #0f172a' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => setDraft(prev => ({ ...prev, primaryColor: preset }))}
              />
            ))}
          </div>
        </div>

        {/* Accent Color Picker & Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Accent Color</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="color" style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} value={draft.accentColor} onChange={e => setDraft(prev => ({ ...prev, accentColor: e.target.value }))} />
            <input className="form-input" style={{ fontFamily: 'monospace' }} value={draft.accentColor} onChange={e => setDraft(prev => ({ ...prev, accentColor: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
            {accentPresets.map(preset => (
              <button
                key={preset}
                type="button"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: preset,
                  border: draft.accentColor === preset ? '2px solid #0f172a' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => setDraft(prev => ({ ...prev, accentColor: preset }))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live Brand Shell Preview Card */}
      <div style={{
        backgroundColor: draft.sidebarTheme === 'dark' ? '#0f172a' : '#f8fafc',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        color: draft.sidebarTheme === 'dark' ? '#ffffff' : '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={14} color={draft.accentColor} />
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: draft.accentColor, fontWeight: 800, letterSpacing: '0.05em' }}>
              Appearance Preview
            </span>
          </div>
          <h3 style={{ margin: 0, color: draft.primaryColor, fontWeight: 800, fontSize: '1.35rem' }}>{draft.logoText}</h3>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Sidebar Theme: <strong>{draft.sidebarTheme.toUpperCase()}</strong> • Accent Highlight: <code style={{ color: draft.accentColor }}>{draft.accentColor}</code>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ backgroundColor: draft.primaryColor, borderColor: draft.primaryColor, width: 'auto', fontSize: '0.8rem' }}
          >
            Sample Button Action
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationSubscriptionsPanel({
  settings,
  showToast,
  refresh,
  onReset
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [regDraft, setRegDraft] = useState(settings.registration);
  const [subsDraft, setSubsDraft] = useState(settings.subscriptions);

  const save = () => {
    if (subsDraft.renewalWarningDays < 1 || subsDraft.renewalWarningDays > 90) {
      showToast('Renewal warning days must be between 1 and 90 days.', 'error');
      return;
    }
    if (subsDraft.expirationWarningDays < 1 || subsDraft.expirationWarningDays > 60) {
      showToast('Expiration notice window must be between 1 and 60 days.', 'error');
      return;
    }

    mockPlatformSettingsService.updateSettingsGroup('registration', regDraft, 'Updated self-service registration policies');
    mockPlatformSettingsService.updateSettingsGroup('subscriptions', subsDraft, 'Updated subscription renewal and provisioning policies');
    refresh();
    showToast('Registration and subscription policies saved.', 'success');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} color="#2563eb" />
            Registration & Plan Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Manage clinic registration, email verification, and subscription renewal notices.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onReset('registration')}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={save}
          >
            <Save size={13} /> Save Policies
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={regDraft.registrationEnabled} onChange={e => setRegDraft(prev => ({ ...prev, registrationEnabled: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Online Clinic Registration</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={regDraft.requireEmailVerification} onChange={e => setRegDraft(prev => ({ ...prev, requireEmailVerification: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Email Verification Code</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={regDraft.requirePaymentBeforeApproval} onChange={e => setRegDraft(prev => ({ ...prev, requirePaymentBeforeApproval: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Payment Proof Before Account Approval</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={subsDraft.autoProvisionOnApproval} onChange={e => setSubsDraft(prev => ({ ...prev, autoProvisionOnApproval: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Automatically Activate Plan & Quotas on Approval</span>
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Renewal Notice Window (Days Before Expiration: 1-90)</span>
          <input type="number" min={1} max={90} className="form-input" value={subsDraft.renewalWarningDays} onChange={e => setSubsDraft(prev => ({ ...prev, renewalWarningDays: Number(e.target.value) }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Account Expiration Warning (Days: 1-60)</span>
          <input type="number" min={1} max={60} className="form-input" value={subsDraft.expirationWarningDays} onChange={e => setSubsDraft(prev => ({ ...prev, expirationWarningDays: Number(e.target.value) }))} />
        </label>
      </div>

      {/* Governance Insight Callout */}
      <div style={{
        backgroundColor: '#f0fdf4',
        borderRadius: '10px',
        border: '1px solid #bbf7d0',
        padding: '0.85rem 1.15rem',
        fontSize: '0.8rem',
        color: '#166534',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Check size={16} color="#16a34a" style={{ flexShrink: 0 }} />
        <div>
          <strong>Account Setup Note:</strong> When a new clinic registers, approving their payment will automatically create their clinic account, assign their dentist and staff limits, and create their receipt.
        </div>
      </div>
    </div>
  );
}

function PaymentsPanel({
  settings,
  showToast,
  refresh,
  onReset
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [draft, setDraft] = useState(settings.payments);
  const availableGateways = ['GCash', 'Maya', 'Bank Transfer', 'Demo Payment'];

  const toggleMethod = (method: string) => {
    setDraft(prev => {
      const exists = prev.acceptedMethods.includes(method);
      const updated = exists ? prev.acceptedMethods.filter(m => m !== method) : [...prev.acceptedMethods, method];
      if (updated.length === 0) {
        showToast('At least one payment method must remain active.', 'error');
        return prev;
      }
      const defaultMethod = updated.includes(prev.defaultMethod) ? prev.defaultMethod : updated[0];
      return { ...prev, acceptedMethods: updated, defaultMethod };
    });
  };

  const save = () => {
    mockPlatformSettingsService.updateSettingsGroup('payments', draft, 'Updated accepted payment gateways and verification rules');
    refresh();
    showToast('Payment gateway policies saved successfully.', 'success');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="#f59e0b" />
            Payment Methods & Gateway Settings
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Manage accepted payment methods (GCash, Maya, Bank Transfer) and verification rules.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onReset('payments')}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={save}
          >
            <Save size={13} /> Save Payment Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={draft.requireReferenceNumber} onChange={e => setDraft(prev => ({ ...prev, requireReferenceNumber: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Reference Number for Payments</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={draft.mockReceiptRequired} onChange={e => setDraft(prev => ({ ...prev, mockReceiptRequired: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Official Receipt Proof Upload</span>
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Default Payment Option</span>
          <select className="form-input" value={draft.defaultMethod} onChange={e => setDraft(prev => ({ ...prev, defaultMethod: e.target.value }))}>
            {draft.acceptedMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Interactive Gateway Chips */}
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
          Accepted Payment Methods (Click to Turn On / Off)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableGateways.map(gateway => {
            const isActive = draft.acceptedMethods.includes(gateway);
            return (
              <button
                key={gateway}
                type="button"
                onClick={() => toggleMethod(gateway)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                  color: isActive ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <CreditCard size={14} />
                <span>{gateway}</span>
                {isActive && <Check size={12} color="#2563eb" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SecurityAuditPanel({
  settings,
  showToast,
  refresh,
  onReset
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
  onReset: (group: SettingsGroupKey) => void;
}) {
  const [secDraft, setSecDraft] = useState(settings.security);
  const [auditDraft, setAuditDraft] = useState(settings.auditData);

  const save = () => {
    if (secDraft.mockSessionTimeoutMinutes < 5 || secDraft.mockSessionTimeoutMinutes > 480) {
      showToast('Session timeout must be between 5 and 480 minutes.', 'error');
      return;
    }
    if (auditDraft.maximumLocalRestorePoints < 1 || auditDraft.maximumLocalRestorePoints > 20) {
      showToast('Maximum local restore points must be between 1 and 20.', 'error');
      return;
    }

    mockPlatformSettingsService.updateSettingsGroup('security', secDraft, 'Updated security session and password policies');
    mockPlatformSettingsService.updateSettingsGroup('auditData', auditDraft, 'Updated audit logging and snapshot quota limits');
    refresh();
    showToast('Security and session rules saved successfully.', 'success');
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="#7c3aed" />
            Security & Session Rules
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Configure automatic sign-out timers, confidential privacy protection, and safety backup copies.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={() => onReset('security')}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={save}
          >
            <Save size={13} /> Save Security Rules
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Automatic Sign-Out Inactivity Time (5-480 Minutes)</span>
          <input type="number" min={5} max={480} className="form-input" value={secDraft.mockSessionTimeoutMinutes} onChange={e => setSecDraft(prev => ({ ...prev, mockSessionTimeoutMinutes: Number(e.target.value) }))} />
        </label>
        <label className="form-control">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Maximum Saved Backups Kept (1-20 Backups)</span>
          <input type="number" min={1} max={20} className="form-input" value={auditDraft.maximumLocalRestorePoints} onChange={e => setAuditDraft(prev => ({ ...prev, maximumLocalRestorePoints: Number(e.target.value) }))} />
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={secDraft.requirePasswordChangeOnTemporaryLogin} onChange={e => setSecDraft(prev => ({ ...prev, requirePasswordChangeOnTemporaryLogin: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Password Change on First Login</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={secDraft.destructiveConfirmationRequired} onChange={e => setSecDraft(prev => ({ ...prev, destructiveConfirmationRequired: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Require Confirmation Dialog Before Deleting Records</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={auditDraft.createPreRestoreCheckpoint} onChange={e => setAuditDraft(prev => ({ ...prev, createPreRestoreCheckpoint: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Automatically Save Safety Backup Before Data Recovery</span>
        </label>
        <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={auditDraft.createPreResetCheckpoint} onChange={e => setAuditDraft(prev => ({ ...prev, createPreResetCheckpoint: e.target.checked }))} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Automatically Save Safety Backup Before Resetting Settings</span>
        </label>
      </div>

      <div style={{
        backgroundColor: '#eff6ff',
        borderRadius: '10px',
        border: '1px solid #bfdbfe',
        padding: '0.75rem 1rem',
        fontSize: '0.8rem',
        color: '#1e40af'
      }}>
        🔒 <strong>Permanent Privacy Protection:</strong> Confidential information (passwords, private contact details) is automatically protected and hidden in all activity records in compliance with the Philippine Data Privacy Act.
      </div>
    </div>
  );
}

function FeatureFlagsMaintenancePanel({
  settings,
  showToast,
  refresh
}: {
  settings: PlatformSettings;
  showToast: Props['showToast'];
  refresh: () => void;
}) {
  const [features, setFeatures] = useState(settings.features);
  const [maintenance, setMaintenance] = useState(settings.maintenance);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoute, setNewRoute] = useState('');

  const statuses: FeatureFlagStatus[] = ['enabled', 'disabled', 'under_development', 'internal_only'];

  const filteredFeatures = Object.entries(features).filter(([key]) =>
    key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    labelize(key).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enableAllOperational = () => {
    const updated = { ...features };
    Object.keys(updated).forEach(k => {
      updated[k as keyof typeof features] = 'enabled';
    });
    setFeatures(updated);
    showToast('All 18 modules set to Enabled. Click Save to apply.', 'info');
  };

  const resetFeatures = () => {
    setFeatures(settings.features);
    showToast('Reverted uncommitted feature controls.', 'info');
  };

  const addAllowedRoute = () => {
    if (!newRoute.trim()) return;
    const cleanRoute = newRoute.startsWith('/') ? newRoute : `/${newRoute}`;
    if (!maintenance.allowedRoutes.includes(cleanRoute)) {
      setMaintenance(prev => ({ ...prev, allowedRoutes: [...prev.allowedRoutes, cleanRoute] }));
      setNewRoute('');
    }
  };

  const removeAllowedRoute = (routeToRemove: string) => {
    setMaintenance(prev => ({
      ...prev,
      allowedRoutes: prev.allowedRoutes.filter(r => r !== routeToRemove)
    }));
  };

  const saveFeatures = () => {
    mockPlatformSettingsService.updateSettingsGroup('features', features, 'Updated platform feature controls');
    refresh();
    showToast('Feature controls saved successfully.', 'success');
  };

  const saveMaintenance = () => {
    mockPlatformSettingsService.updateMaintenanceMode(maintenance);
    refresh();
    showToast('Maintenance mode configuration saved.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Maintenance Mode Box */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#2563eb" />
              System Maintenance Mode
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Turn on maintenance notices for users while allowing administrator access.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={saveMaintenance}
          >
            <Save size={14} /> Save Maintenance
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={maintenance.enabled} onChange={e => setMaintenance(prev => ({ ...prev, enabled: e.target.checked }))} />
            <strong style={{ fontSize: '0.85rem', color: maintenance.enabled ? '#dc2626' : '#0f172a' }}>
              {maintenance.enabled ? '⚠️ Maintenance Mode Active' : 'Maintenance Mode Disabled (Normal)'}
            </strong>
          </label>
          <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={maintenance.allowPlatformOwnerBypass} onChange={e => setMaintenance(prev => ({ ...prev, allowPlatformOwnerBypass: e.target.checked }))} />
            <span style={{ fontSize: '0.85rem' }}>Allow System Administrator Access During Maintenance</span>
          </label>
          <label className="form-control">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Notice Header Text</span>
            <input className="form-input" value={maintenance.title} onChange={e => setMaintenance(prev => ({ ...prev, title: e.target.value }))} />
          </label>
          <label className="form-control">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Estimated Time of Completion</span>
            <input className="form-input" value={maintenance.estimatedCompletion || ''} placeholder="e.g. 2 hours (10:00 PM PHT)" onChange={e => setMaintenance(prev => ({ ...prev, estimatedCompletion: e.target.value }))} />
          </label>
          <label className="form-control" style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Maintenance Message for Users</span>
            <input className="form-input" value={maintenance.message} onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))} />
          </label>
        </div>

        {/* Route Exceptions Manager */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
            Allowed Page Addresses During Maintenance
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {maintenance.allowedRoutes.map(route => (
              <span
                key={route}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#0f172a'
                }}
              >
                {route}
                <button
                  type="button"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}
                  onClick={() => removeAllowedRoute(route)}
                >
                  <Trash2 size={11} color="#dc2626" />
                </button>
              </span>
            ))}
            <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
              <input
                className="form-input"
                style={{ width: '160px', height: '28px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                placeholder="/route/path"
                value={newRoute}
                onChange={e => setNewRoute(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllowedRoute(); } }}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  height: '28px',
                  width: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 0.65rem',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onClick={addAllowedRoute}
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Feature Flags 500px Compact Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ToggleRight size={18} color="#16a34a" />
              System Feature Controls (Turn Features On / Off)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Turn individual system tools and modules on or off in real-time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                height: '32px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.775rem',
                padding: '0 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={enableAllOperational}
            >
              <Sparkles size={13} /> Turn On All
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                height: '32px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.775rem',
                padding: '0 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={resetFeatures}
            >
              <RotateCcw size={13} /> Revert
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                height: '32px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.775rem',
                padding: '0 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={saveFeatures}
            >
              <Save size={13} /> Save Feature Controls
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '30px', height: '32px', fontSize: '0.8rem' }}
            placeholder="Search module or feature name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5, borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Feature / Module</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Code Identifier</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '180px' }}>Status Setting</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '130px' }}>Current State</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map(([flag, status]) => (
                <tr key={flag} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <strong style={{ color: '#0f172a' }}>{labelize(flag)}</strong>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.775rem' }}>
                    {flag}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                    <select
                      className="form-input"
                      style={{ height: '30px', fontSize: '0.775rem', padding: '0 0.5rem' }}
                      value={status}
                      onChange={e => setFeatures(prev => ({ ...prev, [flag]: e.target.value as FeatureFlagStatus }))}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{labelize(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      backgroundColor: status === 'enabled' ? '#f0fdf4' : status === 'under_development' ? '#fef3c7' : '#fee2e2',
                      color: status === 'enabled' ? '#16a34a' : status === 'under_development' ? '#d97706' : '#dc2626'
                    }}>
                      {labelize(status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HistoryLedgerTab({
  history,
  onViewDiff,
  onResetAll
}: {
  history: SettingsHistoryRecord[];
  onViewDiff: (record: SettingsHistoryRecord) => void;
  onResetAll: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter(item => {
    const matchesGroup = selectedGroup === 'all' || item.group === selectedGroup;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      item.settingsHistoryNumber.toLowerCase().includes(q) ||
      item.reason.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.changedFields.some(f => f.toLowerCase().includes(q));
    return matchesGroup && matchesSearch;
  });

  const handleCopyId = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportHistoryCsv = () => {
    if (history.length === 0) return;
    const headers = ['History ID', 'Settings Group', 'Reason', 'Modified Fields', 'Timestamp'];
    const rows = history.map(item => [
      item.settingsHistoryNumber,
      item.group,
      `"${item.reason.replace(/"/g, '""')}"`,
      `"${item.changedFields.join(', ')}"`,
      new Date(item.changedAt).toLocaleString('en-PH')
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnj-settings-change-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#2563eb" />
            Settings Change History
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Permanent record of all platform settings updates, adjustments, and resets.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={exportHistoryCsv}
            disabled={history.length === 0}
          >
            <Download size={13} /> Export History CSV
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              height: '32px',
              width: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: '0.775rem',
              padding: '0 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={onResetAll}
          >
            <RotateCcw size={13} /> Reset All Settings
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '280px', minWidth: '220px', flex: '0 1 280px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '30px', height: '32px', fontSize: '0.8rem', width: '100%' }}
            placeholder="Search history ID, reason, or field..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={14} color="#64748b" />
          <select
            className="form-input"
            style={{ height: '32px', fontSize: '0.775rem', paddingLeft: '0.65rem', paddingRight: '1.75rem', minWidth: '200px', width: 'auto' }}
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            <option value="all">All Settings Categories ({history.length})</option>
            <option value="general">General & Identity</option>
            <option value="regional">Regional & Locale</option>
            <option value="branding">Branding & Theme</option>
            <option value="registration">Registration Policies</option>
            <option value="subscriptions">Subscription Policies</option>
            <option value="payments">Payments & Gateways</option>
            <option value="security">Security Rules</option>
            <option value="auditData">Data & Retention</option>
            <option value="features">Feature Controls</option>
            <option value="maintenance">Maintenance Mode</option>
          </select>
        </div>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5, borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>History ID</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Settings Category</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reason / Summary</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Changed Fields</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Timestamp</th>
              <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <History size={28} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600 }}>No settings change records found</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Adjust your search query or category filter</div>
                </td>
              </tr>
            ) : (
              filteredHistory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <button
                      type="button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: copiedId === item.id ? '#16a34a' : '#0f172a'
                      }}
                      onClick={() => handleCopyId(item.id, item.settingsHistoryNumber)}
                      title="Click to copy history ID"
                    >
                      <span>{item.settingsHistoryNumber}</span>
                      {copiedId === item.id ? <Check size={12} color="#16a34a" /> : <Copy size={11} color="#94a3b8" />}
                    </button>
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '0.725rem'
                    }}>
                      {labelize(item.group)}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                    {item.reason}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {item.changedFields.length > 0 ? (
                      item.changedFields.map(f => (
                        <span key={f} style={{ margin: '0 0.15rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: '#f1f5f9', fontFamily: 'monospace' }}>
                          {f}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Category baseline state</span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(item.changedAt).toLocaleString('en-PH')}
                  </td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ height: '26px', padding: '0 0.55rem', fontSize: '0.725rem', gap: '0.25rem' }}
                      onClick={() => onViewDiff(item)}
                    >
                      <Eye size={12} /> Compare
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


