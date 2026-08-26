import { describe, expect, it } from 'vitest';
import {
  aggregateClinicFinancials,
  saveBillPaymentRecords,
  type BillPaymentRecord
} from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import type { PatientPreviewItem } from '../../clinic-subsystem/patients/components/patientTypes';
import { mockAssociateDentistService } from './mockAssociateDentistService';
import { mockStaffService } from './mockStaffService';

const patient = (id: string, clinicId: string, name: string): PatientPreviewItem => ({
  id,
  clinicName: clinicId === 'CLN-DISTUNIA' ? 'Distunia Clinic' : 'sad dnetal clinic',
  name,
  birthDate: '1992-08-16',
  sex: 'Male',
  city: 'Imus',
  address: 'Test address',
  contact: 'No contact',
  firstVisit: '2026-08-26',
  recallDate: '',
  balance: 'PHP 0',
  status: 'Active',
  dentalNotes: '',
  medicalHistory: '',
  allergies: '',
  medicalNotes: '',
  previousAppointments: [],
  upcomingAppointments: []
});

const bill = (patientId: string, _clinicId: string, balance: number): BillPaymentRecord => ({
  id: `bill-${patientId}`,
  statusLabel: 'Unpaid',
  statusTone: 'warning',
  entryDate: '2026-08-26',
  invoiceNumber: `INV-${patientId}`,
  description: 'Test treatment',
  paymentMethod: 'Cash',
  balance: `PHP ${balance}`,
  totalCost: balance,
  billDiscount: 0,
  payableAmount: balance,
  paidAmount: 0,
  balanceAmount: balance,
  services: [],
  payments: []
});

describe('multi-clinic tenant data integrity', () => {
  it('aggregates all authorized clinic balances and isolates each branch', () => {
    const distunia = patient('P-DISTUNIA', 'CLN-DISTUNIA', 'Distunia Patient');
    const sad = patient('P-SAD', 'CLN-SAD', 'Sad Patient');
    saveBillPaymentRecords(distunia.id, [bill(distunia.id, distunia.clinicId!, 200)], distunia.clinicId);
    saveBillPaymentRecords(sad.id, [bill(sad.id, sad.clinicId!, 1800)], sad.clinicId);

    expect(aggregateClinicFinancials([distunia]).totalOutstanding).toBe(200);
    expect(aggregateClinicFinancials([sad]).totalOutstanding).toBe(1800);
    expect(aggregateClinicFinancials([distunia, sad]).totalOutstanding).toBe(2000);
  });

  it('keeps associate and laboratory assignments tenant-safe and starts clean', () => {
    expect(mockStaffService.getEmptyFormData().authorizedLaboratories).toEqual([]);
    expect(mockAssociateDentistService.toFormData().authorizedLaboratories).toEqual([]);

    const first = mockAssociateDentistService.createDentist({
      ...mockAssociateDentistService.toFormData(),
      subscriberId: 'SUB-MOCK-MAX',
      lastName: 'One',
      firstName: 'Associate',
      mobileNumber: '09170000001',
      designation: 'Associate Dentist',
      specialization: 'General Dentistry',
      authorizedClinics: ['Distunia Clinic'],
      authorizedLaboratories: []
    }, 'integration-test');

    expect(first.ok).toBe(true);
    expect(first.data?.associateNumber).toBe('DEN-000001');
    expect(first.data?.clinicIds).toEqual([]);

    const savedFirst = mockAssociateDentistService.listDentists().find((record) => record.associateNumber === 'DEN-000001');
    expect(savedFirst).toBeDefined();
    expect(mockAssociateDentistService.deleteDentist(savedFirst!.id)).toBe(true);
    const second = mockAssociateDentistService.createDentist({
      ...mockAssociateDentistService.toFormData(),
      subscriberId: 'SUB-INTEGRATION',
      lastName: 'Two',
      firstName: 'Associate',
      mobileNumber: '09170000002',
      designation: 'Associate Dentist',
      specialization: 'General Dentistry'
    }, 'integration-test');
    expect(second.data?.associateNumber).toBe('DEN-000001');
  });
});
