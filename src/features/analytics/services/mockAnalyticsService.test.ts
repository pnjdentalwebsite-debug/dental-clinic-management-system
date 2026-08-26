import { generateCsv } from '../export/csvExport';
import { mockAnalyticsService } from './mockAnalyticsService';

const setup = () => {
  localStorage.clear();
};

describe('mockAnalyticsService', () => {
  beforeEach(setup);

  it('aggregates overview metrics and reconciles dashboard values', () => {
    const report = mockAnalyticsService.getReport('overview');
    expect(report.metrics.find(item => item.id === 'total_subscribers')?.value).toBeGreaterThan(0);
    expect(report.metrics.find(item => item.id === 'mock_net_revenue')?.value).toBe(mockAnalyticsService.getDashboardMetrics().mockMonthlyRevenue);
  });

  it('calculates net revenue by excluding invalid payment states', () => {
    const report = mockAnalyticsService.getReport('revenue');
    const net = report.metrics.find(item => item.id === 'mock_net_revenue')!;
    const rejected = report.rows.find(row => String(row.cells.status).includes('rejected'));
    expect(Number(net.value)).toBeGreaterThanOrEqual(0);
    expect(rejected?.cells.net).toBe('₱0');
  });

  it('builds registration funnel and data-quality reports', () => {
    expect(mockAnalyticsService.getReport('registrations').charts.find(item => item.id === 'registration-funnel')?.data.length).toBeGreaterThan(0);
    expect(mockAnalyticsService.getReport('data-quality').columns.map(item => item.key)).toContain('severity');
  });

  it('supports saved report view CRUD', () => {
    const filters = mockAnalyticsService.getDefaultFilters();
    const saved = mockAnalyticsService.saveCurrentView('My View', 'overview', filters);
    expect(saved.ok).toBe(true);
    expect(mockAnalyticsService.renameSavedView(saved.data!.id, 'Renamed').data?.name).toBe('Renamed');
    expect(mockAnalyticsService.duplicateSavedView(saved.data!.id).ok).toBe(true);
    expect(mockAnalyticsService.deleteSavedView(saved.data!.id).ok).toBe(true);
  });

  it('escapes CSV headers and row values', () => {
    const csv = generateCsv({ fileName: 'test.csv', columns: [{ key: 'name', label: 'Name, Value' }], rows: [{ id: '1', cells: { name: 'A "quoted", value' } }] });
    expect(csv).toContain('"Name, Value"');
    expect(csv).toContain('"A ""quoted"", value"');
  });
});
