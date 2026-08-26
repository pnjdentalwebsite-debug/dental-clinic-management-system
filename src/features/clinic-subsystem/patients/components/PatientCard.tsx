import { ArrowRight, Trash2 } from 'lucide-react';
import type { PatientPreviewItem } from './patientTypes';

interface Props {
  patient: PatientPreviewItem;
  onViewRecord: (patientId: string) => void;
  onDelete?: (patientId: string) => void;
}

export function PatientCard({ patient, onViewRecord, onDelete }: Props) {
  return (
    <article className="patient-card" role="button" tabIndex={0} onClick={() => onViewRecord(patient.id)} onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onViewRecord(patient.id);
      }
    }}>
      <div className="patient-card__identity">
        <div className="patient-card__avatar" aria-hidden="true">
          {patient.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </div>
        <div className="patient-card__title-group">
          <button type="button" className="patient-card__name" title={patient.name} onClick={(event) => {
            event.stopPropagation();
            onViewRecord(patient.id);
          }}>
            {patient.name}
          </button>
          <p>Patient ID: {patient.id}</p>
        </div>
        <span className="patient-card__balance">{patient.balance}</span>
      </div>

      <div className="patient-card__details">
        <div className="patient-card__line">
          <span>{patient.city}</span>
          <span>{patient.contact}</span>
        </div>
        <div className="patient-card__line">
          <span>First Visit</span>
          <strong>{patient.firstVisit}</strong>
        </div>
        <div className="patient-card__line">
          <span>Recall</span>
          <strong>{patient.recallDate}</strong>
        </div>
      </div>

      <div className="patient-card__actions">
        <button type="button" className="patient-card__action" onClick={(event) => {
          event.stopPropagation();
          onViewRecord(patient.id);
        }}>
          View Record
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button type="button" className="patient-card__secondary-action" onClick={(event) => {
          event.stopPropagation();
          onDelete?.(patient.id);
        }}>
          <Trash2 size={15} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}
