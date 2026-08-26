import type { PatientPreviewItem } from '../../components/patientTypes';
import { buildPatientDocumentIdentity } from '../../components/patientDocumentData';
import type { ModifyPdfSettings } from '../../../pdf-designer/modifyPdfSettings';
import type { ContractLedgerRow } from '../../../pdf-designer/ContractPrintForm';
import {
  getLegacyPatientStorageKey,
  getPatientScopedStorageKey
} from '../shared/patientClinicalStorage';

export interface PatientContractFormData {
  patientName: string;
  age: string;
  address: string;
  contact: string;
  birthDate: string;
  acknowledgementPrintedName: string;
  acknowledgementAddressAt: string;
  acknowledgementAge: string;
  dentistName: string;
  dentistRole: string;
  treatmentPackage: string;
  balanceTerms: string;
  downPaymentTerms: string[];
  ledgerRows: ContractLedgerRow[];
}

const contractFormStorageKeyPrefix = 'patientContractForm:';

export function getPatientContractFormStorageKey(patientId: string, clinicId?: string) {
  return getPatientScopedStorageKey(contractFormStorageKeyPrefix, patientId, clinicId);
}

export function createDefaultPatientContractForm(
  patient: PatientPreviewItem,
  settings: ModifyPdfSettings
): PatientContractFormData {
  const identity = buildPatientDocumentIdentity(patient);

  return {
    patientName: identity.fullName,
    age: identity.age,
    address: patient.address,
    contact: patient.mobileNumber || patient.contact,
    birthDate: identity.birthDateIso,
    acknowledgementPrintedName: identity.fullName,
    acknowledgementAddressAt: patient.address,
    acknowledgementAge: identity.age,
    dentistName: settings.dentistName || '',
    dentistRole: settings.dentistTitle || 'Associate Dentist',
    treatmentPackage: '',
    balanceTerms: '',
    downPaymentTerms: ['', '', '', '', ''],
    ledgerRows: createDefaultContractLedgerRows()
  };
}

export function loadPatientContractForm(
  patient: PatientPreviewItem,
  settings: ModifyPdfSettings
) {
  const defaults = createDefaultPatientContractForm(patient, settings);

  try {
    const raw = localStorage.getItem(getPatientContractFormStorageKey(patient.id, patient.clinicId))
      ?? localStorage.getItem(getLegacyPatientStorageKey(contractFormStorageKeyPrefix, patient.id));
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<PatientContractFormData>;
    return {
      ...defaults,
      ...parsed,
      downPaymentTerms: normalizeTerms(parsed.downPaymentTerms),
      ledgerRows: normalizeLedgerRows(parsed.ledgerRows)
    };
  } catch {
    return defaults;
  }
}

export function savePatientContractForm(
  patientId: string,
  form: PatientContractFormData,
  clinicId?: string
) {
  localStorage.setItem(
    getPatientContractFormStorageKey(patientId, clinicId),
    JSON.stringify({
      ...form,
      downPaymentTerms: normalizeTerms(form.downPaymentTerms),
      ledgerRows: normalizeLedgerRows(form.ledgerRows)
    })
  );
}

export function createDefaultContractLedgerRows() {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `contract-ledger-${index + 1}`,
    date: '',
    amountCharged: '',
    amountPaid: '',
    remarks: '',
    signature: ''
  }));
}

function normalizeTerms(terms?: string[]) {
  const nextTerms = [...(terms || [])];
  while (nextTerms.length < 5) nextTerms.push('');
  return nextTerms.slice(0, 5);
}

function normalizeLedgerRows(rows?: ContractLedgerRow[]) {
  const sourceRows = Array.isArray(rows) && rows.length > 0 ? rows : createDefaultContractLedgerRows();
  return sourceRows.map((row, index) => ({
    id: row.id || `contract-ledger-${index + 1}`,
    date: row.date || '',
    amountCharged: row.amountCharged || '',
    amountPaid: row.amountPaid || '',
    remarks: row.remarks || '',
    signature: row.signature || ''
  }));
}
