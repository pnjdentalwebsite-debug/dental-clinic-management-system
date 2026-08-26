import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getDentalConditionOptions } from '../patients/clinical/dental-chart/dentalChartConfig';
import { createEmptyDentalChartRecord } from '../patients/clinical/dental-chart/dentalChartStore';
import { DentalChartPrintForm } from './DentalChartPrintForm';

describe('DentalChartPrintForm', () => {
  it('renders the complete permanent and pediatric odontogram', () => {
    render(
      <DentalChartPrintForm
        clinicName="P & J TANARTE"
        address="BAYAN LUMA IV IMUS CAVITE"
        contact="0953 834 3062"
      />
    );

    expect(screen.getByText('Dental Status Chart')).toBeInTheDocument();
    expect(screen.getByLabelText('Tooth 55 procedure code')).toBeInTheDocument();
    expect(screen.getByLabelText('Tooth 18 procedure code')).toBeInTheDocument();
    expect(screen.getByLabelText('Tooth 38 procedure code')).toBeInTheDocument();
    expect(screen.getByLabelText('Tooth 75 procedure code')).toBeInTheDocument();
    expect(screen.getByText('Decayed (Caries Indicated for Filling)')).toBeInTheDocument();
    expect(screen.getByText('Restorations & Prosthetics')).toBeInTheDocument();
    expect(screen.getByText('ROOT CANAL TREATMENT (RCT)')).toBeInTheDocument();
    expect(screen.getByText('DENTALLY FIT')).toBeInTheDocument();
    expect(screen.getByText('Checked By:')).toBeInTheDocument();
    expect(screen.getByLabelText('Tooth 55 procedure code').textContent).toBe('');
  });

  it('prints only the saved procedure tags and surface markings', () => {
    const chart = createEmptyDentalChartRecord('P001');
    const cavity = getDentalConditionOptions().find((condition) => condition.label === 'Cavity');
    expect(cavity).toBeDefined();

    chart.teeth = chart.teeth.map((tooth) => tooth.toothNumber === '55'
      ? {
          ...tooth,
          condition: cavity!.id,
          surfaces: ['buccal'],
          surfaceMarkings: [{ surface: 'buccal', condition: cavity!.id }],
          tags: ['MC', 'AM']
        }
      : tooth);

    render(
      <DentalChartPrintForm
        clinicName="Clinic"
        address="Address"
        contact="Contact"
        dentalChart={chart}
      />
    );

    expect(screen.getByLabelText('Tooth 55 procedure code')).toHaveTextContent('MCAM');
    const toothSvg = screen.getByRole('img', { name: 'Tooth 55 odontogram' });
    expect(toothSvg.querySelector('path')).toHaveStyle({ fill: cavity!.surfaceColor });
    expect(screen.getByLabelText('Tooth 54 procedure code').textContent).toBe('');
  });

  it('respects optional chart section visibility', () => {
    render(
      <DentalChartPrintForm
        clinicName="Clinic"
        address="Address"
        contact="Contact"
        showLegend={false}
        showFindings={false}
        showRecommendations={false}
        showFooter={false}
      />
    );

    expect(screen.queryByText('Condition')).not.toBeInTheDocument();
    expect(screen.queryByText('RECOMMENDATION:')).not.toBeInTheDocument();
    expect(screen.queryByText('REMARKS:')).not.toBeInTheDocument();
    expect(screen.queryByText('Checked By:')).not.toBeInTheDocument();
  });
});
