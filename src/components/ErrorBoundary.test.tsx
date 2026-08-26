import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function BrokenComponent(): ReactElement {
  throw new Error('Unit crash');
}

describe('ErrorBoundary', () => {
  it('renders a recoverable fallback when a child throws', async () => {
    const reload = vi.fn();
    render(
      <ErrorBoundary onReset={reload}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    await userEvent.click(screen.getByRole('button', { name: /reload prototype/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
