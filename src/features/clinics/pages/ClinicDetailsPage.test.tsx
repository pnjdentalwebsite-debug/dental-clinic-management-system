import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPlatformAdminSnapshot, installPlatformAdminSnapshot } from '../../platformManagement/realData/platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot, platformAdminRealDataTestIds } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { ClinicDetailsPage } from './ClinicDetailsPage';

const setup = () => {
  installPlatformAdminSnapshot(makePlatformAdminRealDataTestSnapshot());
};

describe('ClinicDetailsPage', () => {
  beforeEach(setup);

  it('renders detail tabs and assignment workflow entry points', async () => {
    const clinic = { id: platformAdminRealDataTestIds.clinicId, clinicNumber: 'CLN-DEV-001' };
    const user = userEvent.setup();
    render(<ClinicDetailsPage clinicId={clinic.id} navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByText(clinic.clinicNumber)).toBeInTheDocument();
    expect(screen.getByText('Plus Plan')).toBeInTheDocument();
    expect(screen.queryByText('Plan Usage: Unknown')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Business Hours' }));
    expect(screen.getByText('Monday')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Dentists' }));
    await user.click(screen.getByRole('button', { name: 'Assign Dentist' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders missing clinic state', () => {
    clearPlatformAdminSnapshot();
    render(<ClinicDetailsPage clinicId="missing" navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Clinic not found' })).toBeInTheDocument();
  });
});
