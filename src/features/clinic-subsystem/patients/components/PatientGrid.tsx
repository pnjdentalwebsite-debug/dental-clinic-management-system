import { PatientCard } from './PatientCard';
import type { PatientPreviewItem } from './patientTypes';

interface Props {
  patients: PatientPreviewItem[];
  onViewRecord: (patientId: string) => void;
  onDeletePatient?: (patientId: string) => void;
}

export function PatientGrid({ patients, onViewRecord, onDeletePatient }: Props) {
  return (
    <div className="patient-grid">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onViewRecord={onViewRecord} onDelete={onDeletePatient} />
      ))}
    </div>
  );
}
