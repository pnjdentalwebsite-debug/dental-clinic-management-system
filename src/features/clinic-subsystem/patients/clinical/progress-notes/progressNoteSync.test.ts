import { beforeEach, describe, expect, it } from 'vitest';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  loadAppointmentRecords,
  removeAppointmentsForProgressNote,
  syncAppointmentsFromProgressNote
} from '../appointments/appointmentStore';
import {
  buildClinicScheduleRemovalPlan,
  defaultClinicScheduleItems,
  getClinicScheduleItems,
  removeClinicScheduleItem,
  saveClinicScheduleItems
} from '../../../scheduling/scheduleStorage';
import {
  loadBillPaymentRecords,
  removeBillPaymentsForProgressNote,
  syncBillPaymentsFromProgressNote
} from '../bills-payments/billPaymentStore';
import {
  loadDentalRecallRecords,
  removeDentalRecallsForProgressNote,
  syncDentalRecallsFromProgressNote
} from '../dental-recalls/dentalRecallStore';
import { loadProgressNotes, saveProgressNotes, type ProgressNoteRecord } from './progressNoteStore';

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

const buildNote = (overrides: Partial<ProgressNoteRecord> = {}): ProgressNoteRecord => ({
  id: 'NOTE-STEP6-001',
  patientName: patient.name,
  visitDate: '2026-08-10',
  visitTime: '09:30',
  recallDate: '2026-08-15',
  recallTime: '10:15',
  recallReason: 'Post-Extraction Review',
  title: 'Consultation (Labxpert-CAVSU)',
  dentist: 'Dr. Maria Jessica Tanarte',
  notes: 'Monitor healing and check discomfort.',
  attachments: [],
  services: [
    { id: 'service-a', service: 'Consultation (Labxpert-CAVSU)', tooth: '46', cost: 200 }
  ],
  discount: 0,
  status: 'Saved',
  ...overrides
});

describe('progress note sync contracts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists notes and updates linked bills without duplicates during edit', () => {
    const originalNote = buildNote();

    saveProgressNotes(patient.id, [originalNote]);
    const firstResult = syncBillPaymentsFromProgressNote(patient, originalNote);

    const firstSyncRecords = loadBillPaymentRecords(patient).filter((record) => record.sourceId === originalNote.id);
    expect(firstResult).toEqual({
      syncedCount: 1,
      updatedCount: 0,
      createdCount: 1,
      removedCount: 0
    });
    expect(firstSyncRecords).toHaveLength(1);
    expect(firstSyncRecords[0]?.balance).toContain('200');
    expect(loadProgressNotes(patient)).toHaveLength(1);

    const editedNote = buildNote({
      services: [
        { id: 'service-a', service: 'Consultation (Labxpert-CAVSU)', tooth: '46', cost: 350 },
        { id: 'service-b', service: 'Follow-up Check-up', tooth: '', cost: 600 }
      ]
    });

    saveProgressNotes(patient.id, [editedNote]);
    const secondResult = syncBillPaymentsFromProgressNote(patient, editedNote);

    const linkedRecords = loadBillPaymentRecords(patient).filter((record) => record.sourceId === editedNote.id);
    expect(secondResult).toEqual({
      syncedCount: 2,
      updatedCount: 1,
      createdCount: 1,
      removedCount: 0
    });
    expect(linkedRecords).toHaveLength(2);
    expect(linkedRecords.some((record) => record.sourceRowId === 'service-a' && record.balance.includes('350'))).toBe(true);
    expect(linkedRecords.some((record) => record.sourceRowId === 'service-b' && record.balance.includes('600'))).toBe(true);

    const trimmedNote = buildNote({
      services: [{ id: 'service-b', service: 'Follow-up Check-up', tooth: '', cost: 600 }]
    });

    const thirdResult = syncBillPaymentsFromProgressNote(patient, trimmedNote);
    const trimmedLinkedRecords = loadBillPaymentRecords(patient).filter((record) => record.sourceId === trimmedNote.id);
    expect(thirdResult).toEqual({
      syncedCount: 1,
      updatedCount: 1,
      createdCount: 0,
      removedCount: 1
    });
    expect(trimmedLinkedRecords).toHaveLength(1);
    expect(trimmedLinkedRecords[0]?.sourceRowId).toBe('service-b');
  });

  it('creates one linked recall appointment, updates it, and removes it when recall data is cleared', () => {
    const originalNote = buildNote();

    syncAppointmentsFromProgressNote(patient, originalNote);
    syncDentalRecallsFromProgressNote(patient, originalNote);
    const firstLinked = loadAppointmentRecords(patient).filter((record) => record.sourceId === originalNote.id);
    const firstDentalRecallLinked = loadDentalRecallRecords(patient).filter((record) => record.sourceId === originalNote.id);
    const firstCalendarLinked = getClinicScheduleItems().filter((record) => record.sourceId === originalNote.id);
    expect(firstLinked).toHaveLength(1);
    expect(firstDentalRecallLinked).toHaveLength(1);
    expect(firstLinked[0]?.appointmentType).toBe('Post-Extraction Review');
    expect(firstLinked[0]?.recallReason).toBe('Post-Extraction Review');
    expect(firstDentalRecallLinked[0]?.recallReason).toBe('Post-Extraction Review');
    expect(firstCalendarLinked).toHaveLength(1);
    expect(firstCalendarLinked[0]?.type).toBe('recalls');
    expect(firstCalendarLinked[0]?.date).toBe('2026-08-15');
    expect(firstCalendarLinked[0]?.title).toBe('Post-Extraction Review');

    const editedNote = buildNote({
      recallDate: '2026-08-18',
      recallTime: '13:00',
      recallReason: 'Root Canal Follow-up',
      notes: 'Updated recall note'
    });

    syncAppointmentsFromProgressNote(patient, editedNote);
    syncDentalRecallsFromProgressNote(patient, editedNote);
    const updatedLinked = loadAppointmentRecords(patient).filter((record) => record.sourceId === editedNote.id);
    const updatedDentalRecallLinked = loadDentalRecallRecords(patient).filter((record) => record.sourceId === editedNote.id);
    const updatedCalendarLinked = getClinicScheduleItems().filter((record) => record.sourceId === editedNote.id);
    expect(updatedLinked).toHaveLength(1);
    expect(updatedDentalRecallLinked).toHaveLength(1);
    expect(updatedLinked[0]?.appointmentDate).toBe('2026-08-18');
    expect(updatedLinked[0]?.appointmentTime).toBe('13:00');
    expect(updatedLinked[0]?.appointmentType).toBe('Root Canal Follow-up');
    expect(updatedDentalRecallLinked[0]?.recallDate).toBe('2026-08-18');
    expect(updatedDentalRecallLinked[0]?.recallReason).toBe('Root Canal Follow-up');
    expect(updatedCalendarLinked).toHaveLength(1);
    expect(updatedCalendarLinked[0]?.date).toBe('2026-08-18');
    expect(updatedCalendarLinked[0]?.title).toBe('Root Canal Follow-up');
    expect(updatedCalendarLinked[0]?.time).toBe('1:00 PM');

    const clearedRecall = buildNote({
      recallDate: '',
      recallReason: ''
    });

    const result = syncAppointmentsFromProgressNote(patient, clearedRecall);
    const dentalRecallResult = syncDentalRecallsFromProgressNote(patient, clearedRecall);
    expect(result).toEqual({
      synced: false,
      removed: true,
      calendarSynced: false,
      calendarRemoved: true
    });
    expect(dentalRecallResult).toEqual({
      synced: false,
      removed: true
    });
    expect(loadAppointmentRecords(patient).filter((record) => record.sourceId === originalNote.id)).toHaveLength(0);
    expect(loadDentalRecallRecords(patient).filter((record) => record.sourceId === originalNote.id)).toHaveLength(0);
    expect(getClinicScheduleItems().filter((record) => record.sourceId === originalNote.id)).toHaveLength(0);
  });

  it('removes linked billing and appointment entries when a saved note is deleted', () => {
    const note = buildNote();

    syncBillPaymentsFromProgressNote(patient, note);
    syncAppointmentsFromProgressNote(patient, note);
    syncDentalRecallsFromProgressNote(patient, note);

    expect(loadBillPaymentRecords(patient).some((record) => record.sourceId === note.id)).toBe(true);
    expect(loadAppointmentRecords(patient).some((record) => record.sourceId === note.id)).toBe(true);
    expect(loadDentalRecallRecords(patient).some((record) => record.sourceId === note.id)).toBe(true);

    expect(removeBillPaymentsForProgressNote(patient, note.id)).toBe(1);
    expect(removeAppointmentsForProgressNote(patient, note.id)).toEqual({
      appointmentRemovedCount: 1,
      calendarRemovedCount: 1
    });
    expect(removeDentalRecallsForProgressNote(patient, note.id)).toBe(1);

    expect(loadBillPaymentRecords(patient).some((record) => record.sourceId === note.id)).toBe(false);
    expect(loadAppointmentRecords(patient).some((record) => record.sourceId === note.id)).toBe(false);
    expect(loadDentalRecallRecords(patient).some((record) => record.sourceId === note.id)).toBe(false);
    expect(getClinicScheduleItems().some((record) => record.sourceId === note.id)).toBe(false);
  });

  it('deletes cancelled linked calendar recalls and any duplicate calendar copies', () => {
    const note = buildNote({
      recallDate: '2026-08-18',
      recallReason: 'Orthodontic Adjustment'
    });

    syncAppointmentsFromProgressNote(patient, note);
    const linkedCalendarRecord = getClinicScheduleItems().find((record) => record.sourceId === note.id);
    expect(linkedCalendarRecord).toBeTruthy();

    saveClinicScheduleItems([
      {
        ...linkedCalendarRecord!,
        id: 'duplicate-calendar-copy',
        status: 'Cancelled',
        notes: `${linkedCalendarRecord!.notes} [Cancelled on 8/11/2026]`
      },
      {
        ...linkedCalendarRecord!,
        id: 'cancelled-original',
        status: 'Cancelled',
        notes: `${linkedCalendarRecord!.notes} [Cancelled on 8/11/2026]`
      },
      ...defaultClinicScheduleItems
    ]);

    const result = removeClinicScheduleItem({
      ...linkedCalendarRecord!,
      id: 'cancelled-original',
      status: 'Cancelled'
    });

    expect(result.removedCount).toBe(2);
    expect(getClinicScheduleItems().some((record) => record.sourceId === note.id)).toBe(false);
  });

  it('persists deletion for seeded mock calendar records', () => {
    const target = defaultClinicScheduleItems[0];
    const result = removeClinicScheduleItem(target);

    expect(result.removedCount).toBe(1);
    expect(getClinicScheduleItems().some((record) => record.id === target.id)).toBe(false);
  });

  it('removes cancelled agenda ghosts that lost progress note metadata without removing unrelated schedules', () => {
    const clickedGhost = {
      id: 'legacy-ghost-a',
      patientId: 'P001',
      patientName: 'Juan Dela Cruz',
      title: 'Orthodontic Adjustment',
      date: '2026-08-18',
      time: 'Any time',
      procedure: 'Orthodontic Adjustment',
      dentist: 'Unassigned',
      status: 'Cancelled' as const,
      type: 'recalls' as const,
      notes: 'Linked recall appointment from clinical progress note. [Cancelled on 8/11/2026]',
      gender: 'Male',
      birthday: '12 February 1992',
      city: 'Quezon City'
    };
    const duplicateGhost = {
      ...clickedGhost,
      id: 'legacy-ghost-b'
    };
    const activeDifferentPatient = {
      ...clickedGhost,
      id: 'active-other-patient',
      patientId: 'P016',
      patientName: 'dawadawd, awdawd',
      title: 'Post-Extraction Review',
      procedure: 'Post-Extraction Review',
      status: 'Scheduled' as const,
      notes: 'Recall linked to progress note NOTE-1783236839659'
    };

    const result = buildClinicScheduleRemovalPlan(
      [clickedGhost, duplicateGhost, activeDifferentPatient],
      clickedGhost
    );

    expect(result.removedCount).toBe(2);
    expect(result.nextItems).toEqual([activeDifferentPatient]);
  });
});
