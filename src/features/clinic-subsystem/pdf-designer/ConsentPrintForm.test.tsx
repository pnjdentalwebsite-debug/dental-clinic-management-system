import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConsentPrintForm } from './ConsentPrintForm';

describe('ConsentPrintForm', () => {
  it('renders the complete oral surgery consent document', () => {
    render(<ConsentPrintForm />);

    expect(screen.getByRole('heading', { name: 'ORAL SURGERY CONSENT FORM' })).toBeInTheDocument();
    expect(screen.getByText('awdawd dawdawd')).toBeInTheDocument();
    expect(screen.getByText('2000-11-28')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MEDICAL HISTORY' })).toBeInTheDocument();
    expect(screen.getByText('High Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Local Anesthesia')).toBeInTheDocument();
    expect(screen.getByText(/Postoperative discomfort and swelling/)).toBeInTheDocument();
    expect(screen.getByText("Patient's Signature / Date")).toBeInTheDocument();
    expect(screen.getByText("Dentist's Signature / Date")).toBeInTheDocument();
  });
});
