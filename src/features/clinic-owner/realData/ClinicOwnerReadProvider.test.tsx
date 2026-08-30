import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicOwnerApiError, type ClinicOwnerBootstrap } from '../../../infrastructure/supabase/clinicOwnerApi';
import { ClinicOwnerReadProvider, useClinicOwnerRead } from './ClinicOwnerReadProvider';

const bootstrap = {
  owner: { displayName: 'Real Owner' },
  subscriber: { id: 'subscriber-1', businessName: 'Real Dental Group' },
  plan: { name: 'Plus' },
} as ClinicOwnerBootstrap;

function Probe() {
  const model = useClinicOwnerRead();
  return (
    <div>
      <span data-testid="status">{model.status}</span>
      <span data-testid="owner">{model.bootstrap?.owner.displayName ?? 'none'}</span>
      <span data-testid="error">{model.error ?? 'none'}</span>
      <button onClick={() => void model.refresh()}>Refresh</button>
    </div>
  );
}

describe('Clinic Owner read provider', () => {
  it('loads an authoritative bootstrap and exposes refresh', async () => {
    const load = vi.fn().mockResolvedValue(bootstrap);
    render(<ClinicOwnerReadProvider enabled loadBootstrap={load}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready'));
    expect(screen.getByTestId('owner')).toHaveTextContent('Real Owner');
    await act(async () => screen.getByRole('button', { name: 'Refresh' }).click());
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('clears authoritative data when disabled/logout occurs', async () => {
    const load = vi.fn().mockResolvedValue(bootstrap);
    const view = render(<ClinicOwnerReadProvider enabled loadBootstrap={load}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('owner')).toHaveTextContent('Real Owner'));
    view.rerender(<ClinicOwnerReadProvider enabled={false} loadBootstrap={load}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthorized'));
    expect(screen.getByTestId('owner')).toHaveTextContent('none');
  });

  it('maps membership conflicts and unavailable subscriptions to controlled states', async () => {
    const conflict = vi.fn().mockRejectedValue(new ClinicOwnerApiError('MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS'));
    const view = render(<ClinicOwnerReadProvider enabled loadBootstrap={conflict}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('membership_conflict'));
    expect(screen.getByTestId('owner')).toHaveTextContent('none');

    const missingSubscription = vi.fn().mockRejectedValue(new ClinicOwnerApiError('SUBSCRIPTION_NOT_FOUND'));
    view.rerender(<ClinicOwnerReadProvider enabled loadBootstrap={missingSubscription}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('subscription_unavailable'));
  });

  it('never substitutes data after an unknown backend failure', async () => {
    const load = vi.fn().mockRejectedValue(new Error('provider internals'));
    render(<ClinicOwnerReadProvider enabled loadBootstrap={load}><Probe /></ClinicOwnerReadProvider>);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('data_unavailable'));
    expect(screen.getByTestId('owner')).toHaveTextContent('none');
    expect(screen.getByTestId('error')).toHaveTextContent('No mock data was substituted');
    expect(screen.getByTestId('error')).not.toHaveTextContent('provider internals');
  });
});
