import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TreatmentRecordPrintForm } from './TreatmentRecordPrintForm';

describe('TreatmentRecordPrintForm', () => {
  it('renders the complete A4 treatment ledger', () => {
    render(
      <TreatmentRecordPrintForm
        clinicName="P & J TANARTE"
        address="BAYAN LUMA IV IMUS CAVITE"
        contact="0953 834 3062"
      />
    );

    expect(screen.getByRole('heading', { name: 'TREATMENT RECORD' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Tooth/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Procedure' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Dentist/s' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount Charged' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount Paid' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Balance' })).toBeInTheDocument();
    expect(screen.getAllByTestId('treatment-record-row')).toHaveLength(15);
    expect(screen.getByText('Attending Dentist')).toBeInTheDocument();
  });

  it('formats row values for date, dentist prefix, and monetary cells', () => {
    render(
      <TreatmentRecordPrintForm
        clinicName="Clinic"
        address="Address"
        contact="Contact"
        rows={[
          {
            id: 'row-1',
            date: '2026-03-15',
            toothNumber: '16',
            procedure: 'Initial consultation',
            dentist: 'Maria Jessica Tanarte',
            amountCharged: '1500',
            amountPaid: '500',
            balance: '1000'
          }
        ]}
        dentistName="Maria Jessica Tanarte"
      />
    );

    expect(screen.getByText('03/15/2026')).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Maria Jessica Tanarte')[0]).toBeInTheDocument();
    expect(screen.getByText('1,500.00')).toBeInTheDocument();
    expect(screen.getByText('500.00')).toBeInTheDocument();
    expect(screen.getByText('1,000.00')).toBeInTheDocument();
  });

  it('respects optional table columns and title visibility', () => {
    render(
      <TreatmentRecordPrintForm
        clinicName="Clinic"
        address="Address"
        contact="Contact"
        showTitle={false}
        showDentistColumn={false}
        showBalanceColumn={false}
      />
    );

    expect(screen.queryByRole('heading', { name: 'TREATMENT RECORD' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Dentist/s' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Balance' })).not.toBeInTheDocument();
  });
});
