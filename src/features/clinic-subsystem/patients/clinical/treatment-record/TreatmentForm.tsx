import { useEffect, useState } from 'react';
import { Modal } from '../../../../../components/overlays/Modal';
import type { TreatmentCategory, TreatmentFormValues, TreatmentRecordEntry, TreatmentStatus } from './treatmentTypes';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  treatment: TreatmentRecordEntry | null;
  categories: TreatmentCategory[];
  statusOptions: TreatmentStatus[];
  onClose: () => void;
  onSave: (values: TreatmentFormValues) => void;
}

const createInitialValues = (treatment: TreatmentRecordEntry | null): TreatmentFormValues => ({
  date: treatment?.date || new Date().toISOString().split('T')[0],
  procedure: treatment?.procedure || 'Cleaning',
  category: treatment?.category || 'preventive',
  toothNumber: treatment?.toothNumber || 'General',
  dentist: treatment?.dentist || 'Dr. Santos',
  description: treatment?.description || '',
  status: treatment?.status || 'Pending',
  amount: treatment ? String(treatment.amount) : '',
  notes: treatment?.notes || ''
});

export function TreatmentForm({ open, mode, treatment, categories, statusOptions, onClose, onSave }: Props) {
  const [values, setValues] = useState<TreatmentFormValues>(() => createInitialValues(treatment));
  const activeCategory = categories.find((category) => category.id === values.category) || categories[0];
  const canSave = Boolean(values.date && values.procedure.trim() && values.dentist.trim());

  useEffect(() => {
    if (!open) return;
    setValues(createInitialValues(treatment));
  }, [open, treatment]);

  const updateValue = <Key extends keyof TreatmentFormValues>(key: Key, value: TreatmentFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal
      open={open}
      title={mode === 'add' ? 'Add Treatment' : 'Edit Treatment'}
      description="Record patient dental treatment details."
      onClose={onClose}
      width="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => onSave(values)}>Save Treatment</button>
        </>
      }
    >
      <div className="treatment-form">
        <label>
          <span>Date</span>
          <input type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} />
        </label>

        <label>
          <span>Category</span>
          <select value={values.category} onChange={(event) => updateValue('category', event.target.value as TreatmentFormValues['category'])}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>

        <label>
          <span>Procedure</span>
          <select value={values.procedure} onChange={(event) => updateValue('procedure', event.target.value)}>
            {activeCategory.procedures.map((procedure) => <option key={procedure} value={procedure}>{procedure}</option>)}
          </select>
        </label>

        <label>
          <span>Affected Tooth</span>
          <input value={values.toothNumber} onChange={(event) => updateValue('toothNumber', event.target.value)} placeholder="General or tooth number e.g. 46" />
        </label>

        <label>
          <span>Dentist</span>
          <input value={values.dentist} onChange={(event) => updateValue('dentist', event.target.value)} placeholder="Dr. Santos" />
        </label>

        <label>
          <span>Status</span>
          <select value={values.status} onChange={(event) => updateValue('status', event.target.value as TreatmentStatus)}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label>
          <span>Amount</span>
          <input value={values.amount} onChange={(event) => updateValue('amount', event.target.value)} placeholder="1500" inputMode="decimal" />
        </label>

        <label className="treatment-form__wide">
          <span>Description</span>
          <textarea rows={3} value={values.description} onChange={(event) => updateValue('description', event.target.value)} placeholder="Describe the treatment performed or planned." />
        </label>

        <label className="treatment-form__wide">
          <span>Notes</span>
          <textarea rows={3} value={values.notes} onChange={(event) => updateValue('notes', event.target.value)} placeholder="Clinical notes, follow-up instructions, or reminders." />
        </label>
      </div>
    </Modal>
  );
}
