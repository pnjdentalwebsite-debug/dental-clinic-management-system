import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PatientRecordPrintForm } from './PatientRecordPrintForm';

const allSections = new Set([
  'patient-information-record',
  'minor-referral-details',
  'dental-history',
  'medical-history',
  'medical-questions',
  'allergies',
  'health-details',
  'for-women-only',
  'medical-conditions-checklist',
  'signature-consent'
]);

describe('PatientRecordPrintForm', () => {
  it('renders the complete printable patient record content', () => {
    render(
      <PatientRecordPrintForm
        clinicName="P & J TANARTE"
        address="BAYAN LUMA IV IMUS CAVITE"
        contact="0953 834 3062"
        badgeText="PATIENT RECORD"
        showClinicName
        showAddress
        showContact
        showBadge
        showLeftImage
        showLeftImageOutline
        showRightImage
        visibleSectionIds={allSections}
      />
    );

    expect(screen.getByText('PATIENT RECORD')).toBeInTheDocument();
    expect(screen.getByText('Birthday (mm/dd/yy):')).toBeInTheDocument();
    expect(screen.getByText('Dental History')).toBeInTheDocument();
    expect(screen.getByText('Medical History')).toBeInTheDocument();
    expect(screen.getByText('7. Do you use alcohol, cocaine or other dangerous drugs?')).toBeInTheDocument();
    expect(screen.getByText('Penicillin / Antibiotics')).toBeInTheDocument();
    expect(screen.getByText('Are you taking birth control pills?')).toBeInTheDocument();
    expect(screen.getByText('Thyroid Problem')).toBeInTheDocument();
    expect(screen.getByText('Patient / Parent / Guardian Signature')).toBeInTheDocument();
  });

  it('respects disabled patient form sections', () => {
    render(
      <PatientRecordPrintForm
        clinicName="Clinic"
        address="Address"
        contact="Contact"
        badgeText="PATIENT RECORD"
        showClinicName
        showAddress
        showContact
        showBadge
        showLeftImage={false}
        showLeftImageOutline={false}
        showRightImage={false}
        visibleSectionIds={new Set(['patient-information-record'])}
      />
    );

    expect(screen.getByText('Home Address:')).toBeInTheDocument();
    expect(screen.queryByText('Dental History')).not.toBeInTheDocument();
    expect(screen.queryByText('Medical History')).not.toBeInTheDocument();
  });
});
