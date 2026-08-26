import type { PatientPreviewItem } from './patientTypes';

export interface PatientDocumentIdentity {
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  birthDate: string;
  birthDateIso: string;
  age: string;
  sex: string;
}

const monthLookup: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11
};

export function buildPatientDocumentIdentity(patient: PatientPreviewItem): PatientDocumentIdentity {
  const fallbackParts = patient.name.trim().split(/\s+/);
  const fallbackFirstName = fallbackParts.shift() || '';
  const fallbackLastName = fallbackParts.join(' ');
  const parsedBirthDate = parsePatientDate(patient.birthDate);

  return {
    fullName: patient.name,
    firstName: patient.firstName || fallbackFirstName,
    middleName: patient.middleName || '',
    lastName: patient.lastName || fallbackLastName,
    nickname: patient.nickname || '',
    birthDate: parsedBirthDate ? formatDate(parsedBirthDate, 'en-US') : patient.birthDate,
    birthDateIso: parsedBirthDate ? formatIsoDate(parsedBirthDate) : patient.birthDate,
    age: parsedBirthDate ? String(calculateAge(parsedBirthDate)) : '',
    sex: patient.sex
  };
}

export function getPatientDocumentDate() {
  return formatIsoDate(new Date());
}

function parsePatientDate(value: string) {
  const isoDate = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;

  const [dayValue, monthValue, yearValue] = value.trim().split(/\s+/);
  const day = Number(dayValue);
  const month = monthLookup[monthValue?.toLowerCase()];
  const year = Number(yearValue);
  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
}

function calculateAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
