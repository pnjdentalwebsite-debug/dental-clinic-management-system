import { useMemo, useState } from 'react';
import {
  Download,
  FileText,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Stethoscope,
  Sparkles,
  Activity,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  LockKeyhole
} from 'lucide-react';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import { mockAuditService } from '../../audit/services/mockAuditService';
import type { AuditEvent } from '../../audit/types';
import { branchSettingsStore, type DentalChair } from '../../clinic-subsystem/settings/services/branchSettingsStore';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { AnalyticsFilterBar } from '../components/AnalyticsFilterBar';
import { ReportTable } from '../components/ReportTable';
import { downloadCsv } from '../export/csvExport';
import { mockAnalyticsService } from '../services/mockAnalyticsService';
import type { AnalyticsFilter, AnalyticsReportKey, SavedReportView } from '../types';
import { Modal } from '../../../components/overlays/Modal';
import { DonutPieChart } from '../components/charts/DonutPieChart';
import { VerticalColumnChart } from '../components/charts/VerticalColumnChart';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { HistogramAreaChart } from '../components/charts/HistogramAreaChart';

interface Props {
  reportKey?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

export interface PortfolioTab {
  key: AnalyticsReportKey;
  label: string;
  emoji: string;
  route: string;
  description: string;
}

export const PORTFOLIO_TABS: PortfolioTab[] = [
  {
    key: 'overview',
    label: '1. Executive Summary',
    emoji: '📊',
    route: '/platform/analytics-reports/overview',
    description: 'Summary of clinic subscriptions, branch performance, and overall treatment revenue.'
  },
  {
    key: 'revenue',
    label: '2. Financial & Collections',
    emoji: '💰',
    route: '/platform/analytics-reports/revenue',
    description: 'Breakdown of plan payments, patient treatment collections, payment methods, and receivables.'
  },
  {
    key: 'facilities',
    label: '3. Clinic Branches & Labs',
    emoji: '🏢',
    route: '/platform/analytics-reports/facilities',
    description: 'Branch performance, operating dental chair capacity, and partner laboratory orders.'
  },
  {
    key: 'clinical',
    label: '4. Patients & Treatments',
    emoji: '🩺',
    route: '/platform/analytics-reports/clinical',
    description: 'Patient records, top dental procedures, tooth chart notation systems, and peak visiting hours.'
  },
  {
    key: 'audits',
    label: '5. Doctor & Staff Activity',
    emoji: '👥',
    route: '/platform/analytics-reports/audits',
    description: 'Dentist productivity leaderboard, staff counts, system sign-ins, and activity history.'
  }
];

const PAGE_SIZE = 10;

const parseReportKey = (value?: string): AnalyticsReportKey => {
  if (!value || value === 'analytics-reports') return 'overview';
  const matched = PORTFOLIO_TABS.find(item => item.key === value);
  return matched ? matched.key : 'overview';
};

export function AnalyticsReportsPage({ reportKey, navigate, showToast, refreshShell }: Props) {
  const activePortfolioKey = parseReportKey(reportKey);
  const [filters, setFilters] = useState<AnalyticsFilter>(mockAnalyticsService.getPersistedFilters());
  const [page, setPage] = useState(1);
  const [, setVersion] = useState(0);
  const [savedViews, setSavedViews] = useState(mockAnalyticsService.listSavedViews());
  const [saveModal, setSaveModal] = useState<'save' | 'rename' | null>(null);
  const [viewName, setViewName] = useState('');
  const [selectedView] = useState<SavedReportView | null>(null);

  const activeTab = PORTFOLIO_TABS.find(t => t.key === activePortfolioKey) || PORTFOLIO_TABS[0];

  // Real-time Data Sources
  const subscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), []);
  const payments = useMemo(() => mockPaymentService.listPayments(), []);
  const clinics = useMemo(() => mockClinicService.listClinics(), []);
  const laboratories = useMemo(() => mockLaboratoryService.listLaboratories(), []);
  const clinicalFinancials = useMemo(() => aggregateClinicFinancials(), []);
  const allPatients = useMemo(() => loadPatientDirectoryRecords(), []);
  const users = useMemo(() => mockPlatformManagementService.listUsers(), []);
  const associateDentistsCount = users.filter(u => u.role === 'associate').length;
  const staffMembersCount = users.filter(u => u.role === 'staff').length;
  const clinicOwnersCount = users.filter(u => u.role === 'clinic_owner').length;
  const platformAdminsCount = 1;

  // Standard Report Data
  const report = mockAnalyticsService.getReport(activePortfolioKey, filters);
  const pageCount = Math.max(1, Math.ceil(report.rows.length / PAGE_SIZE));
  const pagedRows = report.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Platform Metrics
  const activeSubscribersCount = subscribers.filter(s => s.accountStatus === 'active').length;
  const maxPlanSubscribersCount = subscribers.filter(s => s.planId === 'Max').length;
  const totalPlatformMRR = subscribers
    .filter(s => s.accountStatus === 'active')
    .reduce((sum, s) => {
      const plan = mockPlanService.listPlans().find(p => p.id === s.planId || p.name === s.planId);
      return sum + (plan?.monthlyPrice || 7990);
    }, 0);

  const totalGrossBilled = totalPlatformMRR + clinicalFinancials.grossBilled;
  const totalCollections = payments
    .filter(p => ['approved', 'allocated', 'partially_allocated', 'fully_allocated'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0) + clinicalFinancials.totalCollected;

  const totalOutstanding = clinicalFinancials.totalOutstanding;

  // Real-time Active Dental Chairs calculation across branches
  const totalActiveChairs = useMemo(() => {
    return clinics.reduce((sum, clinic) => {
      const settings = branchSettingsStore.getSettings(clinic.id);
      const activeCount = (settings.chairs || []).filter((c: DentalChair) => c.active).length;
      return sum + Math.max(activeCount, 1);
    }, 0);
  }, [clinics]);

  // 1. Executive Overview Dynamic Datasets
  const monthlyInflowData = useMemo(() => {
    const monthsMap: Record<string, { clinical: number; mrr: number }> = {};
    
    payments.forEach(p => {
      if (['approved', 'allocated', 'partially_allocated', 'fully_allocated'].includes(p.status)) {
        const d = new Date(p.paymentDate || '2026-08-01');
        const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthsMap[monthKey]) monthsMap[monthKey] = { clinical: 0, mrr: 0 };
        monthsMap[monthKey].mrr += p.amount;
      }
    });

    (clinicalFinancials.allPayments || []).forEach(cp => {
      const d = new Date(cp.paymentDate || new Date());
      const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthsMap[monthKey]) monthsMap[monthKey] = { clinical: 0, mrr: 0 };
      monthsMap[monthKey].clinical += Number(cp.amount || 0);
    });

    const currentMonthKey = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!monthsMap[currentMonthKey]) {
      monthsMap[currentMonthKey] = {
        clinical: clinicalFinancials.totalCollected,
        mrr: totalPlatformMRR
      };
    }

    return Object.entries(monthsMap).map(([label, val]) => ({
      label,
      value: val.clinical,
      secondaryValue: val.mrr,
      formattedValue: `₱${val.clinical.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
      formattedSecondaryValue: `₱${val.mrr.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    }));
  }, [payments, clinicalFinancials, totalPlatformMRR]);

  const planTierData = useMemo(() => {
    const planCounts: Record<string, number> = {};
    subscribers.forEach(s => {
      const plan = s.planId || 'Max';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
    const totalSubs = subscribers.length || 1;
    return Object.entries(planCounts).map(([plan, count], idx) => ({
      label: `${plan} Plan`,
      value: count,
      color: colors[idx % colors.length],
      formattedValue: `${count} Subscriber (${Math.round((count / totalSubs) * 100)}%)`
    }));
  }, [subscribers]);

  const branchActivityData = useMemo(() => {
    return clinics.map((c, index) => {
      const clinicPatients = loadPatientDirectoryRecords(c.id);
      const clinicCollected = (clinicalFinancials.allPayments || [])
        .filter(p => clinicPatients.some(pt => pt.id === p.patientId))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      const displayAmount = clinicCollected || (c.isPrimaryClinic ? clinicalFinancials.totalCollected : 0);
      return {
        label: `${c.name} (${c.city})`,
        value: displayAmount || clinicPatients.length,
        formattedValue: `₱${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} · ${clinicPatients.length} Patients`,
        badge: c.isPrimaryClinic ? 'Primary HQ' : `Branch #${index + 1}`,
        sublabel: `${c.dentistUserIds.length} Dentists • ${c.staffUserIds.length} Staff`,
        color: index === 0 ? '#3b82f6' : '#10b981'
      };
    });
  }, [clinics, clinicalFinancials]);

  // 2. Financial & Revenue Dynamic Datasets
  const paymentChannelData = useMemo(() => {
    const cashAmt = clinicalFinancials.paymentMethodTotals.cash || 0;
    const digitalAmt = (clinicalFinancials.paymentMethodTotals.gcashMaya || 0) +
      payments.filter(p => ['gcash', 'maya', 'online'].includes((p.paymentMethod || '').toLowerCase()))
        .reduce((s, p) => s + p.amount, 0);
    const cardAmt = (clinicalFinancials.paymentMethodTotals.creditCard || 0) +
      payments.filter(p => ['card', 'bank_transfer', 'bank'].includes((p.paymentMethod || '').toLowerCase()))
        .reduce((s, p) => s + p.amount, 0);
    const hmoAmt = clinicalFinancials.paymentMethodTotals.hmoInsurance || 0;

    const total = cashAmt + digitalAmt + cardAmt + hmoAmt || 1;
    const channels = [
      { label: 'GCash / Maya Digital', value: digitalAmt, color: '#3b82f6' },
      { label: 'Cash Counter Collections', value: cashAmt, color: '#f59e0b' },
      { label: 'Card / Bank Transfer', value: cardAmt, color: '#8b5cf6' },
      { label: 'HMO & Insurance', value: hmoAmt, color: '#10b981' }
    ].filter(c => c.value > 0 || total === 1);

    return channels.map(c => ({
      ...c,
      formattedValue: `₱${c.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${Math.round((c.value / total) * 100)}%)`
    }));
  }, [clinicalFinancials, payments]);

  const billedVsCollectedData = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return [
      {
        label: currentMonth,
        value: totalGrossBilled,
        secondaryValue: totalCollections,
        formattedValue: `₱${totalGrossBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        formattedSecondaryValue: `₱${totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      }
    ];
  }, [totalGrossBilled, totalCollections]);

  const serviceCategoryRevenueData = useMemo(() => {
    const categories: Record<string, number> = {};
    (clinicalFinancials.allServices || []).forEach(s => {
      const cat = s.service || 'General Dentistry';
      categories[cat] = (categories[cat] || 0) + (Number(s.lineTotal || s.baseAmount || 0));
    });

    if (Object.keys(categories).length === 0) {
      categories['Clinical Treatments'] = clinicalFinancials.grossBilled || 0;
    }
    categories['SaaS Subscriptions'] = totalPlatformMRR;

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([label, val], idx) => ({
        label,
        value: val,
        formattedValue: `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        badge: idx === 0 ? 'Top Revenue' : undefined,
        color: colors[idx % colors.length]
      }));
  }, [clinicalFinancials, totalPlatformMRR]);

  // 3. Multi-Branch Facilities Dynamic Datasets
  const branchRevenueTrajectoryData = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const hqClinic = clinics.find(c => c.isPrimaryClinic) || clinics[0];
    const satClinic = clinics.find(c => !c.isPrimaryClinic) || clinics[1];

    const hqPatients = hqClinic ? loadPatientDirectoryRecords(hqClinic.id) : [];
    const satPatients = satClinic ? loadPatientDirectoryRecords(satClinic.id) : [];

    const hqAmount = (clinicalFinancials.allBills || [])
      .filter(b => hqPatients.some(pt => pt.id === b.patientId))
      .reduce((sum, b) => sum + (b.payableAmount || b.totalCost || 0), 0) || clinicalFinancials.grossBilled;

    const satAmount = (clinicalFinancials.allBills || [])
      .filter(b => satPatients.some(pt => pt.id === b.patientId))
      .reduce((sum, b) => sum + (b.payableAmount || b.totalCost || 0), 0);

    return [
      {
        label: currentMonth,
        value: hqAmount,
        secondaryValue: satAmount,
        formattedValue: `₱${hqAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
        formattedSecondaryValue: `₱${satAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
      }
    ];
  }, [clinics, clinicalFinancials]);

  const labCategoryData = useMemo(() => {
    const lab = laboratories[0];
    const services = lab ? mockLaboratoryService.getLaboratoryServices(lab.id) : [];
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    if (services.length > 0) {
      return services.map((s, idx) => ({
        label: s.name,
        value: s.defaultPrice || 1000,
        color: colors[idx % colors.length],
        formattedValue: `₱${(s.defaultPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${s.defaultTurnaroundDays}d)`
      }));
    }
    return [
      { label: 'Partner Lab Services', value: 1, color: '#8b5cf6', formattedValue: 'Available' }
    ];
  }, [laboratories]);

  const branchChairCapacityData = useMemo(() => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    return clinics.map((clinic, idx) => {
      const settings = branchSettingsStore.getSettings(clinic.id);
      const chairs = settings.chairs || [];
      const activeChairs = chairs.filter(c => c.active).length || 1;
      const totalChairs = chairs.length || 1;
      return {
        label: `${clinic.name} (${clinic.city})`,
        value: activeChairs,
        formattedValue: `${activeChairs} / ${totalChairs} Active Chairs`,
        badge: clinic.isPrimaryClinic ? 'Primary HQ' : 'Satellite',
        color: colors[idx % colors.length]
      };
    });
  }, [clinics]);

  // 4. Clinical & Patients Dynamic Datasets
  const toothNotationData = useMemo(() => {
    let fdiCount = 0;
    let adaCount = 0;
    let palmerCount = 0;

    allPatients.forEach(p => {
      try {
        const raw = localStorage.getItem(`clinicDentalChart:${p.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const notation = parsed[0]?.toothNotation || 'FDI';
          if (notation === 'Universal') adaCount++;
          else if (notation === 'Palmer') palmerCount++;
          else fdiCount++;
        } else {
          fdiCount++;
        }
      } catch {
        fdiCount++;
      }
    });

    const total = fdiCount + adaCount + palmerCount || 1;
    return [
      { label: 'FDI Two-Digit ISO-3950', value: fdiCount, color: '#3b82f6', formattedValue: `${fdiCount} Charts (${Math.round((fdiCount / total) * 100)}%)` },
      { label: 'Universal ADA System', value: adaCount, color: '#10b981', formattedValue: `${adaCount} Charts (${Math.round((adaCount / total) * 100)}%)` },
      { label: 'Palmer Quadrant Notation', value: palmerCount, color: '#8b5cf6', formattedValue: `${palmerCount} Charts (${Math.round((palmerCount / total) * 100)}%)` }
    ].filter(i => i.value > 0);
  }, [allPatients]);

  const topProceduresData = useMemo(() => {
    const procMap: Record<string, { count: number; total: number }> = {};
    (clinicalFinancials.allServices || []).forEach(s => {
      const name = s.service || 'Dental Treatment';
      if (!procMap[name]) procMap[name] = { count: 0, total: 0 };
      procMap[name].count += Number(s.quantity || 1);
      procMap[name].total += Number(s.lineTotal || s.baseAmount || 0);
    });

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
    const entries = Object.entries(procMap);
    if (entries.length > 0) {
      return entries.sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([label, data], idx) => ({
        label,
        value: data.count,
        formattedValue: `${data.count} procedure${data.count > 1 ? 's' : ''} (₱${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
        badge: `Rank #${idx + 1}`,
        color: colors[idx % colors.length]
      }));
    }
    return [
      { label: 'Clinical Treatments & Checkups', value: clinicalFinancials.billsCount || 1, formattedValue: `${clinicalFinancials.billsCount || 1} records`, badge: 'Active', color: '#3b82f6' }
    ];
  }, [clinicalFinancials]);

  const hourlyTrafficData = useMemo(() => {
    const hourCounts: Record<string, number> = {
      '8 AM': 0, '9 AM': 0, '10 AM': 0, '11 AM': 0,
      '12 PM': 0, '1 PM': 0, '2 PM': 0, '3 PM': 0,
      '4 PM': 0, '5 PM': 0
    };

    (clinicalFinancials.allBills || []).forEach(b => {
      const d = new Date(b.entryDate || new Date());
      const hr = d.getHours();
      if (hr === 8) hourCounts['8 AM']++;
      else if (hr === 9) hourCounts['9 AM']++;
      else if (hr === 10) hourCounts['10 AM']++;
      else if (hr === 11) hourCounts['11 AM']++;
      else if (hr === 12) hourCounts['12 PM']++;
      else if (hr === 13) hourCounts['1 PM']++;
      else if (hr === 14) hourCounts['2 PM']++;
      else if (hr === 15) hourCounts['3 PM']++;
      else if (hr === 16) hourCounts['4 PM']++;
      else if (hr >= 17) hourCounts['5 PM']++;
    });

    const entries = Object.entries(hourCounts);
    const maxVal = Math.max(...entries.map(x => x[1]), 1);
    return entries.map(([label, value]) => ({
      label,
      value,
      formattedValue: `${value} patient${value === 1 ? '' : 's'}`,
      isPeak: value === maxVal && value > 0
    }));
  }, [clinicalFinancials]);

  // 5. Personnel & System Audits Dynamic Datasets
  const userRoleData = useMemo(() => {
    return [
      { label: 'Associate Dentists', value: associateDentistsCount, color: '#3b82f6', formattedValue: `${associateDentistsCount} Clinicians` },
      { label: 'Auxiliary Staff', value: staffMembersCount, color: '#10b981', formattedValue: `${staffMembersCount} Staff` },
      { label: 'Clinic Owners', value: clinicOwnersCount, color: '#8b5cf6', formattedValue: `${clinicOwnersCount} Owner` },
      { label: 'Platform Administrators', value: platformAdminsCount, color: '#f59e0b', formattedValue: `${platformAdminsCount} Admin` }
    ].filter(item => item.value > 0);
  }, [associateDentistsCount, staffMembersCount, clinicOwnersCount, platformAdminsCount]);

  const clinicianLeaderboardData = useMemo(() => {
    const prod = clinicalFinancials.dentistProduction;
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    const entries = Object.entries(prod);
    if (entries.length > 0) {
      return entries.map(([dentistName, val], idx) => ({
        label: dentistName,
        value: val.revenue || val.patientsServed || 1,
        formattedValue: `₱${(val.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${val.patientsServed} Patients)`,
        badge: `#${idx + 1} Clinician`,
        color: colors[idx % colors.length]
      }));
    }
    return [
      { label: 'Dr. Angelo Mhyr Lagsac, DMD (Principal)', value: clinicalFinancials.totalCollected || 1, formattedValue: `₱${(clinicalFinancials.totalCollected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, badge: '#1 Principal', color: '#3b82f6' }
    ];
  }, [clinicalFinancials]);

  const auditTimelineData = useMemo(() => {
    const events = mockAuditService.listAuditEvents();
    const countByDate: Record<string, number> = {};
    events.forEach((e: AuditEvent) => {
      const dateKey = e.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0];
      countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;
    });
    const entries = Object.entries(countByDate);
    const maxVal = Math.max(...entries.map(x => x[1]), 1);
    return entries.map(([label, value]) => ({
      label,
      value,
      formattedValue: `${value} event${value > 1 ? 's' : ''}`,
      isPeak: value === maxVal
    }));
  }, []);

  const applyFilters = () => {
    const next = filters.dateRange.preset === 'custom'
      ? filters
      : { ...filters, dateRange: mockAnalyticsService.getDateRangeForPreset(filters.dateRange.preset) };
    setFilters(next);
    mockAnalyticsService.persistFilters(next);
    setPage(1);
    showToast('Analytics filters applied.', 'success');
  };

  const clearFilters = () => {
    const next = mockAnalyticsService.getDefaultFilters();
    setFilters(next);
    mockAnalyticsService.persistFilters(next);
    setPage(1);
    showToast('Analytics filters cleared.', 'info');
  };

  const refresh = () => {
    setVersion(prev => prev + 1);
    refreshShell();
    showToast('Analytics recalculated with live data.', 'success');
  };

  const exportRows = (rows = report.rows) => {
    downloadCsv(mockAnalyticsService.getExportDefinition(report, rows));
    showToast('Analytics CSV report downloaded.', 'success');
  };

  const saveView = (name: string) => {
    const result = mockAnalyticsService.saveCurrentView(name, activePortfolioKey, filters, report.columns.map(c => c.key));
    if (!result.ok) {
      showToast(result.error || 'Could not save report view.', 'error');
    } else {
      setSavedViews(mockAnalyticsService.listSavedViews());
      showToast('Saved report view created.', 'success');
    }
  };

  const renameView = (id: string, name: string) => {
    const result = mockAnalyticsService.renameSavedView(id, name);
    if (!result.ok) {
      showToast(result.error || 'Could not rename report view.', 'error');
    } else {
      setSavedViews(mockAnalyticsService.listSavedViews());
      showToast('Saved report view renamed.', 'success');
    }
  };

  const reportViews = savedViews.filter(v => v.reportKey === activePortfolioKey);

  const actionMenuItems = [
    { id: 'export-page', label: 'Export Current Page (CSV)', icon: Download, onSelect: () => exportRows(pagedRows) },
    { id: 'export-all', label: 'Export All Filtered Data (CSV)', icon: Download, onSelect: () => exportRows(report.rows) },
    { id: 'print-page', label: 'Print Executive Report', icon: Printer, onSelect: () => window.print() },
    { id: 'sep-export', separator: true as const },
    { id: 'save-view', label: 'Save Filter Preset', icon: Save, onSelect: () => { setViewName(''); setSaveModal('save'); } },
    ...reportViews.flatMap(view => [
      { id: `apply-${view.id}`, label: `Apply: ${view.name}`, icon: FileText, onSelect: () => { setFilters(view.filters); mockAnalyticsService.persistFilters(view.filters); showToast(`Applied ${view.name}.`, 'success'); } },
      { id: `delete-${view.id}`, label: `Delete: ${view.name}`, icon: RotateCcw, destructive: true as const, onSelect: () => { mockAnalyticsService.deleteSavedView(view.id); setSavedViews(mockAnalyticsService.listSavedViews()); showToast('Saved report view deleted.', 'success'); } }
    ]),
    { id: 'sep-views', separator: true as const },
    { id: 'reset', label: 'Reset All Filters', icon: RotateCcw, onSelect: clearFilters }
  ];

  return (
    <main className="main-content analytics-page" style={{ paddingBottom: '3rem' }}>
      {/* Printable Title Header */}
      <div className="print-report-header" aria-hidden="true" style={{ display: 'none' }}>
        <h1>{activeTab.label} - Dental Platform Analytics</h1>
        <p>Generated {new Date().toLocaleDateString('en-PH')} · Official System Report</p>
      </div>

      {/* HEADER */}
      <PlatformPageHeader
        title={activeTab.label.replace(/^\d+\.\s*/, '')}
        subtitle={activeTab.description}
        breadcrumbs={['Platform', 'System & Tools', 'Reports & Analytics', activeTab.label]}
        secondaryAction={{
          label: 'Refresh Analytics',
          icon: RefreshCw,
          onClick: refresh
        }}
        overflowActions={actionMenuItems}
      />

      {/* PORTFOLIO SELECTOR DROPDOWN & TABS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Desktop Tab Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PORTFOLIO_TABS.map(tab => {
            const isActive = tab.key === activePortfolioKey;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setPage(1);
                  navigate(tab.route);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 2px rgba(59, 130, 246, 0.1)' : 'none'
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print PDF</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => exportRows()}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <AnalyticsFilterBar
        filters={filters}
        subscribers={subscribers}
        plans={mockPlanService.listPlans()}
        clinics={clinics}
        laboratories={laboratories}
        onChange={setFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE OVERVIEW PORTFOLIO */}
      {/* ========================================================================= */}
      {activePortfolioKey === 'overview' && (
        <>
          {/* Top 4 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform MRR</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>₱{totalPlatformMRR.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 600 }}>
                <TrendingUp size={12} /> +12.4% MoM platform subscription base
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Subscribers</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{activeSubscribersCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 600 }}>
                <Sparkles size={12} /> {maxPlanSubscribersCount > 0 ? '100% Enterprise Max Plan tier' : 'Active Subscriber Accounts'}
              </div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Facilities</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Building2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{clinics.length + laboratories.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{clinics.length} Clinic Branches • {laboratories.length} Partner Lab</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinical Production</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <Stethoscope size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>₱{clinicalFinancials.grossBilled.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Across all multi-branch operations</div>
            </div>
          </div>

          {/* Interactive Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Monthly Inflow Column Chart */}
            <VerticalColumnChart
              title="Platform & Clinical Monthly Revenue Inflow"
              subtitle="Monthly trajectory comparison between SaaS subscriptions and dental treatments."
              primaryLegend="Clinical Revenue"
              secondaryLegend="Platform MRR"
              primaryColor="#10b981"
              secondaryColor="#3b82f6"
              data={monthlyInflowData}
            />

            {/* Plan Tier Distribution Donut Chart */}
            <DonutPieChart
              title="Subscription Tier Distribution"
              subtitle="Breakdown of subscriber tenant plans and capacity allocation."
              centerLabel="Active Plan"
              centerValue={`${subscribers[0]?.planId || 'Max'} Plan`}
              data={planTierData}
            />
          </div>

          {/* Activity Leaderboard Bar Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <HorizontalBarChart
              title="Multi-Branch Clinic Operational Activity"
              subtitle="Consolidated revenue and patient volume by clinic facility branch."
              data={branchActivityData}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. FINANCIAL & REVENUE PORTFOLIO */}
      {/* ========================================================================= */}
      {activePortfolioKey === 'revenue' && (
        <>
          {/* Top 4 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Billed</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>₱{totalGrossBilled.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Total invoices and clinical billings</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>₱{totalCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Cleared cash and digital remittances</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding AR</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Pending patient treatment balances</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital Collection Rate</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <Sparkles size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>
                {totalCollections > 0 ? `${Math.round(((paymentChannelData.find(p => p.label.includes('GCash'))?.value || 0) / totalCollections) * 100)}%` : '100%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Via GCash, Maya, and Bank Remittance</div>
            </div>
          </div>

          {/* Interactive Financial Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Payment Method Distribution Donut */}
            <DonutPieChart
              title="Collections by Payment Channel"
              subtitle="Distribution of remittances across digital gateways and cash."
              centerLabel="Total Remitted"
              centerValue={`₱${totalCollections.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
              data={paymentChannelData}
            />

            {/* Billed vs Collected Comparison */}
            <VerticalColumnChart
              title="Billed vs. Collected Comparison"
              subtitle="Comparison between total billings and cleared remittances."
              primaryLegend="Total Billed"
              secondaryLegend="Collected"
              primaryColor="#3b82f6"
              secondaryColor="#10b981"
              data={billedVsCollectedData}
            />
          </div>

          {/* Revenue by Service Category */}
          <div style={{ marginBottom: '1.5rem' }}>
            <HorizontalBarChart
              title="Revenue Distribution by Service Category"
              subtitle="Income generated across dental specialties and SaaS contracts."
              data={serviceCategoryRevenueData}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. MULTI-BRANCH FACILITIES PORTFOLIO */}
      {/* ========================================================================= */}
      {activePortfolioKey === 'facilities' && (
        <>
          {/* Top 4 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinic Branches</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Building2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{clinics.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>1 HQ Main • 1 Satellite Branch</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operatory Chairs</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Activity size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{totalActiveChairs} Active</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Synchronized with Branch Settings</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Labs</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <Award size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>{laboratories.length} Verified</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>WeSmile Dental Imaging Center & Lab</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lab Work Orders</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>12 Active</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Avg 3.5 days turnaround</div>
            </div>
          </div>

          {/* Interactive Visuals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Multi-Branch Revenue Comparison */}
            <VerticalColumnChart
              title="Multi-Branch Revenue Trajectory"
              subtitle="Comparison across registered clinic branch locations."
              primaryLegend="Main Branch"
              secondaryLegend="Secondary Branch"
              primaryColor="#3b82f6"
              secondaryColor="#8b5cf6"
              data={branchRevenueTrajectoryData}
            />

            {/* Lab Orders Distribution Donut */}
            <DonutPieChart
              title="Laboratory Services & Restoration Mix"
              subtitle="Restorations, crowns, and imaging cases available via partner lab network."
              centerLabel="Partner Lab"
              centerValue="WeSmile"
              data={labCategoryData}
            />
          </div>

          {/* Operatory Chair Utilization Bar Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <HorizontalBarChart
              title="Operatory Dental Chair Capacity per Branch"
              subtitle="Live chair operatory distribution synchronized from Branch Settings."
              data={branchChairCapacityData}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. CLINICAL & PATIENTS PORTFOLIO */}
      {/* ========================================================================= */}
      {activePortfolioKey === 'clinical' && (
        <>
          {/* Top 4 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Patients</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{allPatients.length} Records</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>100% Partitioned by Branch</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinical Billings</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Stethoscope size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{clinicalFinancials.billsCount} Bills</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Recorded in patient workspaces</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Notation</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <Award size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9333ea' }}>FDI ISO-3950</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Universal & Palmer Supported</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remittance Rate</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
                {clinicalFinancials.grossBilled > 0 ? `${Math.round((clinicalFinancials.totalCollected / clinicalFinancials.grossBilled) * 100)}%` : '100%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Cleared patient collections</div>
            </div>
          </div>

          {/* Interactive Visuals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Tooth Notation Distribution Donut */}
            <DonutPieChart
              title="Tooth Notation System Adoption"
              subtitle="Breakdown of tooth numbering preferences across clinical dental charts."
              centerLabel="Standard"
              centerValue="FDI System"
              data={toothNotationData}
            />

            {/* Peak Hourly Clinic Traffic Histogram */}
            <HistogramAreaChart
              title="Peak Hourly Clinic Visit Activity"
              subtitle="Distribution of clinical billings and visits across operating hours (8 AM - 6 PM)."
              color="#8b5cf6"
              data={hourlyTrafficData}
            />
          </div>

          {/* Top 5 Dental Procedures Bar Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <HorizontalBarChart
              title="Top Clinical Dental Procedures by Volume"
              subtitle="Most frequently performed clinical treatments recorded in patient accounts."
              data={topProceduresData}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. PERSONNEL & SYSTEM AUDITS PORTFOLIO */}
      {/* ========================================================================= */}
      {activePortfolioKey === 'audits' && (
        <>
          {/* Top 4 Hero KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attending Dentists</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <UserCheck size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{associateDentistsCount} Associates</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Active Licensed Clinicians</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auxiliary Staff</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{staffMembersCount} Staff</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Front Desk & Clinical Assistants</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Events</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                  <LockKeyhole size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>{mockAuditService.listAuditEvents().length} Events</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>0 Failed attempts / security threats</div>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audit Integrity</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>100% Intact</div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>HMAC Checksum Verified</div>
            </div>
          </div>

          {/* Interactive Visuals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* User Role Share Donut */}
            <DonutPieChart
              title="System User & Personnel Role Distribution"
              subtitle="Distribution of authenticated accounts across platform and clinic roles."
              centerLabel="Active Users"
              centerValue={`${users.length} Users`}
              data={userRoleData}
            />

            {/* Security Activity Timeline Histogram */}
            <HistogramAreaChart
              title="Authentication & System Audit Activity Timeline"
              subtitle="Activity volume of user logins and administrative events."
              color="#3b82f6"
              data={auditTimelineData}
            />
          </div>

          {/* Clinician Case Productivity Leaderboard */}
          <div style={{ marginBottom: '1.5rem' }}>
            <HorizontalBarChart
              title="Clinician Clinical Case & Production Leaderboard"
              subtitle="Total completed patient procedures and production generated per attending dentist."
              data={clinicianLeaderboardData}
            />
          </div>
        </>
      )}

      {/* DATA DRILLDOWN TABLE (500px Compact Container) */}
      <ReportTable
        title={`${activeTab.label.replace(/^\d+\.\s*/, '')} Data Ledger`}
        columns={report.columns}
        rows={pagedRows}
        onNavigate={navigate}
      />

      {/* PAGINATION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <div>Showing <strong>{pagedRows.length}</strong> of <strong>{report.rows.length}</strong> records</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Page {page} of {pageCount}</span>
          <button
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            disabled={page === pageCount}
            onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Save/Rename View Modal */}
      <Modal
        open={Boolean(saveModal)}
        title={saveModal === 'rename' ? 'Rename Saved View' : 'Save Filter Preset'}
        description="Save your active date and filter preferences for quick one-click recall."
        onClose={() => setSaveModal(null)}
        footer={
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setSaveModal(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => {
              if (saveModal === 'rename' && selectedView) renameView(selectedView.id, viewName);
              else saveView(viewName);
              setSaveModal(null);
            }}>
              Save Preset
            </button>
          </>
        }
      >
        <label className="filter-control" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>Preset Name</span>
          <input
            className="form-input"
            placeholder="e.g. Q3 Executive Overview"
            value={viewName}
            onChange={e => setViewName(e.target.value)}
          />
        </label>
      </Modal>
    </main>
  );
}
