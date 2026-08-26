import type { PatientPreviewItem } from '../../components/patientTypes';
import type { PatientModuleRecordBase } from '../shared/PatientModuleScaffold';
import { loadPatientDirectoryRecords, savePatientDirectoryRecords } from '../../shared/patientDirectoryStore';
import { loadProgressNotes } from '../progress-notes/progressNoteStore';
import {
  getPatientClinicId,
  getPatientScopedStorageKey,
  loadPatientScopedRecords,
  savePatientScopedRecords
} from '../shared/patientClinicalStorage';

type BillPaymentSource = 'manual' | 'progress-note';

export interface BillPaymentServiceLine {
  id: string;
  service: string;
  tooth: string;
  quantity: number;
  baseAmount: number;
  discount: number;
  lineTotal: number;
  remarks: string;
}

export interface BillPaymentProof {
  fileName: string;
  dataUrl: string;
}

export interface BillPaymentEntry {
  id: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  remarks: string;
  receivedBy: string;
  amount: number;
  proof?: BillPaymentProof | null;
}

export interface BillPaymentRecord extends PatientModuleRecordBase {
  entryDate: string;
  invoiceNumber: string;
  description: string;
  paymentMethod: string;
  balance: string;
  source?: BillPaymentSource;
  sourceId?: string;
  sourceRowId?: string;
  patientName?: string;
  toothReference?: string;
  associate?: string;
  billRemarks?: string;
  totalCost: number;
  billDiscount: number;
  payableAmount: number;
  paidAmount: number;
  balanceAmount: number;
  services: BillPaymentServiceLine[];
  payments: BillPaymentEntry[];
}

interface ProgressNoteBillSyncSource {
  id: string;
  patientName: string;
  visitDate: string;
  dentist: string;
  notes?: string;
  services: Array<{
    id: string;
    service: string;
    tooth: string;
    cost: number;
  }>;
}

export interface ProgressNoteBillSyncResult {
  syncedCount: number;
  updatedCount: number;
  createdCount: number;
  removedCount: number;
}

const STORAGE_KEY_PREFIX = 'clinicBillPayments:';
export const BILL_PAYMENTS_UPDATED_EVENT = 'clinic-bill-payments:updated';

export const formatBillCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value).replace('PHP', 'PHP ');

export const formatCompactBillCurrency = (value: number) =>
  formatBillCurrency(value).replace('.00', '');

export const getBillPaymentsStorageKey = (patientId: string) =>
  `${STORAGE_KEY_PREFIX}${patientId}`;

export const getScopedBillPaymentsStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(STORAGE_KEY_PREFIX, patientId, clinicId);

export const deriveBillStatus = (
  payableAmount: number,
  paidAmount: number
): Pick<BillPaymentRecord, 'statusLabel' | 'statusTone'> => {
  const safePayable = Math.max(Number(payableAmount || 0), 0);
  const safePaid = Math.max(Number(paidAmount || 0), 0);
  const balanceAmount = Math.max(safePayable - safePaid, 0);

  if (balanceAmount <= 0 && safePayable > 0) {
    return { statusLabel: 'Paid', statusTone: 'success' };
  }

  if (safePaid > 0 && balanceAmount > 0) {
    return { statusLabel: 'Partial', statusTone: 'warning' };
  }

  return { statusLabel: 'Unpaid', statusTone: 'warning' };
};

export const createBillServiceLine = (service: Partial<BillPaymentServiceLine> = {}): BillPaymentServiceLine => {
  const quantity = Math.max(Number(service.quantity || 1), 1);
  const baseAmount = Math.max(Number(service.baseAmount || 0), 0);
  const discount = Math.max(Number(service.discount || 0), 0);
  const lineTotal = Math.max(
    Number(service.lineTotal ?? quantity * baseAmount - discount),
    0
  );

  return {
    id: service.id || `BILL-SERVICE-${Date.now()}`,
    service: service.service || '',
    tooth: service.tooth || '',
    quantity,
    baseAmount,
    discount,
    lineTotal,
    remarks: service.remarks || ''
  };
};

export const createInitialBillPaymentRecords = (_patient: PatientPreviewItem): BillPaymentRecord[] => {
  return [];
};

const normalizeServiceLine = (service: Partial<BillPaymentServiceLine>, fallbackId: string) =>
  createBillServiceLine({
    id: service.id || fallbackId,
    service: service.service || '',
    tooth: service.tooth || '',
    quantity: Number(service.quantity || 1),
    baseAmount: Number(service.baseAmount || 0),
    discount: Number(service.discount || 0),
    lineTotal: Number(service.lineTotal ?? 0),
    remarks: service.remarks || ''
  });

const normalizePaymentEntry = (payment: Partial<BillPaymentEntry>, fallbackId: string): BillPaymentEntry => ({
  id: payment.id || fallbackId,
  paymentDate: payment.paymentDate || '',
  paymentMethod: payment.paymentMethod || 'Cash',
  referenceNumber: payment.referenceNumber || '',
  remarks: payment.remarks || '',
  receivedBy: payment.receivedBy || '',
  amount: Math.max(Number(payment.amount || 0), 0),
  proof: payment.proof
    ? {
        fileName: payment.proof.fileName || '',
        dataUrl: payment.proof.dataUrl || ''
      }
    : null
});

const normalizeRecord = (record: BillPaymentRecord): BillPaymentRecord => {
  const services = Array.isArray(record.services) && record.services.length > 0
    ? record.services.map((service, index) => normalizeServiceLine(service, `${record.id}-service-${index + 1}`))
    : [
        createBillServiceLine({
          id: `${record.id}-service-1`,
          service: record.description,
          tooth: record.toothReference || '',
          quantity: 1,
          baseAmount: inferAmountFromLegacyRecord(record),
          lineTotal: inferAmountFromLegacyRecord(record),
          remarks: record.billRemarks || ''
        })
      ];

  const totalCost = Number(
    record.totalCost ??
      services.reduce((sum, service) => sum + Math.max(Number(service.lineTotal || 0), 0), 0)
  );
  const billDiscount = Math.max(Number(record.billDiscount ?? 0), 0);
  const payableAmount = Math.max(Number(record.payableAmount ?? totalCost - billDiscount), 0);
  const paidAmount = Math.max(
    Number(
      record.paidAmount ??
        (Array.isArray(record.payments)
          ? record.payments.reduce((sum, payment) => sum + Math.max(Number(payment.amount || 0), 0), 0)
          : 0)
    ),
    0
  );
  const balanceAmount = Math.max(Number(record.balanceAmount ?? payableAmount - paidAmount), 0);
  const payments = Array.isArray(record.payments)
    ? record.payments.map((payment, index) => normalizePaymentEntry(payment, `${record.id}-payment-${index + 1}`))
    : [];
  const paymentMethod = record.paymentMethod || payments[payments.length - 1]?.paymentMethod || 'Pending collection';

  return {
    ...record,
    paymentMethod,
    associate: record.associate || '',
    billRemarks: record.billRemarks || '',
    totalCost,
    billDiscount,
    payableAmount,
    paidAmount,
    balanceAmount,
    balance: formatCompactBillCurrency(balanceAmount),
    services,
    payments,
    ...deriveBillStatus(payableAmount, paidAmount)
  };
};

export const loadBillPaymentRecords = (patient: PatientPreviewItem): BillPaymentRecord[] => {
  return loadPatientScopedRecords(STORAGE_KEY_PREFIX, patient, createInitialBillPaymentRecords)
    .map((record) => normalizeRecord(record as BillPaymentRecord));
};

export const saveBillPaymentRecords = (patientId: string, records: BillPaymentRecord[], clinicId?: string) => {
  const normalized = records.map((record) => normalizeRecord(record));
  savePatientScopedRecords(STORAGE_KEY_PREFIX, patientId, normalized, clinicId);

  // Compute total balance across all bills for this patient
  const totalBalanceAmount = normalized.reduce(
    (sum, r) => sum + Math.max(Number(r.balanceAmount ?? (r.payableAmount - r.paidAmount)), 0),
    0
  );
  const balanceLabel = formatCompactBillCurrency(totalBalanceAmount);

  // Sync to patient directory so Patients table & Subsystem Dashboard immediately reflect the new balance
  try {
    const patients = loadPatientDirectoryRecords();
    const target = patients.find((p) => p.id === patientId && (!clinicId || p.clinicId === clinicId));
    if (target && target.balance !== balanceLabel) {
      const updated = patients.map((p) =>
        p.id === patientId && (!clinicId || p.clinicId === clinicId) ? { ...p, balance: balanceLabel } : p
      );
      savePatientDirectoryRecords(updated);
    }
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent(BILL_PAYMENTS_UPDATED_EVENT, {
      detail: { patientId, clinicId: clinicId || getPatientClinicId() }
    })
  );
};

export const syncBillPaymentsFromProgressNote = (
  patient: PatientPreviewItem,
  note: ProgressNoteBillSyncSource
): ProgressNoteBillSyncResult => {
  const currentRecords = loadBillPaymentRecords(patient);
  const existingLinkedRecords = currentRecords.filter(
    (record) => record.source === 'progress-note' && record.sourceId === note.id
  );
  const existingByRowId = new Map(
    existingLinkedRecords
      .filter((record) => record.sourceRowId)
      .map((record) => [record.sourceRowId as string, record])
  );

  const retainedRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === note.id)
  );

  let createdCount = 0;
  let updatedCount = 0;

  const syncedRecords = note.services
    .filter((service) => service.service.trim() && Number(service.cost || 0) > 0)
    .map((service, index) => {
      const existingRecord = existingByRowId.get(service.id);
      if (existingRecord) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
      const toothReference = service.tooth.trim();
      const description = toothReference
        ? `${service.service} - Tooth ${toothReference}`
        : service.service;
      const services = [
        createBillServiceLine({
          id: service.id,
          service: service.service,
          tooth: toothReference,
          quantity: 1,
          baseAmount: Number(service.cost || 0),
          lineTotal: Number(service.cost || 0),
          remarks: note.notes || ''
        })
      ];
      const totalCost = services.reduce((sum, line) => sum + line.lineTotal, 0);
      const billDiscount = Math.max(Number(existingRecord?.billDiscount || 0), 0);
      const payableAmount = Math.max(totalCost - billDiscount, 0);
      const paidAmount = Math.max(Number(existingRecord?.paidAmount || 0), 0);
      const balanceAmount = Math.max(payableAmount - paidAmount, 0);

      return normalizeRecord({
        id: existingRecord?.id || `BILL-${Date.now()}-${index + 1}`,
        entryDate: note.visitDate,
        invoiceNumber: existingRecord?.invoiceNumber || `PN-${note.id.slice(-6)}-${index + 1}`,
        description,
        paymentMethod:
          existingRecord?.paymentMethod && existingRecord.paymentMethod !== 'Pending collection'
            ? existingRecord.paymentMethod
            : paidAmount > 0
              ? existingRecord?.paymentMethod || 'Cash'
              : 'Pending collection',
        balance: formatCompactBillCurrency(balanceAmount),
        statusLabel: existingRecord?.statusLabel || 'Unpaid',
        statusTone: existingRecord?.statusTone || 'warning',
        source: 'progress-note',
        sourceId: note.id,
        sourceRowId: service.id,
        patientName: note.patientName,
        toothReference,
        associate: existingRecord?.associate || note.dentist || '',
        billRemarks: existingRecord?.billRemarks || note.notes || 'Progress note',
        totalCost,
        billDiscount,
        payableAmount,
        paidAmount,
        balanceAmount,
        services,
        payments: existingRecord?.payments || []
      });
    });

  const nextRecords = [...syncedRecords, ...retainedRecords];
  saveBillPaymentRecords(patient.id, nextRecords, patient.clinicId);

  return {
    syncedCount: syncedRecords.length,
    updatedCount,
    createdCount,
    removedCount: Math.max(existingLinkedRecords.length - syncedRecords.length, 0)
  };
};

export const countBillPaymentsForProgressNote = (patient: PatientPreviewItem, noteId: string) =>
  loadBillPaymentRecords(patient).filter(
    (record) => record.source === 'progress-note' && record.sourceId === noteId
  ).length;

export const removeBillPaymentsForProgressNote = (patient: PatientPreviewItem, noteId: string) => {
  const currentRecords = loadBillPaymentRecords(patient);
  const nextRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === noteId)
  );
  const removedCount = currentRecords.length - nextRecords.length;

  if (removedCount > 0) {
    saveBillPaymentRecords(patient.id, nextRecords, patient.clinicId);
    return removedCount;
  }

  return 0;
};

function inferAmountFromLegacyRecord(record: Pick<BillPaymentRecord, 'balance' | 'balanceAmount' | 'payableAmount'>) {
  if (typeof record.payableAmount === 'number' && Number.isFinite(record.payableAmount)) {
    return record.payableAmount;
  }

  if (typeof record.balanceAmount === 'number' && Number.isFinite(record.balanceAmount)) {
    return record.balanceAmount;
  }

  const numeric = Number(String(record.balance || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

export interface ClinicFinancialAggregation {
  grossBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  billsCount: number;
  paymentsCount: number;
  allBills: (BillPaymentRecord & { patientName: string; patientId: string })[];
  allPayments: (BillPaymentEntry & { patientName: string; patientId: string })[];
  allServices: (BillPaymentServiceLine & { patientName: string; patientId: string })[];
  paymentMethodTotals: {
    cash: number;
    gcashMaya: number;
    creditCard: number;
    hmoInsurance: number;
  };
  todayCollections: {
    cash: number;
    digital: number;
    total: number;
  };
  dentistProduction: {
    [dentistName: string]: {
      patientsServed: number;
      revenue: number;
      procedures: string[];
    };
  };
}

export function aggregateClinicFinancials(
  inputPatientsOrDate?: PatientPreviewItem[] | string,
  targetDate?: string
): ClinicFinancialAggregation {
  let patients: PatientPreviewItem[] = [];
  let effectiveDate = targetDate;

  if (Array.isArray(inputPatientsOrDate)) {
    patients = inputPatientsOrDate;
  } else {
    if (typeof inputPatientsOrDate === 'string') {
      effectiveDate = inputPatientsOrDate;
    }
    patients = loadPatientDirectoryRecords();
  }

  let grossBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let billsCount = 0;
  let paymentsCount = 0;
  const allBills: (BillPaymentRecord & { patientName: string; patientId: string })[] = [];
  const allPayments: (BillPaymentEntry & { patientName: string; patientId: string })[] = [];
  const allServices: (BillPaymentServiceLine & { patientName: string; patientId: string })[] = [];

  const paymentMethodTotals = {
    cash: 0,
    gcashMaya: 0,
    creditCard: 0,
    hmoInsurance: 0
  };

  const todayCollections = {
    cash: 0,
    digital: 0,
    total: 0
  };

  const dentistProduction: { [name: string]: { patientsServed: number; revenue: number; procedures: string[] } } = {};

  const todayIso = effectiveDate || new Date().toISOString().split('T')[0];

  patients.forEach((patient) => {
    const bills = loadBillPaymentRecords(patient);
    const progressNotes = loadProgressNotes(patient);

    bills.forEach((bill) => {
      allBills.push({ ...bill, patientName: patient.name, patientId: patient.id });
      billsCount++;
      const payable = Number(bill.payableAmount || 0);
      const paid = Number(bill.paidAmount || 0);
      const balance = Number(bill.balanceAmount ?? Math.max(payable - paid, 0));

      grossBilled += payable;
      totalCollected += paid;
      totalOutstanding += balance;

      // Services
      if (Array.isArray(bill.services)) {
        bill.services.forEach((s) => {
          allServices.push({ ...s, patientName: patient.name, patientId: patient.id });
        });
      }

      // Payments
      if (Array.isArray(bill.payments)) {
        bill.payments.forEach((p) => {
          paymentsCount++;
          allPayments.push({ ...p, patientName: patient.name, patientId: patient.id });

          const amt = Number(p.amount || 0);
          const methodLower = (p.paymentMethod || '').toLowerCase();

          if (methodLower.includes('cash')) {
            paymentMethodTotals.cash += amt;
          } else if (methodLower.includes('card') || methodLower.includes('pos')) {
            paymentMethodTotals.creditCard += amt;
          } else if (methodLower.includes('hmo') || methodLower.includes('insurance')) {
            paymentMethodTotals.hmoInsurance += amt;
          } else {
            // Default GCash / Maya / Digital
            paymentMethodTotals.gcashMaya += amt;
          }

          // Check if payment was today
          if (p.paymentDate === todayIso || p.paymentDate?.startsWith(todayIso) || !p.paymentDate) {
            if (methodLower.includes('cash')) {
              todayCollections.cash += amt;
            } else {
              todayCollections.digital += amt;
            }
            todayCollections.total += amt;
          }
        });
      }
    });

    // Also check progress notes for procedures & dentist production
    progressNotes.forEach((note) => {
      const dentist = note.dentist || 'Assigned Associate Dentist';
      if (!dentistProduction[dentist]) {
        dentistProduction[dentist] = { patientsServed: 0, revenue: 0, procedures: [] };
      }
      dentistProduction[dentist].patientsServed++;
      if (Array.isArray(note.services)) {
        note.services.forEach((s) => {
          dentistProduction[dentist].revenue += Number(s.cost || 0);
          dentistProduction[dentist].procedures.push(s.service);
        });
      }
    });
  });

  return {
    grossBilled,
    totalCollected,
    totalOutstanding,
    billsCount,
    paymentsCount,
    allBills,
    allPayments,
    allServices,
    paymentMethodTotals,
    todayCollections,
    dentistProduction
  };
}
