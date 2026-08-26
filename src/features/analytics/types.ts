import type { LucideIcon } from 'lucide-react';

export type AnalyticsReportKey =
  | 'overview'
  | 'revenue'
  | 'facilities'
  | 'clinical'
  | 'audits'
  | 'subscribers'
  | 'subscriptions'
  | 'users'
  | 'clinics'
  | 'laboratories'
  | 'registrations'
  | 'data-quality';
export type AnalyticsTrend = 'up' | 'down' | 'neutral' | 'unavailable';
export type AnalyticsMetricStatus = 'positive' | 'negative' | 'neutral' | 'warning';
export type AnalyticsComparisonMode = 'previous_period' | 'previous_month' | 'previous_year' | 'none';
export type AnalyticsDatePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'previous_month' | 'this_quarter' | 'this_year' | 'custom';
export type DataQualitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface AnalyticsDateRange {
  preset: AnalyticsDatePreset;
  startDate: string;
  endDate: string;
}

export interface AnalyticsFilter {
  dateRange: AnalyticsDateRange;
  comparison: AnalyticsComparisonMode;
  subscriberId: string;
  planId: string;
  subscriptionStatus: string;
  paymentStatus: string;
  clinicId: string;
  laboratoryId: string;
  userRole: string;
}

export interface MetricComparison {
  value: number;
  percentage: number;
  trend: AnalyticsTrend;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: number | string;
  formattedValue: string;
  comparison?: MetricComparison;
  trend: AnalyticsTrend;
  status: AnalyticsMetricStatus;
  description: string;
  sourceModules: string[];
  lastCalculatedAt: string;
  icon?: LucideIcon;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  secondaryValue?: number;
  route?: string;
}

export interface ChartSeries {
  id: string;
  title: string;
  description: string;
  data: ChartDataPoint[];
  emptyMessage?: string;
}

export interface ReportTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface ReportDrilldownRow {
  id: string;
  cells: Record<string, string | number>;
  routes?: Record<string, string>;
  actionRoute?: string;
  secondaryRoute?: string;
}

export interface AnalyticsWarning {
  id: string;
  severity: DataQualitySeverity;
  module: string;
  recordId: string;
  description: string;
  suggestedCorrection: string;
  route?: string;
}

export interface SavedReportView {
  id: string;
  name: string;
  reportKey: AnalyticsReportKey;
  filters: AnalyticsFilter;
  dateRange: AnalyticsDateRange;
  comparison: AnalyticsComparisonMode;
  visibleColumns: string[];
  sort: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportDefinition {
  fileName: string;
  columns: ReportTableColumn[];
  rows: ReportDrilldownRow[];
}

export interface AnalyticsReport {
  key: AnalyticsReportKey;
  title: string;
  subtitle: string;
  metrics: MetricCardData[];
  charts: ChartSeries[];
  tableTitle: string;
  columns: ReportTableColumn[];
  rows: ReportDrilldownRow[];
  warnings: AnalyticsWarning[];
  generatedAt: string;
  notice?: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  description: string;
  sourceRecords: string[];
  inclusionRules: string[];
  exclusionRules: string[];
  formula: string;
  formatting: 'number' | 'currency' | 'percentage' | 'text';
  trendMeaning: 'increase_positive' | 'increase_negative' | 'neutral';
}
