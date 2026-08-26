import type { BranchScopeOption, PeakHourDataPoint, TopServiceDataPoint, VolumeDataPoint } from './clinicAnalytics';
import type { ServiceCategoryRevenue } from './salesOverview';

export interface DailyOperationalKpiData {
  patientsAttendedToday: number;
  completedTreatments: number;
  inTreatmentCount: number;
  cancelledNoShowsCount: number;
  grossDayCollections: number;
  netDayDeposit: number;
  openLabCasesDueToday: number;
  activeDentistsOnDuty: number;
  activeStaffOnDuty: number;
}

export interface DailyPettyCashExpense {
  id: string;
  time: string;
  category: string; // e.g. "Sterilization Supplies", "Petty Cash", "Refreshments"
  description: string;
  amount: number;
  recordedBy: string;
}

export interface CashDrawerReconciliationData {
  cashInDrawer: number;
  digitalGcashMaya: number;
  digitalPosCards: number;
  directBankHmo: number;
  grossCollections: number;
  pettyCashExpensesTotal: number;
  netCashForDeposit: number;
  expenses: DailyPettyCashExpense[];
}

export interface DailyDentistOutputItem {
  dentistId: string;
  dentistName: string;
  designation: string;
  avatarColor: string;
  patientsAttended: number;
  proceduresSummary: string; // e.g. "3 Cleanings, 2 Braces, 1 Extraction"
  revenueGenerated: number;
  status: 'ACTIVE_DUTY' | 'COMPLETED_SHIFT';
}

export interface DailyStaffAttendanceItem {
  staffId: string;
  staffName: string;
  role: string;
  timeIn: string;
  timeOut: string;
  status: 'PRESENT' | 'ON_LEAVE' | 'HALF_DAY';
}

export interface DailyLabDispatchItem {
  orderId: string;
  patientName: string;
  labName: string;
  itemType: string; // e.g. "Zirconia Crown", "Porcelain Jacket", "Full Dentures"
  direction: 'DISPATCHED_TO_LAB' | 'RECEIVED_FROM_LAB';
  status: 'DELIVERED' | 'IN_TRANSIT' | 'PROCESSING';
  time: string;
}

export interface DailyReportsDataset {
  selectedDate: string;
  formattedDateString: string;
  scope: BranchScopeOption;
  availableBranches: BranchScopeOption[];
  kpis: DailyOperationalKpiData;
  reconciliation: CashDrawerReconciliationData;
  dentistOutputs: DailyDentistOutputItem[];
  staffAttendance: DailyStaffAttendanceItem[];
  labDispatches: DailyLabDispatchItem[];
  volumeTrend: VolumeDataPoint[];
  peakHours: PeakHourDataPoint[];
  topServices: TopServiceDataPoint[];
  categoryRevenue: ServiceCategoryRevenue[];
}
