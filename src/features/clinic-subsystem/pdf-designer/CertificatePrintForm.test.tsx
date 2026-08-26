import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CertificatePrintForm } from './CertificatePrintForm';

describe('CertificatePrintForm', () => {
  it('renders the complete printable dental certificate', () => {
    render(<CertificatePrintForm />);

    expect(screen.getByRole('heading', { name: 'DENTAL CERTIFICATE' })).toBeInTheDocument();
    expect(screen.getByText('05/07/2026')).toBeInTheDocument();
    expect(screen.getByText('To Whom It May Concern:')).toBeInTheDocument();
    expect(screen.getByText('awdawd dawdawd')).toBeInTheDocument();
    expect(screen.getByText('I therefore recommend:')).toBeInTheDocument();
    expect(screen.getByText('Maria Jessica David - Tanarte, DMD')).toBeInTheDocument();
    expect(screen.getByText('License # 0052369')).toBeInTheDocument();
  });
});
