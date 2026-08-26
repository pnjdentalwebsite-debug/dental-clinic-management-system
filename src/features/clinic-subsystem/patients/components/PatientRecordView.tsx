import { useState } from 'react';
import { AddPatientStepper, type PatientFormState } from './AddPatientStepper';
import type { PatientPreviewItem } from './patientTypes';
import { PatientProfileHeader } from './PatientProfileHeader';
import { PatientClinicalWorkspace } from '../clinical/PatientClinicalWorkspace';
import type { PatientClinicalTabId } from '../clinical/patientClinicalTypes';
import { buildPatientFromForm } from './patientRecordMappers';

interface Props {
  patient: PatientPreviewItem;
  onBack: () => void;
  onSavePatientTags: (patientId: string, tags: string[]) => void;
  onSavePatientRecord: (patientId: string, nextRecord: PatientPreviewItem) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function PatientRecordView({ patient, onBack, onSavePatientTags, onSavePatientRecord, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<PatientClinicalTabId>('overview');
  const [fullRecordEditorOpen, setFullRecordEditorOpen] = useState(false);

  const handleSaveFullRecord = (form: PatientFormState) => {
    const nextRecord = buildPatientFromForm(form, patient, patient.id);
    onSavePatientRecord(patient.id, nextRecord);
    setFullRecordEditorOpen(false);
    showToast('Patient record updated.', 'success');
  };

  if (fullRecordEditorOpen) {
    return (
      <div className="patient-record">
        <AddPatientStepper
          mode="edit"
          patient={patient}
          onCancel={() => setFullRecordEditorOpen(false)}
          onSave={handleSaveFullRecord}
        />
      </div>
    );
  }

  return (
    <div className="patient-record">
      <PatientProfileHeader
        patient={patient}
        onBack={onBack}
        onOpenFullPatientRecord={() => setActiveTab('certificates')}
        onOpenRecordEditor={() => setFullRecordEditorOpen(true)}
        onSaveTags={onSavePatientTags}
        onSavePatientRecord={onSavePatientRecord}
        showToast={showToast}
      />
      <PatientClinicalWorkspace patient={patient} activeTab={activeTab} onTabChange={setActiveTab} showToast={showToast} />
    </div>
  );
}
