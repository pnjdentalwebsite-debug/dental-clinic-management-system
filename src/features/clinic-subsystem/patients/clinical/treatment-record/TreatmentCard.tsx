import { formatCurrency, formatDisplayDate, formatTooth } from './treatmentFormatters';
import type { TreatmentCategory, TreatmentRecordEntry } from './treatmentTypes';

interface Props {
  treatment: TreatmentRecordEntry;
  category: TreatmentCategory;
  onView: (treatmentId: string) => void;
  onEdit: (treatmentId: string) => void;
  onDelete: (treatmentId: string) => void;
}

const statusClassMap: Record<TreatmentRecordEntry['status'], string> = {
  Pending: 'treatment-status-badge--pending',
  Scheduled: 'treatment-status-badge--scheduled',
  'In Progress': 'treatment-status-badge--in-progress',
  Completed: 'treatment-status-badge--completed',
  Cancelled: 'treatment-status-badge--cancelled'
};

export function TreatmentCard({ treatment, category, onView, onEdit, onDelete }: Props) {
  return (
    <article className="treatment-card">
      <div className="treatment-card__main">
        <div>
          <span className="treatment-card__date">{formatDisplayDate(treatment.date)}</span>
          <h3>{treatment.procedure}</h3>
          <p>{treatment.description || category.label}</p>
        </div>
        <span className={`treatment-status-badge ${statusClassMap[treatment.status]}`}>{treatment.status}</span>
      </div>

      <dl className="treatment-card__details">
        <div><dt>Tooth</dt><dd>{formatTooth(treatment.toothNumber)}</dd></div>
        <div><dt>Dentist</dt><dd>{treatment.dentist}</dd></div>
        <div><dt>Category</dt><dd>{category.label}</dd></div>
        <div><dt>Amount</dt><dd>{formatCurrency(treatment.amount)}</dd></div>
      </dl>

      <div className="treatment-card__actions">
        <button type="button" className="btn btn-outline" onClick={() => onView(treatment.id)}>View</button>
        <button type="button" className="btn btn-outline" onClick={() => onEdit(treatment.id)}>Edit</button>
        <button type="button" className="btn btn-outline treatment-card__delete" onClick={() => onDelete(treatment.id)}>Delete</button>
      </div>
    </article>
  );
}
