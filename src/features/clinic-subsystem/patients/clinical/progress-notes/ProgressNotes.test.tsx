import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { loadAppointmentRecords } from '../appointments/appointmentStore';
import { loadBillPaymentRecords } from '../bills-payments/billPaymentStore';
import { loadProgressNotes } from './progressNoteStore';
import { ProgressNotes } from './ProgressNotes';

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

describe('ProgressNotes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves a draft without creating linked bills or appointments', async () => {
    const user = userEvent.setup();

    render(<ProgressNotes patient={patient} />);

    await user.click(screen.getByRole('button', { name: 'New Progress Note' }));
    await user.click(screen.getByRole('button', { name: 'Add Service Row' }));

    const serviceInputs = screen.getAllByPlaceholderText('Enter treatment / procedure');
    await user.type(serviceInputs[serviceInputs.length - 1], 'Consultation (Labxpert-CAVSU)');

    const costInputs = screen.getAllByPlaceholderText('0.00');
    await user.clear(costInputs[costInputs.length - 1]);
    await user.type(costInputs[costInputs.length - 1], '200');

    await user.click(screen.getByRole('button', { name: 'Save as Draft' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New Clinical Progress Note & Treatment Plan' })).not.toBeInTheDocument();
    });

    const savedNotes = loadProgressNotes(patient);
    const linkedBills = loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note');
    const linkedAppointments = loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note');

    expect(savedNotes.some((note) => note.status === 'Draft' && note.title === 'Clinical Progress Note')).toBe(true);
    expect(linkedBills).toHaveLength(0);
    expect(linkedAppointments).toHaveLength(0);
  });

  it('blocks final save when past recall date confirmation is declined', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProgressNotes patient={patient} />);

    await user.click(screen.getByRole('button', { name: 'New Progress Note' }));
    await user.click(screen.getByRole('button', { name: 'Add Service Row' }));

    const serviceInputs = screen.getAllByPlaceholderText('Enter treatment / procedure');
    await user.type(serviceInputs[serviceInputs.length - 1], 'Consultation (Labxpert-CAVSU)');

    const costInputs = screen.getAllByPlaceholderText('0.00');
    await user.clear(costInputs[costInputs.length - 1]);
    await user.type(costInputs[costInputs.length - 1], '200');

    const recallReasonSelect = screen.getByDisplayValue('-- Select --');
    await user.selectOptions(recallReasonSelect, 'General Checkup');

    const dateInputs = screen.getAllByPlaceholderText('dd/mm/yyyy');
    await user.click(dateInputs[1]);
    await user.click(screen.getByRole('button', { name: '9' }));

    await user.click(screen.getByRole('button', { name: 'Save Progress Note' }));

    expect(confirmSpy).toHaveBeenCalledWith('Recall date is already in the past. Continue anyway?');
    expect(screen.getByRole('heading', { name: 'New Clinical Progress Note & Treatment Plan' })).toBeInTheDocument();
    expect(loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);
    expect(loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);
  });

  it('removes linked bills and appointments when deleting a saved progress note from the UI', async () => {
    const user = userEvent.setup();

    render(<ProgressNotes patient={patient} />);

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
    await user.type(noteArea, 'Delete cleanup verification note.');

    const recallReasonSelect = screen.getByDisplayValue('-- Select --');
    await user.selectOptions(recallReasonSelect, 'General Checkup');

    await user.click(screen.getByRole('button', { name: 'Save Progress Note' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New Clinical Progress Note & Treatment Plan' })).not.toBeInTheDocument();
    });

    expect(loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(1);
    expect(loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);

    await user.click(screen.getByLabelText('Open options for Clinical Progress Note'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(loadBillPaymentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);
    expect(loadAppointmentRecords(patient).filter((record) => record.source === 'progress-note')).toHaveLength(0);
    expect(screen.queryByText('Delete cleanup verification note.')).not.toBeInTheDocument();
  });
});
