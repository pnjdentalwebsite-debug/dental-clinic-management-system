import { useEffect, useState } from 'react';
import { Modal } from '../../../../../components/overlays/Modal';
import type { CertificateFormValues, CertificateRecord, CertificateStatus, CertificateTypeOption } from './certificateTypes';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  certificate: CertificateRecord | null;
  certificateTypes: CertificateTypeOption[];
  statusOptions: CertificateStatus[];
  onClose: () => void;
  onSave: (values: CertificateFormValues) => void;
}

const createInitialValues = (certificate: CertificateRecord | null): CertificateFormValues => ({
  certificateType: certificate?.certificateType || 'dental-clearance',
  title: certificate?.title || 'Dental Clearance Certificate',
  issuedDate: certificate?.issuedDate || new Date().toISOString().split('T')[0],
  dentist: certificate?.dentist || 'Dr. Santos',
  purpose: certificate?.purpose || '',
  remarks: certificate?.remarks || '',
  status: certificate?.status || 'Draft'
});

export function CertificateForm({ open, mode, certificate, certificateTypes, statusOptions, onClose, onSave }: Props) {
  const [values, setValues] = useState<CertificateFormValues>(() => createInitialValues(certificate));
  const activeType = certificateTypes.find((type) => type.id === values.certificateType) || certificateTypes[0];
  const canSave = Boolean(values.title.trim() && values.issuedDate && values.dentist.trim());

  useEffect(() => {
    if (!open) return;
    setValues(createInitialValues(certificate));
  }, [open, certificate]);

  const updateValue = <Key extends keyof CertificateFormValues>(key: Key, value: CertificateFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'Create Certificate' : 'Edit Certificate'}
      description="Create and preview a patient certificate record."
      onClose={onClose}
      width="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => onSave(values)}>Save Certificate</button>
        </>
      }
    >
      <div className="certificate-form">
        <label>
          <span>Certificate Type</span>
          <select value={values.certificateType} onChange={(event) => updateValue('certificateType', event.target.value as CertificateFormValues['certificateType'])}>
            {certificateTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
        </label>

        <label>
          <span>Title</span>
          <input value={values.title} onChange={(event) => updateValue('title', event.target.value)} placeholder={activeType.label} />
        </label>

        <label>
          <span>Issue Date</span>
          <input type="date" value={values.issuedDate} onChange={(event) => updateValue('issuedDate', event.target.value)} />
        </label>

        <label>
          <span>Dentist</span>
          <input value={values.dentist} onChange={(event) => updateValue('dentist', event.target.value)} placeholder="Dr. Santos" />
        </label>

        <label>
          <span>Status</span>
          <select value={values.status} onChange={(event) => updateValue('status', event.target.value as CertificateStatus)}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="certificate-form__wide">
          <span>Purpose</span>
          <textarea rows={3} value={values.purpose} onChange={(event) => updateValue('purpose', event.target.value)} placeholder="Explain the purpose of this certificate." />
        </label>

        <label className="certificate-form__wide">
          <span>Remarks</span>
          <textarea rows={3} value={values.remarks} onChange={(event) => updateValue('remarks', event.target.value)} placeholder="Additional remarks or clinical notes." />
        </label>
      </div>
    </Modal>
  );
}
