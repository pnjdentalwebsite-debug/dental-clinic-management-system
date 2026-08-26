import type { PatientFormState } from './AddPatientStepper';
import type { PatientPreviewItem } from './patientTypes';

export const formatDateLabel = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parsed);
};

const composePatientName = (form: PatientFormState) => {
  return [form.firstName, form.middleName, form.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ') || 'Unnamed Patient';
};

export const buildPatientFromForm = (
  form: PatientFormState,
  existing: PatientPreviewItem | null,
  generatedId: string,
  clinicId?: string,
  clinicName?: string
): PatientPreviewItem => {
  const fullName = composePatientName(form);
  const allergyText = form.allergies.length > 0 ? form.allergies.join(', ') : 'None reported';
  const address = form.homeAddress.trim() || form.city.trim() || 'No address recorded';
  const city = form.city.trim() || address.split(',').pop()?.trim() || 'No city recorded';
  const todayLabel = formatDateLabel(new Date().toISOString());

  return {
    ...(existing || {}),
    id: existing?.id || generatedId,
    clinicId: clinicId || existing?.clinicId,
    clinicName: clinicName || existing?.clinicName,
    name: fullName,
    firstName: form.firstName,
    middleName: form.middleName,
    lastName: form.lastName,
    nickname: form.nickname,
    age: form.age,
    photoUrl: form.photoUrl,
    birthDate: formatDateLabel(form.birthDate) || existing?.birthDate || '',
    sex: form.sex || existing?.sex || 'Male',
    religion: form.religion,
    nationality: form.nationality,
    civilStatus: form.civilStatus,
    city,
    address,
    contact: form.mobileNumber.trim() || form.telNumbers.trim() || existing?.contact || '',
    telNumbers: form.telNumbers,
    email: form.email,
    company: form.company,
    occupation: form.occupation,
    officeNumber: form.officeNumber,
    dentalInsurance: form.dentalInsurance,
    faxNumber: form.faxNumber,
    effectiveDate: formatDateLabel(form.effectiveDate),
    mobileNumber: form.mobileNumber,
    parentGuardianName: form.parentGuardianName,
    referralSource: form.referralSource,
    consultationReason: form.consultationReason.trim() || existing?.consultationReason || '',
    previousDentist: form.previousDentist,
    lastDentalVisit: formatDateLabel(form.lastDentalVisit),
    physicianName: form.physicianName,
    medicalSpecialty: form.medicalSpecialty,
    physicianOfficeAddress: form.physicianOfficeAddress,
    physicianOfficeNumber: form.physicianOfficeNumber,
    bloodType: form.bloodType,
    bloodPressure: form.bloodPressure,
    school: existing?.school || '',
    heightWeight: existing?.heightWeight || '',
    medicalQuestions: form.medicalQuestions,
    allergyList: form.allergies,
    medicalConditions: form.medicalConditions,
    dentalHabits: form.dentalHabits,
    previousHospitalizations: existing?.previousHospitalizations || '',
    prescribedMedications: existing?.prescribedMedications || '',
    otherMedicalConcerns: existing?.otherMedicalConcerns || '',
    signatureName: form.signatureName,
    signatureDate: formatDateLabel(form.signatureDate),
    tags: existing?.tags || [],
    extensionName: existing?.extensionName || '',
    alternatePatientIds: existing?.alternatePatientIds || '',
    attendingDoctor: form.physicianName || existing?.attendingDoctor || 'Assigned Associate Dentist',
    lastUpdated: formatDateLabel(new Date().toISOString()) || existing?.lastUpdated || todayLabel,
    addedDate: existing?.addedDate || todayLabel,
    firstVisit: existing?.firstVisit || todayLabel,
    recallDate: existing?.recallDate || '',
    balance: existing?.balance || 'PHP 0',
    status: existing?.status || 'Active',
    dentalNotes: form.consultationReason.trim() || existing?.dentalNotes || 'New patient registration completed.',
    medicalHistory: form.medicalConditions.length > 0 ? form.medicalConditions.join(', ') : existing?.medicalHistory || 'No major medical history reported.',
    allergies: allergyText,
    medicalNotes: form.bloodPressure ? `Blood pressure: ${form.bloodPressure}` : existing?.medicalNotes || 'No medical alerts recorded.',
    previousAppointments: existing?.previousAppointments || [],
    upcomingAppointments: existing?.upcomingAppointments || []
  };
};
