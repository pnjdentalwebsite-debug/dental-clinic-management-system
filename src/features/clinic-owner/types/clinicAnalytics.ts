export type TimeRangeOption = 'day' | 'week' | 'month' | 'year';

export interface BranchScopeOption {
  id: string;
  name: string;
  code: string;
  location?: string;
  isMain?: boolean;
}

export interface BranchResourceSnapshot {
  branchId: string;
  branchName: string;
  branchCode: string;
  dentistCount: number;
  staffCount: number;
  labCount: number;
  activeChairs: number;
}

export interface AnalyticsKpiData {
  totalVisits: number;
  totalVisitsGrowth: string;
  appointmentCount: number;
  walkInCount: number;
  appointmentRatio: number; // e.g. 68 for 68%
  walkInRatio: number; // e.g. 32 for 32%
  busiestDay: string;
  busiestDayAvg: number;
  retentionRate: number; // e.g. 84 for 84%
  newPatientsCount: number;
  returningPatientsCount: number;
}

export interface VolumeDataPoint {
  label: string;
  appointments: number;
  walkins: number;
  total: number;
}

export interface PeakHourDataPoint {
  hour: string; // e.g. "9:00 AM"
  appointments: number;
  walkins: number;
  total: number;
  isPeak?: boolean;
}

export interface DayStreakDataPoint {
  day: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  fullDay: string;
  visits: number;
  appointmentPct: number;
  isPeak?: boolean;
}

export interface TopServiceDataPoint {
  id: string;
  name: string;
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AgeGroupDataPoint {
  bracket: string; // "0-12", "13-19", "20-35", "36-50", "51+"
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface GenderRatioData {
  female: { count: number; percentage: number; color: string };
  male: { count: number; percentage: number; color: string };
  pediatric: { count: number; percentage: number; color: string };
}

export interface PatientClassData {
  selfPayPct: number;
  hmoCorporatePct: number;
  referralPct: number;
}

export interface DemographicsData {
  gender: GenderRatioData;
  ageGroups: AgeGroupDataPoint[];
  patientClass: PatientClassData;
}

export interface ClinicAnalyticsDataset {
  scope: BranchScopeOption;
  availableBranches: BranchScopeOption[];
  resourceSnapshot: BranchResourceSnapshot;
  kpis: AnalyticsKpiData;
  timeRange: TimeRangeOption;
  volumeTrend: VolumeDataPoint[];
  peakHours: PeakHourDataPoint[];
  dayStreaks: DayStreakDataPoint[];
  topServices: TopServiceDataPoint[];
  demographics: DemographicsData;
}
