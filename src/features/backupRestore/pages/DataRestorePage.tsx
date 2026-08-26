import { useEffect, useMemo, useState } from 'react';
import { 
  ArchiveRestore, 
  Download, 
  Eye, 
  FileJson, 
  RotateCcw, 
  ShieldAlert, 
  Trash2, 
  Upload,
  Plus,
  Search,
  HardDrive,
  CheckCircle2,
  Copy,
  Printer,
  Clock,
  Layers,
  AlertTriangle,
  Database,
  FileText,
  Check,
  BarChart3,
  ShieldCheck,
  UploadCloud,
  AlertCircle,
  X
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { DonutPieChart, type PieChartDataPoint } from '../../analytics/components/charts/DonutPieChart';
import { HorizontalBarChart, type HorizontalBarDataPoint } from '../../analytics/components/charts/HorizontalBarChart';
import { mockBackupRestoreService } from '../services/mockBackupRestoreService';
import type { BackupPayload, RestorePoint, RestoreMode, RestoreHistoryRecord } from '../types';

interface Props {
  route: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell?: () => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatRelativeTime = (isoString: string) => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
};

export function DataRestorePage({ route: _route, navigate: _navigate, showToast, refreshShell }: Props) {
  const [, setVersion] = useState(0);
  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [description, setDescription] = useState('Manual prototype backup');
  const [selectedModules, setSelectedModules] = useState<string[]>(mockBackupRestoreService.moduleRegistry().map(item => item.key));
  const [backupType, setBackupType] = useState<'full' | 'selected_modules' | 'settings_only'>('full');
  const [parsedBackup, setParsedBackup] = useState<BackupPayload | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [restoreFileError, setRestoreFileError] = useState<string | null>(null);
  const [restoreModules, setRestoreModules] = useState<string[]>([]);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('replace');
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmRollbackOpen, setConfirmRollbackOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RestorePoint | null>(null);
  const [viewDetailsTarget, setViewDetailsTarget] = useState<RestorePoint | null>(null);
  const [viewHistoryTarget, setViewHistoryTarget] = useState<RestoreHistoryRecord | null>(null);

  // Filters & View State
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'manual' | 'pre_restore' | 'pre_reset' | 'history'>('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = () => setVersion(prev => prev + 1);

  // Initial seed check & Cross-Tier Storage Reactivity (Phase 4)
  useEffect(() => {
    mockBackupRestoreService.ensureInitialRestorePoints();

    const handleSync = () => {
      refresh();
      refreshShell?.();
    };

    window.addEventListener('DATA_RESTORE_COMPLETED', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('DATA_RESTORE_COMPLETED', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshShell]);

  const registry = mockBackupRestoreService.moduleRegistry();
  const summary = mockBackupRestoreService.getBackupSummary();
  const rawRestorePoints = mockBackupRestoreService.listRestorePoints().filter(p => p.status !== 'deleted');
  const history = mockBackupRestoreService.getRestoreHistory();
  const storageFootprint = mockBackupRestoreService.getStorageFootprint();

  const latestPreRestorePoint = useMemo(() => {
    return rawRestorePoints.find(point => point.type === 'pre_restore' && point.status === 'available');
  }, [rawRestorePoints]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    return history.filter(item => item.action === historyFilter);
  }, [history, historyFilter]);

  // Phase 2: Real-Data SVG Analytics Computations
  const storageDonutData: PieChartDataPoint[] = useMemo(() => {
    const entries = Object.entries(storageFootprint.moduleBytes || {});
    entries.sort((a, b) => b[1].bytes - a[1].bytes);
    
    const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b', '#6366f1'];
    const top = entries.slice(0, 5);
    const others = entries.slice(5);
    const otherBytes = others.reduce((sum, [, val]) => sum + val.bytes, 0);

    const points: PieChartDataPoint[] = top.map(([, val], idx) => {
      const pct = storageFootprint.totalBytes > 0 ? ((val.bytes / storageFootprint.totalBytes) * 100).toFixed(1) : '0';
      return {
        label: val.label,
        value: Math.max(1, val.bytes),
        formattedValue: `${formatBytes(val.bytes)} (${pct}%)`,
        color: palette[idx % palette.length]
      };
    });

    if (otherBytes > 0) {
      const pct = storageFootprint.totalBytes > 0 ? ((otherBytes / storageFootprint.totalBytes) * 100).toFixed(1) : '0';
      points.push({
        label: 'Other Modules',
        value: otherBytes,
        formattedValue: `${formatBytes(otherBytes)} (${pct}%)`,
        color: '#94a3b8'
      });
    }

    return points;
  }, [storageFootprint]);

  const recordLeaderboardData: HorizontalBarDataPoint[] = useMemo(() => {
    const entries = Object.entries(storageFootprint.moduleBytes || {});
    entries.sort((a, b) => b[1].recordCount - a[1].recordCount);

    return entries.slice(0, 6).map(([, val], idx) => ({
      label: val.label,
      value: val.recordCount,
      formattedValue: `${val.recordCount.toLocaleString()} records`,
      sublabel: `${formatBytes(val.bytes)} in browser memory`,
      badge: `#${idx + 1}`,
      color: idx === 0 ? '#2563eb' : idx === 1 ? '#10b981' : idx === 2 ? '#8b5cf6' : '#64748b'
    }));
  }, [storageFootprint]);

  const toggleModule = (moduleKey: string) => {
    setSelectedModules(prev => prev.includes(moduleKey) ? prev.filter(k => k !== moduleKey) : [...prev, moduleKey]);
  };

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(msg, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Restore Points
  const filteredPoints = useMemo(() => {
    return rawRestorePoints.filter(point => {
      // Tab filter
      if (activeTab === 'manual' && point.type !== 'manual') return false;
      if (activeTab === 'pre_restore' && point.type !== 'pre_restore') return false;
      if (activeTab === 'pre_reset' && point.type !== 'pre_reset') return false;

      // Module filter
      if (moduleFilter !== 'all' && !point.includedModules.includes(moduleFilter)) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = point.restorePointNumber.toLowerCase().includes(q);
        const matchesName = point.name.toLowerCase().includes(q);
        const matchesDesc = (point.description || '').toLowerCase().includes(q);
        const matchesModules = point.includedModules.some(m => m.toLowerCase().includes(q));
        if (!matchesId && !matchesName && !matchesDesc && !matchesModules) return false;
      }

      return true;
    });
  }, [rawRestorePoints, activeTab, moduleFilter, search]);

  const preview = useMemo(() => {
    return parsedBackup ? mockBackupRestoreService.previewRestore(parsedBackup, restoreModules.length ? restoreModules : parsedBackup.manifest.includedModules, restoreMode) : null;
  }, [parsedBackup, restoreModules, restoreMode]);

  const runBackup = () => {
    const result = backupType === 'full' 
      ? mockBackupRestoreService.createFullBackup(description) 
      : backupType === 'settings_only' 
      ? mockBackupRestoreService.createSettingsBackup() 
      : mockBackupRestoreService.createSelectedModuleBackup(selectedModules, description);

    if (!result.ok || !result.data) {
      showToast(result.error || 'Backup failed.', 'error');
    } else {
      mockBackupRestoreService.downloadBackupFile(result.data);
      setBackupOpen(false);
      refresh();
      showToast('Backup created and JSON download started.', 'success');
    }
  };

  const parseFile = async (file?: File) => {
    if (!file) return;
    setRestoreFileError(null);
    setUploadedFileName(file.name);
    try {
      const text = await file.text();
      const result = mockBackupRestoreService.parseBackupFile(text);
      if (!result.ok || !result.data) {
        setParsedBackup(null);
        setRestoreFileError(result.error || 'Invalid JSON format or unsupported schema format.');
        showToast(result.error || 'Backup validation failed.', 'error');
        return;
      }
      setParsedBackup(result.data);
      setRestoreModules(result.data.manifest.includedModules);
      showToast(`Validated backup ${result.data.manifest.backupNumber} successfully.`, 'success');
    } catch {
      setParsedBackup(null);
      setRestoreFileError('Corrupted JSON file structure could not be parsed.');
      showToast('File read error.', 'error');
    }
  };

  const toggleRestoreModule = (moduleKey: string) => {
    setRestoreModules(prev => prev.includes(moduleKey) ? prev.filter(k => k !== moduleKey) : [...prev, moduleKey]);
  };

  const executeRestore = () => {
    if (!parsedBackup) return;
    const result = mockBackupRestoreService.restoreSelectedModules(parsedBackup, restoreModules, restoreMode);
    if (!result.ok) {
      showToast(result.error || 'Restore failed.', 'error');
    } else {
      setConfirmRestore(false);
      setRestoreOpen(false);
      refresh();
      refreshShell?.();
      showToast('Restore completed successfully.', 'success');
    }
  };

  const rollback = () => {
    const result = mockBackupRestoreService.rollbackLatestRestore();
    if (!result.ok) {
      showToast(result.error || 'Rollback failed.', 'error');
    } else {
      refresh();
      refreshShell?.();
      showToast('Rollback completed from latest checkpoint.', 'success');
    }
  };

  const reset = () => {
    const result = mockBackupRestoreService.resetMockData(resetText);
    if (!result.ok) {
      showToast(result.error || 'Reset blocked.', 'error');
    } else {
      setResetOpen(false);
      setResetText('');
      refresh();
      refreshShell?.();
      showToast('Prototype mock data reset safely.', 'success');
    }
  };

  const exportHistoryCsv = () => {
    const csv = mockBackupRestoreService.exportRestoreHistory();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `restore-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Restore history CSV exported.', 'success');
  };

  const getTypeBadge = (type: RestorePoint['type']) => {
    switch (type) {
      case 'manual':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Manual Snapshot' };
      case 'pre_restore':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'Pre-Restore Guard' };
      case 'pre_reset':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Pre-Reset Checkpoint' };
      default:
        return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: labels(type) };
    }
  };

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER & PRIMARY ACTIONS (Exact 2-Button standard) */}
      <PlatformPageHeader
        title="System Backup & Data Recovery"
        subtitle="Create system backups, restore saved clinic records, and manage safety recovery points."
        breadcrumbs={['Platform', 'System & Tools', 'Backup & Recovery']}
        secondaryAction={{
          label: 'Restore from Backup',
          icon: Upload,
          onClick: () => setRestoreOpen(true)
        }}
        primaryAction={{
          label: 'Create Backup',
          icon: Plus,
          onClick: () => setBackupOpen(true)
        }}
        overflowActions={[
          { id: 'rollback', label: 'Undo Latest Recovery', icon: RotateCcw, onSelect: () => setConfirmRollbackOpen(true) },
          { id: 'history-csv', label: 'Export History CSV', icon: Download, onSelect: exportHistoryCsv },
          { id: 'reset', label: 'Reset System Data', icon: Trash2, destructive: true, onSelect: () => setResetOpen(true) }
        ]}
      />

      {/* 2. TOP 4 HERO KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {/* Available Restore Points */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Saved Backup Copies
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.availableRestorePoints}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> 100% Ready to Restore
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb'
          }}>
            <ArchiveRestore size={22} />
          </div>
        </div>

        {/* Estimated Storage Footprint */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Storage Size
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {storageFootprint.totalFormatted}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
              <HardDrive size={13} /> 14 Data Tables Saved
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f5f3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Database size={22} />
          </div>
        </div>

        {/* Total Persisted Records */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Saved Records
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.totalPrototypeRecords}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <Layers size={13} /> Protected in Storage
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a'
          }}>
            <FileText size={22} />
          </div>
        </div>

        {/* Last Backup & Recovery */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Most Recent Backup
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
              {summary.lastBackup ? formatRelativeTime(summary.lastBackup) : 'Original State'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
              <Clock size={13} /> Safety Guard Active
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706'
          }}>
            <RotateCcw size={22} />
          </div>
        </div>
      </div>

      {/* 3. SECONDARY STORAGE & PROTOCOL RIBBON */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem',
        color: '#475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} color="#2563eb" />
            <span><strong>Storage Scope:</strong> 14 Registered System Modules</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={14} color="#16a34a" />
            <span><strong>Pre-Restore Checkpoints:</strong> Auto-Created Before Overwrite</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileJson size={14} color="#7c3aed" />
            <span><strong>Manifest Format:</strong> <code style={{ fontFamily: 'monospace' }}>{summary.currentBackupFormat}</code></span>
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 600 }}>
          <AlertTriangle size={14} />
          <span>Local Browser Storage (Prototype Scope)</span>
        </div>
      </div>

      {/* 3.5. REAL-DATA SVG VISUAL STORAGE ANALYTICS SUITE (Phase 2) */}
      {showAnalytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Storage Breakdown Donut Chart */}
          <DonutPieChart
            title="Storage Footprint by System Domain"
            subtitle="Real byte allocation calculated across 14 persistent local storage partitions"
            data={storageDonutData}
            centerLabel="STORAGE"
            centerValue={storageFootprint.totalFormatted}
            size={210}
            donutThickness={28}
            emptyMessage="No storage domain data found."
          />

          {/* Table Entity Volume Leaderboard */}
          <HorizontalBarChart
            title="Persisted Table Record Leaderboard"
            subtitle="Ranked database tables by total live entity instances stored in browser memory"
            data={recordLeaderboardData}
            showRank={true}
            color="#2563eb"
            emptyMessage="No module tables found."
          />
        </div>
      )}

      {/* 4. MAIN DATA RESTORE WORKSPACE CARD */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* SEGMENTED FILTER TABS */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'All Snapshots', count: rawRestorePoints.length },
            { id: 'manual', label: 'Manual Backups', count: rawRestorePoints.filter(p => p.type === 'manual').length },
            { id: 'pre_restore', label: 'Pre-Restore Guards', count: rawRestorePoints.filter(p => p.type === 'pre_restore').length },
            { id: 'pre_reset', label: 'Pre-Reset Checkpoints', count: rawRestorePoints.filter(p => p.type === 'pre_reset').length },
            { id: 'history', label: 'Restore History', count: history.length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH, MODULE FILTERS & QUICK TOOLBAR */}
        {activeTab !== 'history' ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search snapshot ID, name, description, modules..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    paddingLeft: '2.25rem',
                    paddingRight: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                    outline: 'none',
                    backgroundColor: '#f8fafc'
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Module Filter */}
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.825rem',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Modules ({registry.length})</option>
                {registry.map(mod => (
                  <option key={mod.key} value={mod.key}>{mod.label}</option>
                ))}
              </select>

              {/* Clear button */}
              {(search || moduleFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setModuleFilter('all'); }}
                  style={{
                    height: '38px',
                    width: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '0 0.75rem',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* View Switcher & Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  height: '34px',
                  width: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 0.75rem',
                  fontSize: '0.775rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px'
                }}
                onClick={() => setShowAnalytics(prev => !prev)}
              >
                <BarChart3 size={13} color="#7c3aed" />
                <span>{showAnalytics ? 'Hide Storage Analytics' : 'Show Storage Analytics'}</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  height: '34px',
                  width: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 0.75rem',
                  fontSize: '0.775rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px'
                }}
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print
              </button>

              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}>
                Showing {filteredPoints.length} of {rawRestorePoints.length} snapshots
              </span>

              <div className="segmented-control" role="group" aria-label="View mode" style={{ flexShrink: 0 }}>
                <button className={viewMode === 'table' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('table')}>Table</button>
                <button className={viewMode === 'cards' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('cards')}>Cards</button>
              </div>
            </div>
          </div>
        ) : (
          /* RESTORE HISTORY TOOLBAR */
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              <select
                value={historyFilter}
                onChange={e => setHistoryFilter(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.825rem',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All History Actions ({history.length})</option>
                <option value="restore_completed">Restore Completed</option>
                <option value="rollback_completed">Rollback Completed</option>
                <option value="reset_completed">Mock Data Resets</option>
                <option value="restore_failed">Failed Restores</option>
                <option value="restore_point_deleted">Deleted Points</option>
              </select>

              {historyFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  style={{
                    height: '38px',
                    width: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '0 0.75rem',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {latestPreRestorePoint && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    height: '34px',
                    width: 'auto',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '0 0.75rem',
                    fontSize: '0.775rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderRadius: '8px'
                  }}
                  onClick={() => setConfirmRollbackOpen(true)}
                >
                  <RotateCcw size={13} color="#2563eb" />
                  <span>Rollback to Pre-Restore Point</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  height: '34px',
                  padding: '0 0.75rem',
                  fontSize: '0.775rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px'
                }}
                onClick={exportHistoryCsv}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>
        )}

        {/* 500PX HIGH-DENSITY TABLE OR CARDS GRID */}
        {activeTab === 'history' ? (
          /* RESTORE HISTORY 500PX COMPACT TABLE (Phase 4) */
          <div style={{
            maxHeight: '520px',
            overflowY: 'auto',
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '12px'
          }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>History ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Action & Summary</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Mode / Scope</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Actor</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={() => setViewHistoryTarget(item)}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{item.restoreHistoryNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copy(item.restoreHistoryNumber, 'History ID copied'); }}
                          style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedId === item.restoreHistoryNumber ? '#16a34a' : '#94a3b8' }}
                        >
                          {copiedId === item.restoreHistoryNumber ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{labels(item.action)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{item.summary}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.725rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                        {item.modules.length} Modules ({item.mode ? labels(item.mode) : 'Snapshot'})
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {labels(item.actor)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.775rem' }}>
                      {new Date(item.createdAt).toLocaleString('en-PH')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        backgroundColor: item.result === 'success' ? '#dcfce7' : item.result === 'warning' ? '#fef3c7' : '#fee2e2',
                        color: item.result === 'success' ? '#15803d' : item.result === 'warning' ? '#b45309' : '#dc2626'
                      }}>
                        {labels(item.result)}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ height: '28px', padding: '0 0.55rem', fontSize: '0.725rem', borderRadius: '6px' }}
                        onClick={(e) => { e.stopPropagation(); setViewHistoryTarget(item); }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No restore history records matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'table' ? (
          /* 500PX COMPACT RESTORE POINTS TABLE */
          <div style={{
            maxHeight: '520px',
            overflowY: 'auto',
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            position: 'relative'
          }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Snapshot ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Name & Description</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Modules & Records</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Integrity</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPoints.map(point => {
                  const typeBadge = getTypeBadge(point.type);
                  const totalRecords = Object.values(point.recordCounts || {}).reduce((sum, v) => sum + v, 0);
                  return (
                    <tr key={point.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                      {/* ID with Copy */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {point.restorePointNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(point.restorePointNumber, 'Snapshot ID copied')}
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedId === point.restorePointNumber ? '#16a34a' : '#94a3b8' }}
                            title="Copy Snapshot ID"
                          >
                            {copiedId === point.restorePointNumber ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                          {point.id}
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          {point.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', lineHeight: '1.3' }}>
                          {point.description || 'System state snapshot checkpoint.'}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: typeBadge.bg,
                          color: typeBadge.color,
                          border: `1px solid ${typeBadge.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          {point.type === 'manual' && <FileJson size={11} />}
                          {point.type === 'pre_restore' && <RotateCcw size={11} />}
                          {point.type === 'pre_reset' && <AlertTriangle size={11} />}
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                          {new Date(point.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          {new Date(point.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} ({formatRelativeTime(point.createdAt)})
                        </div>
                      </td>

                      {/* Modules & Records */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                          {totalRecords} records
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 600, marginTop: '0.15rem' }}>
                          {point.includedModules.length} Modules included
                        </div>
                      </td>

                      {/* Size */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          color: '#334155'
                        }}>
                          {formatBytes(point.sizeBytes)}
                        </span>
                      </td>

                      {/* Integrity Checksum */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '20px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <CheckCircle2 size={12} /> {point.checksum}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <RowActionMenu
                          ariaLabel={`Actions for ${point.restorePointNumber}`}
                          items={[
                            {
                              id: 'view',
                              label: 'View Snapshot Details',
                              icon: Eye,
                              onSelect: () => setViewDetailsTarget(point)
                            },
                            {
                              id: 'preview',
                              label: 'Preview Restore Impact',
                              icon: ArchiveRestore,
                              onSelect: () => {
                                setParsedBackup(point.payload);
                                setRestoreModules(point.includedModules);
                                setRestoreOpen(true);
                              }
                            },
                            {
                              id: 'restore',
                              label: 'Restore Snapshot Now',
                              icon: RotateCcw,
                              onSelect: () => {
                                setParsedBackup(point.payload);
                                setRestoreModules(point.includedModules);
                                setConfirmRestore(true);
                              }
                            },
                            {
                              id: 'download',
                              label: 'Download JSON File',
                              icon: Download,
                              onSelect: () => mockBackupRestoreService.downloadBackupFile(point.payload)
                            },
                            {
                              id: 'verify',
                              label: 'Verify Checksum',
                              icon: ShieldAlert,
                              onSelect: () => {
                                const valid = mockBackupRestoreService.verifyBackupChecksum(point.payload);
                                showToast(valid ? `Checksum ${point.checksum} is 100% valid.` : 'Checksum mismatch detected!', valid ? 'success' : 'error');
                              }
                            },
                            {
                              id: 'delete',
                              label: 'Delete Local Snapshot',
                              icon: Trash2,
                              destructive: true,
                              onSelect: () => setDeleteTarget(point)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}

                {filteredPoints.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <ArchiveRestore size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748b' }}>No Restore Points Found</div>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing your filters or create a new backup snapshot.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS GRID VIEW */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
            maxHeight: '520px',
            overflowY: 'auto',
            padding: '0.25rem'
          }}>
            {filteredPoints.map(point => {
              const typeBadge = getTypeBadge(point.type);
              const totalRecords = Object.values(point.recordCounts || {}).reduce((sum, v) => sum + v, 0);
              return (
                <div
                  key={point.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: typeBadge.bg,
                        color: typeBadge.color,
                        border: `1px solid ${typeBadge.border}`
                      }}>
                        {typeBadge.label}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                        {point.restorePointNumber}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      {point.name}
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                      {point.description || 'System state snapshot checkpoint.'}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ color: '#64748b' }}>Records</div>
                      <strong style={{ color: '#0f172a' }}>{totalRecords} records</strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Size</div>
                      <strong style={{ color: '#0f172a' }}>{formatBytes(point.sizeBytes)}</strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Digest</div>
                      <strong style={{ color: '#16a34a' }}>{point.checksum}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                      {formatRelativeTime(point.createdAt)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ height: '30px', padding: '0 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        onClick={() => setViewDetailsTarget(point)}
                      >
                        <Eye size={12} /> Details
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ height: '30px', padding: '0 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        onClick={() => {
                          setParsedBackup(point.payload);
                          setRestoreModules(point.includedModules);
                          setConfirmRestore(true);
                        }}
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CREATE BACKUP MODAL */}
      <Modal
        open={backupOpen}
        title="Create System Backup Snapshot"
        description="Generates an immutable JSON snapshot of your chosen prototype modules. Sensitive credentials and active sessions are redacted."
        onClose={() => setBackupOpen(false)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setBackupOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={runBackup}>
              <Download size={15} /> Create and Download JSON
            </button>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Backup Snapshot Name
            </label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Production Baseline Verification"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Backup Scope
            </label>
            <select
              className="form-input"
              value={backupType}
              onChange={e => setBackupType(e.target.value as typeof backupType)}
              style={{ width: '100%' }}
            >
              <option value="full">Full Platform Backup (All 14 Modules)</option>
              <option value="selected_modules">Custom Selected Modules</option>
              <option value="settings_only">Platform Settings & Quotas Only</option>
            </select>
          </div>

          {backupType === 'selected_modules' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Select Modules to Include ({selectedModules.length}/{registry.length})</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setSelectedModules(registry.map(m => m.key))}>Select All</button>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setSelectedModules([])}>Clear All</button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                {registry.map(mod => (
                  <label key={mod.key} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(mod.key)}
                      onChange={() => toggleModule(mod.key)}
                    />
                    <span>{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '0.775rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} />
            <span>Format: <strong>{summary.currentBackupFormat}</strong> | Schema: <strong>v{summary.currentSchemaVersion}</strong> | Checkpoint auto-saved locally.</span>
          </div>
        </div>
      </Modal>

      {/* 6. RESTORE BACKUP FILE MODAL (Phase 3 Overhaul) */}
      <Modal
        open={restoreOpen}
        title="Restore from Backup File"
        description="Check backup file, select restore method, and preview changes before restoring your data."
        onClose={() => setRestoreOpen(false)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setRestoreOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={!parsedBackup || Boolean(preview?.blockingIssues.length) || restoreModules.length === 0}
              onClick={() => setConfirmRestore(true)}
            >
              <RotateCcw size={15} /> Confirm & Restore ({restoreModules.length} Modules)
            </button>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* A. VISUAL DROPZONE & FILE SELECTOR */}
          <div style={{
            border: parsedBackup ? '2px solid #bbf7d0' : restoreFileError ? '2px solid #fca5a5' : '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: parsedBackup ? '#f0fdf4' : restoreFileError ? '#fff5f5' : '#f8fafc',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="file"
              id="restore-file-input"
              accept="application/json,.json"
              onChange={e => parseFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: parsedBackup ? '#dcfce7' : restoreFileError ? '#fee2e2' : '#e0e7ff',
                color: parsedBackup ? '#16a34a' : restoreFileError ? '#dc2626' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {parsedBackup ? <ShieldCheck size={24} /> : restoreFileError ? <AlertCircle size={24} /> : <UploadCloud size={24} />}
              </div>

              {parsedBackup ? (
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                    {uploadedFileName || 'Backup File Verified'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>
                    Backup: <strong>{parsedBackup.manifest.backupNumber}</strong> ({parsedBackup.manifest.formatVersion}) | Security Code: <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>{parsedBackup.manifest.checksum}</code>
                  </div>
                  <label htmlFor="restore-file-input" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                    Upload a different backup file
                  </label>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                    Choose a backup file (.json) to restore
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0.75rem 0' }}>
                    Compatible with dental system backup format <code style={{ fontFamily: 'monospace' }}>v1.0.0</code>
                  </p>
                  <label
                    htmlFor="restore-file-input"
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      padding: '0.4rem 1rem',
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                  >
                    <FileJson size={14} /> Browse Backup File
                  </label>
                </div>
              )}

              {restoreFileError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.775rem',
                  color: '#b91c1c',
                  width: '100%',
                  marginTop: '0.5rem'
                }}>
                  {restoreFileError}
                </div>
              )}
            </div>
          </div>

          {parsedBackup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* B. RESTORE STRATEGY SELECTION CARDS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                  Choose Restore Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {[
                    {
                      id: 'replace',
                      title: 'Replace Current Records',
                      badge: 'Recommended',
                      desc: 'Replaces selected tables with backup data. A safety backup is created automatically first.',
                      icon: RotateCcw,
                      color: '#2563eb'
                    },
                    {
                      id: 'merge_preserve',
                      title: 'Add New Records Only',
                      badge: 'Safe Append',
                      desc: 'Adds new records only. Existing records are kept unchanged.',
                      icon: CheckCircle2,
                      color: '#16a34a'
                    },
                    {
                      id: 'merge_update',
                      title: 'Update & Add All Records',
                      badge: 'Sync Overwrite',
                      desc: 'Updates existing matching records and adds new incoming records.',
                      icon: Layers,
                      color: '#7c3aed'
                    }
                  ].map(strat => {
                    const isSelected = restoreMode === strat.id;
                    const Icon = strat.icon;
                    return (
                      <div
                        key={strat.id}
                        onClick={() => setRestoreMode(strat.id as RestoreMode)}
                        style={{
                          border: isSelected ? `2px solid ${strat.color}` : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                          borderRadius: '10px',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.4rem',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Icon size={16} color={strat.color} />
                            <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>{strat.title}</span>
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? strat.color : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#64748b'
                          }}>
                            {strat.badge}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.725rem', color: '#64748b', margin: 0, lineHeight: '1.3' }}>
                          {strat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C. PER-MODULE SELECTIVE RESTORE CHECKBOXES */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Select Data Areas to Restore ({restoreModules.length}/{parsedBackup.manifest.includedModules.length})
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setRestoreModules(parsedBackup.manifest.includedModules)}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setRestoreModules([])}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.45rem',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc'
                }}>
                  {parsedBackup.manifest.includedModules.map(modKey => (
                    <label key={modKey} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.775rem', cursor: 'pointer', color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={restoreModules.includes(modKey)}
                        onChange={() => toggleRestoreModule(modKey)}
                      />
                      <span>{labels(modKey)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* D. BLOCKING ISSUES BANNER */}
              {preview?.blockingIssues && preview.blockingIssues.length > 0 && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.775rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} />
                  <span><strong>Issues to Resolve:</strong> {preview.blockingIssues.join(' ')}</span>
                </div>
              )}

              {/* E. PRE-RESTORE IMPACT MATRIX TABLE */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Recovery Summary Preview (Current Data vs. Incoming Backup)
                </div>
                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Data Module</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Existing</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Backup</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>To Add</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>To Update</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.modules.map(m => (
                        <tr key={m.module} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{m.label}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{m.existingRecordCount}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>{m.backupRecordCount}</td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>
                              +{m.recordsToAdd}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}>
                              ~{m.recordsToUpdate}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center' }}>
                            {m.warnings.length > 0 ? (
                              <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>⚠️ {m.warnings[0]}</span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>✓ Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* F. AUTO-CHECKPOINT NOTICE */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.75rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={16} />
                <span>
                  <strong>Safety Protection:</strong> A backup checkpoint will be created automatically before executing this restore.
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 7. VIEW SNAPSHOT DETAILS MODAL */}
      <Modal
        open={Boolean(viewDetailsTarget)}
        title={viewDetailsTarget?.name || 'Backup Details'}
        description={`Backup ${viewDetailsTarget?.restorePointNumber} created on ${viewDetailsTarget ? new Date(viewDetailsTarget.createdAt).toLocaleString('en-PH') : ''}`}
        onClose={() => setViewDetailsTarget(null)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto', color: '#dc2626' }}
              onClick={() => {
                const target = viewDetailsTarget;
                setViewDetailsTarget(null);
                setDeleteTarget(target);
              }}
            >
              <Trash2 size={14} /> Delete Backup
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto' }}
                onClick={() => {
                  if (viewDetailsTarget) mockBackupRestoreService.downloadBackupFile(viewDetailsTarget.payload);
                }}
              >
                <Download size={14} /> Download Backup File
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={() => {
                  if (viewDetailsTarget) {
                    setParsedBackup(viewDetailsTarget.payload);
                    setRestoreModules(viewDetailsTarget.includedModules);
                    setViewDetailsTarget(null);
                    setConfirmRestore(true);
                  }
                }}
              >
                <RotateCcw size={14} /> Restore Now
              </button>
            </div>
          </div>
        )}
      >
        {viewDetailsTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Backup Type</span>
                <strong style={{ color: '#0f172a' }}>{labels(viewDetailsTarget.type)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Storage Size</span>
                <strong style={{ color: '#0f172a' }}>{formatBytes(viewDetailsTarget.sizeBytes)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Security Stamp</span>
                <strong style={{ color: '#16a34a', fontFamily: 'monospace' }}>{viewDetailsTarget.checksum}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Included Data Areas</span>
                <strong style={{ color: '#2563eb' }}>{viewDetailsTarget.includedModules.length} Modules</strong>
              </div>
            </div>

            <div>
              <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>Module Breakdown</h5>
              <div style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.75rem'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left' }}>Module</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>Record Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(viewDetailsTarget.recordCounts || {}).map(([key, count]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.35rem 0.75rem' }}>{labels(key)}</td>
                        <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>Manifest Preview</h5>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto',
                margin: 0
              }}>
                {JSON.stringify(viewDetailsTarget.payload.manifest, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRMATION DIALOGS */}
      <ConfirmationDialog
        open={confirmRestore}
        title="Restore selected snapshot?"
        description="Existing local prototype data in selected modules will be updated. An automatic pre-restore checkpoint will be created first so you can roll back at any time."
        confirmLabel="Confirm & Apply Restore"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={executeRestore}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={`Delete Snapshot ${deleteTarget?.restorePointNumber}?`}
        description="This will remove the local snapshot checkpoint from this browser. Your current live database will NOT be affected."
        confirmLabel="Delete Snapshot"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) mockBackupRestoreService.deleteLocalRestorePoint(deleteTarget.id);
          setDeleteTarget(null);
          refresh();
          showToast('Snapshot checkpoint deleted locally.', 'success');
        }}
      />

      {/* ROLLBACK CONFIRMATION DIALOG (Phase 4) */}
      <ConfirmationDialog
        open={confirmRollbackOpen}
        title="Roll Back to Pre-Restore Checkpoint?"
        description={latestPreRestorePoint ? `This will revert all database tables back to pre-restore checkpoint ${latestPreRestorePoint.restorePointNumber} (${new Date(latestPreRestorePoint.createdAt).toLocaleString('en-PH')}). Any changes applied after this checkpoint will be safely rolled back.` : 'This will revert database state to the latest available pre-restore checkpoint.'}
        confirmLabel="Execute Rollback"
        destructive={false}
        onCancel={() => setConfirmRollbackOpen(false)}
        onConfirm={() => {
          setConfirmRollbackOpen(false);
          rollback();
        }}
      />

      {/* RESTORE HISTORY INSPECTION MODAL (Phase 4) */}
      <Modal
        open={Boolean(viewHistoryTarget)}
        title={viewHistoryTarget ? `History Event: ${viewHistoryTarget.restoreHistoryNumber}` : 'History Event Details'}
        description={viewHistoryTarget ? `Logged on ${new Date(viewHistoryTarget.createdAt).toLocaleString('en-PH')}` : ''}
        onClose={() => setViewHistoryTarget(null)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setViewHistoryTarget(null)}>
              Close Inspector
            </button>
          </div>
        )}
      >
        {viewHistoryTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Action Type</span>
                <strong style={{ color: '#0f172a' }}>{labels(viewHistoryTarget.action)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Result Status</span>
                <strong style={{ color: viewHistoryTarget.result === 'success' ? '#16a34a' : '#dc2626' }}>{labels(viewHistoryTarget.result)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Executing Actor</span>
                <strong style={{ color: '#0f172a' }}>{labels(viewHistoryTarget.actor)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Target Mode</span>
                <strong style={{ color: '#2563eb' }}>{viewHistoryTarget.mode ? labels(viewHistoryTarget.mode) : 'Standard'}</strong>
              </div>
            </div>

            <div>
              <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>Event Summary</h5>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#1e293b' }}>
                {viewHistoryTarget.summary}
              </div>
            </div>

            <div>
              <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>Affected System Modules ({viewHistoryTarget.modules.length})</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {viewHistoryTarget.modules.map(modKey => (
                  <span key={modKey} style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.725rem', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                    {labels(modKey)}
                  </span>
                ))}
              </div>
            </div>

            {viewHistoryTarget.warnings && viewHistoryTarget.warnings.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#b45309', margin: '0 0 0.35rem 0' }}>Logged Warnings & Audit Traces</h5>
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.75rem', color: '#92400e' }}>
                  {viewHistoryTarget.warnings.join(' | ')}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* PROTOTYPE RESET MODAL */}
      <Modal
        open={resetOpen}
        title="Reset Prototype Mock Database"
        description="A pre-reset checkpoint will be created automatically before clearing live tables. Type RESET MOCK DATA below to proceed."
        onClose={() => setResetOpen(false)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setResetOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              style={{ width: 'auto' }}
              disabled={resetText !== 'RESET MOCK DATA'}
              onClick={reset}
            >
              Reset Mock Data
            </button>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.825rem', color: '#b91c1c', margin: 0, fontWeight: 600 }}>
            ⚠️ Caution: This will re-seed all clinics, users, subscribers, patients, and audit ledgers to fresh baseline state.
          </p>
          <input
            type="text"
            className="form-input"
            value={resetText}
            onChange={e => setResetText(e.target.value)}
            placeholder="RESET MOCK DATA"
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </div>
      </Modal>
    </main>
  );
}
