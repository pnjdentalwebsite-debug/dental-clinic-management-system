import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddBranchStepper } from './AddBranchStepper';

describe('Clinic Owner real branch stepper boundary', () => {
  it('uses a neutral unsaved branch identity, authentic owner display, and deferred controls', () => {
    render(<AddBranchStepper ownerDisplayName="Angelo Mhyr Lagsac" renderMode="page" onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Generated on save')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Angelo Mhyr Lagsac')).toBeDisabled();
    expect(screen.getByLabelText('Primary branch setting is read-only')).toBeDisabled();
    expect(screen.getByText('Ownership is inherited from the organization and cannot be changed here.')).toBeInTheDocument();
  });

  it('does not claim that a blank branch can be saved as a draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddBranchStepper ownerDisplayName="Angelo Mhyr Lagsac" renderMode="page" onClose={vi.fn()} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Save Draft requires branch name, location, phone number, and email.');
  });

  it('does not import a mock authority and keeps personnel assignment deferred', async () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/components/AddBranchStepper.tsx'), 'utf8');
    expect(source).not.toMatch(/mockClinicService|mockPlatformManagementService|tenantScope|branchSettingsStore|mockAuditService|localStorage|sessionStorage/);
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddBranchStepper ownerDisplayName="Angelo Mhyr Lagsac" renderMode="page" onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText('Branch Name'), 'Real Branch');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Complete Address'), '1 Real Road');
    await user.type(screen.getByLabelText('City / Municipality'), 'Bacoor');
    await user.type(screen.getByLabelText('Province'), 'Cavite');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Branch Phone Number'), '09171234567');
    await user.type(screen.getByLabelText('Branch Email Address'), 'branch@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getAllByText('Real personnel assignments will be available after personnel real-data cutover.')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Save as Draft' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Real Branch', addressLine1: '1 Real Road', city: 'Bacoor', province: 'Cavite', contactNumber: '09171234567', email: 'branch@example.com',
    }), true);
  });
});
