import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsReportsPage } from './AnalyticsReportsPage';

const setup = () => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
  window.print = vi.fn();
};

describe('AnalyticsReportsPage', () => {
  beforeEach(setup);

  it('renders overview metrics, charts, filters, row menu, export, saved view, and print actions', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    render(<AnalyticsReportsPage reportKey="overview" navigate={vi.fn()} showToast={showToast} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Analytics & Reports' })).toBeInTheDocument();
    expect(screen.getByText('Total Subscribers')).toBeInTheDocument();
    expect(screen.getByText('Subscriber Growth')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Plan'), screen.getByRole('option', { name: 'Plus' }));
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));
    expect(showToast).toHaveBeenCalledWith('Analytics filters applied.', 'success');
    await user.click(screen.getByLabelText('Export report'));
    await user.click(screen.getByRole('menuitem', { name: 'Export Current Page' }));
    expect(showToast).toHaveBeenCalledWith('CSV export generated. Prototype report only.', 'success');
    await user.click(screen.getByLabelText('Saved report views'));
    await user.click(screen.getByRole('menuitem', { name: 'Save Current View' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByLabelText('View Name'), 'Executive View');
    await user.click(screen.getByRole('button', { name: 'Save View' }));
    expect(showToast).toHaveBeenCalledWith('Saved report view created.', 'success');
    await user.click(screen.getByRole('button', { name: 'Print Report' }));
    expect(window.print).toHaveBeenCalled();
    await user.click(screen.getAllByLabelText(/Actions for/i)[0]);
    expect(screen.getByRole('menuitem', { name: 'View Related Record' })).toBeInTheDocument();
  });

  it('navigates report tabs and renders revenue warning', async () => {
    const navigate = vi.fn();
    const user = userEvent.setup();
    render(<AnalyticsReportsPage reportKey="overview" navigate={navigate} showToast={vi.fn()} refreshShell={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Revenue' }));
    expect(navigate).toHaveBeenCalledWith('/platform/analytics-reports/revenue');
    render(<AnalyticsReportsPage reportKey="revenue" navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByText(/Prototype financial figures only/i)).toBeInTheDocument();
  });

  it('renders missing report state for unknown route', () => {
    render(<AnalyticsReportsPage reportKey="unknown" navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Report not found' })).toBeInTheDocument();
  });
});
