import type { PatientPreviewItem } from '../patients/components/patientTypes';
import type { CalendarScheduleItem, ScheduleStatus } from './types';

const STORAGE_KEY = 'clinic-subsystem:schedule-items:v1';
export const CLINIC_SCHEDULES_UPDATED_EVENT = 'clinic-schedules:updated';

export const defaultClinicScheduleItems: CalendarScheduleItem[] = [];

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getClinicScheduleItems(
  fallback: CalendarScheduleItem[] = defaultClinicScheduleItems,
  clinicId?: string
): CalendarScheduleItem[] {
  if (typeof window === 'undefined') {
    return clinicId ? fallback.filter((i) => i.clinicId === clinicId) : fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clinicId ? fallback.filter((i) => i.clinicId === clinicId) : fallback;
    }
    const parsed = JSON.parse(raw);
    const rawList: CalendarScheduleItem[] = Array.isArray(parsed) ? parsed : fallback;
    const normalizedList = rawList.filter((item) => Boolean(item?.clinicId));
    if (normalizedList.length !== rawList.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedList));
    }

    if (clinicId) {
      return normalizedList.filter((item) => item.clinicId === clinicId);
    }
    return normalizedList;
  } catch {
    return clinicId ? fallback.filter((i) => i.clinicId === clinicId) : fallback;
  }
}

export function saveClinicScheduleItems(items: CalendarScheduleItem[], clinicId?: string) {
  if (typeof window === 'undefined') return;

  try {
    let combinedList: CalendarScheduleItem[] = [];
    if (clinicId) {
      const allExisting = getClinicScheduleItems(); // load all
      const otherClinicsItems = allExisting.filter((i) => i.clinicId !== clinicId);
      const scopedWithClinic = items.map((i) => ({ ...i, clinicId: i.clinicId || clinicId }));
      combinedList = [...otherClinicsItems, ...scopedWithClinic];
    } else {
      combinedList = items.filter((item) => Boolean(item?.clinicId));
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(combinedList));
    window.dispatchEvent(new CustomEvent(CLINIC_SCHEDULES_UPDATED_EVENT));
  } catch {
    // Keep scheduling usable even when browser storage is unavailable.
  }
}

export function removeClinicScheduleItem(
  target: CalendarScheduleItem,
  fallback: CalendarScheduleItem[] = defaultClinicScheduleItems,
  clinicId?: string
) {
  const currentItems = getClinicScheduleItems(fallback, clinicId);
  const { nextItems, removedCount } = buildClinicScheduleRemovalPlan(currentItems, target);

  if (removedCount > 0) {
    saveClinicScheduleItems(nextItems, clinicId);
  }

  return {
    removedCount,
    nextItems
  };
}

export function buildClinicScheduleRemovalPlan(
  currentItems: CalendarScheduleItem[],
  target: CalendarScheduleItem
) {
  const targetNoteId = extractProgressNoteId(target.notes);
  const nextItems = currentItems.filter((item) => !isRemovableScheduleMatch(item, target, targetNoteId));

  return {
    nextItems,
    removedCount: currentItems.length - nextItems.length
  };
}

function isRemovableScheduleMatch(
  item: CalendarScheduleItem,
  target: CalendarScheduleItem,
  targetNoteId: string
) {
  if (item.id === target.id) {
    return true;
  }

  if (
    target.source === 'progress-note-recall'
    && target.sourceId
    && item.source === 'progress-note-recall'
    && item.sourceId === target.sourceId
  ) {
    return true;
  }

  if (
    target.linkedAppointmentId
    && item.linkedAppointmentId
    && item.linkedAppointmentId === target.linkedAppointmentId
  ) {
    return true;
  }

  if (targetNoteId && extractProgressNoteId(item.notes) === targetNoteId) {
    return true;
  }

  return isSameCancelledRecallIdentity(item, target);
}

function extractProgressNoteId(value?: string) {
  return value?.match(/NOTE-\d+/i)?.[0]?.toUpperCase() || '';
}

function isSameCancelledRecallIdentity(item: CalendarScheduleItem, target: CalendarScheduleItem) {
  if (target.status !== 'Cancelled' || item.status !== 'Cancelled') {
    return false;
  }

  if (target.type !== 'recalls' || item.type !== 'recalls') {
    return false;
  }

  if (item.date !== target.date) {
    return false;
  }

  const samePatient = Boolean(target.patientId && item.patientId && item.patientId === target.patientId)
    || normalizeCompareValue(item.patientName) === normalizeCompareValue(target.patientName);
  if (!samePatient) {
    return false;
  }

  const targetTitle = normalizeCompareValue(target.title || target.procedure);
  const itemTitle = normalizeCompareValue(item.title || item.procedure);
  const targetProcedure = normalizeCompareValue(target.procedure || target.title);
  const itemProcedure = normalizeCompareValue(item.procedure || item.title);

  return Boolean(targetTitle && itemTitle && targetTitle === itemTitle)
    || Boolean(targetProcedure && itemProcedure && targetProcedure === itemProcedure);
}

function normalizeCompareValue(value?: string) {
  return (value || '').trim().toLowerCase();
}

interface ProgressNoteCalendarSyncSource {
  appointmentId: string;
  progressNoteId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  provider: string;
  notes: string;
  recallReason?: string;
  statusLabel: string;
}

export function syncCalendarRecallFromAppointment(
  patient: PatientPreviewItem,
  appointment: ProgressNoteCalendarSyncSource
) : string | null {
  if (!patient.clinicId) return null;
  const clinicId = patient.clinicId;
  const currentItems = getClinicScheduleItems(defaultClinicScheduleItems, clinicId);
  const retainedItems = currentItems.filter(
    (item) => !(item.source === 'progress-note-recall' && item.sourceId === appointment.progressNoteId)
  );
  const existingItem = currentItems.find(
    (item) => item.source === 'progress-note-recall' && item.sourceId === appointment.progressNoteId
  );

  const syncedItem: CalendarScheduleItem = {
    id: existingItem?.id || `cal-${Date.now()}`,
    linkedAppointmentId: appointment.appointmentId,
    source: 'progress-note-recall',
    sourceId: appointment.progressNoteId,
    patientId: patient.id,
    patientName: patient.name,
    title: appointment.recallReason?.trim() || appointment.appointmentType.trim() || 'Recall Appointment',
    date: appointment.appointmentDate,
    time: formatCalendarTime(appointment.appointmentTime),
    startTime: appointment.appointmentTime || '',
    endTime: existingItem?.endTime || '',
    procedure: appointment.recallReason?.trim() || appointment.appointmentType.trim() || 'Recall Appointment',
    dentist: appointment.provider.trim() || 'Unassigned',
    status: normalizeScheduleStatus(appointment.statusLabel),
    type: 'recalls',
    clinicId,
    clinicName: patient.clinicName,
    treatmentTag: existingItem?.treatmentTag || 'Recall',
    notes: appointment.notes.trim() || 'Linked recall appointment from clinical progress note.',
    gender: patient.sex,
    age: normalizePatientAge(patient),
    birthday: patient.birthDate,
    city: patient.city
  };

  saveClinicScheduleItems([syncedItem, ...retainedItems], clinicId);
  return syncedItem.id;
}

export function countCalendarRecallsForProgressNote(progressNoteId: string, clinicId?: string) {
  return getClinicScheduleItems(defaultClinicScheduleItems, clinicId).filter(
    (item) => item.source === 'progress-note-recall' && item.sourceId === progressNoteId
  ).length;
}

export function removeCalendarRecallsForProgressNote(progressNoteId: string, clinicId?: string) {
  const currentItems = getClinicScheduleItems(defaultClinicScheduleItems, clinicId);
  const nextItems = currentItems.filter(
    (item) => !(item.source === 'progress-note-recall' && item.sourceId === progressNoteId)
  );
  const removedCount = currentItems.length - nextItems.length;

  if (removedCount > 0) {
    saveClinicScheduleItems(nextItems, clinicId);
    return removedCount;
  }

  return 0;
}

function normalizeScheduleStatus(value: string): ScheduleStatus {
  if (value === 'Confirmed') return 'Confirmed';
  if (value === 'Waiting') return 'Waiting';
  if (value === 'In Treatment') return 'In Treatment';
  if (value === 'Completed') return 'Completed';
  if (value === 'Cancelled') return 'Cancelled';
  if (value === 'No Show') return 'No Show';
  return 'Scheduled';
}

function formatCalendarTime(value: string) {
  if (!value) return 'Any time';

  const parsed = new Date(`2026-08-11T${value}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(parsed);
}

function normalizePatientAge(patient: PatientPreviewItem) {
  const fromField = Number(patient.age);
  if (Number.isFinite(fromField)) return fromField;
  return undefined;
}
