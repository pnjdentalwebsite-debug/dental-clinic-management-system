import { ChevronRight, PencilLine, Trash2 } from 'lucide-react';
import { masterFileDirectoryService } from '../../master-files/masterFileDirectoryService';
import type { PatientPreviewItem } from './patientTypes';

interface Props {
  patient: PatientPreviewItem;
  onViewRecord: (patientId: string) => void;
  onEdit?: (patientId: string) => void;
  onDelete?: (patientId: string) => void;
}

const getPatientInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getAgeLabel = (patient: PatientPreviewItem) => {
  const rawAge = patient.age?.trim();
  return rawAge ? `${rawAge} yrs` : 'Age N/A';
};

const getLastVisitLabel = (patient: PatientPreviewItem) => patient.lastDentalVisit || patient.recallDate || 'No visit yet';

const getRemarksLabel = (patient: PatientPreviewItem) => patient.tableRemarks?.trim() || '';

const resolvePatientTagLabel = (patient: PatientPreviewItem) => {
  const firstTagCode = patient.tags?.[0];
  if (!firstTagCode) return '';
  const tagRecord = masterFileDirectoryService
    .getActiveTagRecords('risk-tags')
    .find((tag) => tag.code === firstTagCode);
  return tagRecord?.name || firstTagCode;
};

const REMARK_TONE_CLASS: Record<string, string> = {
  'Recall Due': 'patient-table__remark-blip--recall',
  'Missed Birthday': 'patient-table__remark-blip--birthday',
  'Missed Appointment': 'patient-table__remark-blip--appointment',
  'Partial Pay': 'patient-table__remark-blip--partial'
};

export function PatientTableRow({ patient, onViewRecord, onEdit, onDelete }: Props) {
  const visibleRemarkFlags = patient.tableRemarkFlags?.slice(0, 2) || [];
  const hiddenRemarkFlags = patient.tableRemarkFlags?.slice(2) || [];
  const patientTagLabel = resolvePatientTagLabel(patient);

  return (
    <tr className="patient-table-row patient-table-row--dense">
      <td>
        <div className="patient-table__patient">
          <div className="patient-table__avatar" aria-hidden="true">
            {getPatientInitials(patient.name)}
          </div>
          <div className="patient-table__patient-copy">
            <button type="button" className="patient-table__name" title={patient.name} onClick={() => onViewRecord(patient.id)}>
              {patient.name}
            </button>
            <div className="patient-table__patient-details">
              <p className="patient-table__patient-meta">
                <span>{patient.id}</span>
                <span>{getAgeLabel(patient)}</span>
              </p>
              <p className="patient-table__patient-submeta">{patient.sex}</p>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="patient-table__stack">
          <strong>{patient.contact || 'No contact'}</strong>
          <span className="patient-table__muted" title={patient.address || patient.city}>
            {patient.address || patient.city || 'No address recorded'}
          </span>
          {patientTagLabel ? (
            <span className="patient-table__muted patient-table__tag-line" title={patientTagLabel}>
              {patientTagLabel}
            </span>
          ) : null}
        </div>
      </td>
      <td className="patient-table__date-cell">{patient.firstVisit}</td>
      <td className="patient-table__date-cell">{getLastVisitLabel(patient)}</td>
      <td>
        {visibleRemarkFlags.length > 0 ? (
          <div className="patient-table__remarks-blips" aria-label={getRemarksLabel(patient)}>
            {visibleRemarkFlags.map((flag) => (
              <span
                key={flag}
                className={`patient-table__remark-blip ${REMARK_TONE_CLASS[flag] || 'patient-table__remark-blip--neutral'}`}
                title={flag}
              >
                {flag}
              </span>
            ))}
            {hiddenRemarkFlags.length > 0 ? (
              <span className="patient-table__remark-overflow" tabIndex={0}>
                +{hiddenRemarkFlags.length}
                <span className="patient-table__remark-overflow-tooltip" role="tooltip">
                  {hiddenRemarkFlags.map((flag) => (
                    <span key={flag} className="patient-table__remark-overflow-item">
                      {flag}
                    </span>
                  ))}
                </span>
              </span>
            ) : null}
          </div>
        ) : (
          <p className="patient-table__remarks" title={getRemarksLabel(patient)}>
            {getRemarksLabel(patient)}
          </p>
        )}
      </td>
      <td>
        <strong className="patient-table__balance">{patient.balance}</strong>
      </td>
      <td>
        <div className="patient-table__actions">
          <button
            type="button"
            className="patient-table__action-button patient-table__action-button--view"
            onClick={(e) => {
              e.stopPropagation();
              onViewRecord(patient.id);
            }}
            title="View Record"
            aria-label={`View record of ${patient.name}`}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          {onEdit ? <button
            type="button"
            className="patient-table__action-button patient-table__action-button--edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(patient.id);
            }}
            title="Edit Patient"
            aria-label={`Edit ${patient.name}`}
          >
            <PencilLine size={16} aria-hidden="true" />
          </button> : null}
          {onDelete ? <button
            type="button"
            className="patient-table__action-button patient-table__action-button--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(patient.id);
            }}
            title="Delete Patient"
            aria-label={`Delete ${patient.name}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button> : null}
        </div>
      </td>
    </tr>
  );
}
