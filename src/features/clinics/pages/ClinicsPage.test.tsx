import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatformAdminSnapshot } from '../../platformManagement/realData/platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { ClinicsPage } from './ClinicsPage';

const setup = () => {
  installPlatformAdminSnapshot(makePlatformAdminRealDataTestSnapshot());
};

describe('ClinicsPage', () => {
  beforeEach(setup);

  it('renders summaries, filters, tabs, table/card view, and row action menu', async () => {
    const user = userEvent.setup();
    render(<ClinicsPage navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Dental Clinic Branches' })).toBeInTheDocument();
    expect(screen.getByText('Personnel Assigned')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^active \(/i }));
    await user.type(screen.getByPlaceholderText(/search by clinic name/i), 'Harbor');
    expect(screen.getAllByText(/Harbor/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Card Grid' }));
    expect(screen.getByText('Primary Main Branch')).toBeInTheDocument();
    await user.click(screen.getAllByLabelText(/Actions for clinic/i)[0]);
    expect(screen.getByRole('menuitem', { name: 'View Clinic' })).toBeInTheDocument();
  });
});
