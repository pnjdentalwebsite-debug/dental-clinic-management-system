import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PatientPreviewItem } from '../components/patientTypes';
import { getDentalConditionOptions } from './dental-chart/dentalChartConfig';
import {
  defaultModifyPdfSettings,
  saveModifyPdfSettings
} from '../../pdf-designer/modifyPdfSettings';
import {
  createEmptyDentalChartRecord,
  getDentalChartStorageKey,
  saveDentalChartRecords
} from './dental-chart/dentalChartStore';
import { PatientClinicalWorkspace } from './PatientClinicalWorkspace';
import { loadAppointmentRecords } from './appointments/appointmentStore';
import { loadBillPaymentRecords } from './bills-payments/billPaymentStore';

const patient: PatientPreviewItem = {
  id: 'P001',
  name: 'Juan Dela Cruz',
  birthDate: '12 February 1992',
  sex: 'Male',
  city: 'Quezon City',
  address: 'Brgy. Diliman, Quezon City',
  contact: '+63 917 123 4567',
  firstVisit: '15 March 2026',
  recallDate: '20 August 2026',
  balance: 'PHP 500',
  status: 'Active',
  dentalNotes: 'Routine prophylaxis and recall monitoring.',
  medicalHistory: 'No major medical history reported.',
  allergies: 'None reported',
  medicalNotes: 'Pre-procedural screening clear.',
  previousAppointments: [],
  upcomingAppointments: []
};

describe('PatientClinicalWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens patient-bound printable forms without restoring the previous certificate cards', async () => {
    const user = userEvent.setup();

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Certificates' }));

    expect(screen.getByRole('tab', { name: 'Certificates' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Documents & Forms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Patient Form' })).toHaveClass('is-active');
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Dela Cruz')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Create Certificate' })).not.toBeInTheDocument();
    expect(screen.queryByText('Treatment Certificate')).not.toBeInTheDocument();
    expect(screen.queryByText('Dental Clearance Certificate')).not.toBeInTheDocument();
    expect(screen.queryByText('For patient personal record.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Certificate Form' }));

    expect(screen.getByRole('heading', { name: 'DENTAL CERTIFICATE' })).toBeInTheDocument();
    expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
  });

  it('uses the configuration saved by Modify PDF', async () => {
    const user = userEvent.setup();
    localStorage.setItem('masterFileModifyPdfSettings', JSON.stringify({
      clinicName: 'Configured Dental Center',
      showClinicName: true,
      badgeText: 'PATIENT CLINICAL RECORD'
    }));

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Certificates' }));

    expect(screen.getByText('Configured Dental Center')).toBeInTheDocument();
    expect(screen.getByText('PATIENT CLINICAL RECORD')).toBeInTheDocument();
  });

  it('synchronizes a newly saved Modify PDF configuration without remounting the patient', async () => {
    const user = userEvent.setup();

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Certificates' }));

    expect(screen.queryByText('Live Dental Document Center')).not.toBeInTheDocument();

    act(() => {
      saveModifyPdfSettings({
        ...defaultModifyPdfSettings,
        clinicName: 'Live Dental Document Center',
        locked: true
      });
    });

    expect(screen.getByText('Live Dental Document Center')).toBeInTheDocument();
  });

  it('retrieves the saved patient chart in the Dental Chart Form preview', async () => {
    const user = userEvent.setup();
    const chart = createEmptyDentalChartRecord(patient.id);
    const cavity = getDentalConditionOptions().find((condition) => condition.label === 'Cavity');
    expect(cavity).toBeDefined();

    chart.teeth = chart.teeth.map((tooth) => tooth.toothNumber === '55'
      ? {
          ...tooth,
          condition: cavity!.id,
          surfaces: ['buccal'],
          surfaceMarkings: [{ surface: 'buccal', condition: cavity!.id }],
          tags: ['MC']
        }
      : tooth);
    localStorage.setItem(getDentalChartStorageKey(patient.id), JSON.stringify(chart));

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Certificates' }));
    await user.click(screen.getByRole('button', { name: 'Dental Chart Form' }));

    expect(screen.getByLabelText('Tooth 55 procedure code')).toHaveTextContent('MC');
    expect(screen.getByRole('img', { name: 'Tooth 55 odontogram' }).querySelector('path'))
      .toHaveStyle({ fill: cavity!.surfaceColor });
  });

  it('mirrors dental chart history inside the certificates dental chart form workspace', async () => {
    const user = userEvent.setup();
    const latestChart = createEmptyDentalChartRecord(patient.id);
    latestChart.id = 'CHART-101';
    latestChart.checkedDate = '2026-08-09';
    latestChart.updatedAt = '2026-08-09T15:33:00.000Z';
    latestChart.findings = 'No observations';
    latestChart.remarks = 'No remarks';

    const olderChart = createEmptyDentalChartRecord(patient.id);
    olderChart.id = 'CHART-100';
    olderChart.checkedDate = '2026-08-01';
    olderChart.updatedAt = '2026-08-01T09:15:00.000Z';
    olderChart.findings = 'Slight gingival inflammation';
    olderChart.remarks = 'Follow-up after cleaning';

    saveDentalChartRecords(patient.id, [latestChart, olderChart]);

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Certificates' }));
    await user.click(screen.getByRole('button', { name: 'Dental Chart Form' }));

    expect(screen.getByText('Chart History')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2026-08-09/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2026-08-01/i })).toBeInTheDocument();

    const olderHistoryButton = screen.getByRole('button', { name: /2026-08-01/i });
    await user.click(olderHistoryButton);

    expect(olderHistoryButton).toHaveClass('is-selected');
  });

  it('syncs saved progress notes into bills and appointments tabs, then removes linked appointment after recall is cleared', async () => {
    const user = userEvent.setup();

    render(<PatientClinicalWorkspace patient={patient} />);
    await user.click(screen.getByRole('tab', { name: 'Progress Notes' }));
    await user.click(screen.getByRole('button', { name: 'New Progress Note' }));
    await user.click(screen.getByRole('button', { name: 'Add Service Row' }));

    const serviceInputs = screen.getAllByPlaceholderText('Enter treatment / procedure');
    await user.type(serviceInputs[serviceInputs.length - 1], 'Consultation (Labxpert-CAVSU)');

    const toothInputs = screen.getAllByPlaceholderText('e.g. 46');
    await user.type(toothInputs[toothInputs.length - 1], '46');

    const costInputs = screen.getAllByPlaceholderText('0.00');
    await user.clear(costInputs[costInputs.length - 1]);
    await user.type(costInputs[costInputs.length - 1], '200');

    const noteArea = screen.getByPlaceholderText(/Type any detailed clinical comments/i);
    await user.type(noteArea, 'Linked recall appointment from integration test.');

    const recallReasonSelect = screen.getByDisplayValue('-- Select --');
    await user.selectOptions(recallReasonSelect, 'Post-Extraction Review');

    const dateInputs = screen.getAllByPlaceholderText('dd/mm/yyyy');
    await user.click(dateInputs[1]);
    await user.click(screen.getByRole('button', { name: '15' }));

    const timeInputs = screen.getAllByDisplayValue(/^\d{2}:\d{2}$/);
    await user.clear(timeInputs[timeInputs.length - 1]);
    await user.type(timeInputs[timeInputs.length - 1], '10:15');

    await user.click(screen.getByRole('button', { name: 'Save Progress Note' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /New Clinical Progress Note & Treatment Plan/i })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Bills & Payments' }));
    expect(screen.getAllByText(/Consultation \(Labxpert-CAVSU\)/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Tooth 46/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Unpaid')[0]).toBeInTheDocument();
    expect(loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(1);

    const overflowTrigger = document.querySelector('.patient-clinical-tabs__overflow-trigger') as HTMLButtonElement;
    expect(overflowTrigger).toBeTruthy();
    await user.click(overflowTrigger);
    await user.click(screen.getByRole('menuitem', { name: 'Appointments' }));
    expect(screen.getByText('Post-Extraction Review')).toBeInTheDocument();
    expect(screen.getByText('Recall reason: Post-Extraction Review')).toBeInTheDocument();
    expect(loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(1);

    await user.click(screen.getByRole('tab', { name: 'Progress Notes' }));
    await user.click(screen.getByLabelText('Open options for Clinical Progress Note'));
    await user.click(screen.getByRole('button', { name: 'Edit Note' }));

    const recallReasonSelectEdit = screen.getByDisplayValue('Post-Extraction Review');
    await user.selectOptions(recallReasonSelectEdit, '');

    await user.click(screen.getByDisplayValue('15/08/2026'));
    await user.click(screen.getAllByRole('button', { name: 'Clear' })[0]);

    await user.click(screen.getByRole('button', { name: 'Save Progress Note' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Edit Clinical Progress Note & Treatment Plan/i })).not.toBeInTheDocument();
    });

    await user.click(overflowTrigger);
    await user.click(screen.getByRole('menuitem', { name: 'Appointments' }));
    expect(screen.queryByText('Recall reason: Post-Extraction Review')).not.toBeInTheDocument();
    expect(loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);
    expect(loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(1);
  });
});
