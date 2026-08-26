import { formatCurrency, formatDisplayDate, formatTooth } from './treatmentFormatters';
import type { TreatmentCategory, TreatmentRecordEntry } from './treatmentTypes';

interface Props {
  treatment: TreatmentRecordEntry | null;
  category?: TreatmentCategory;
}

export function TreatmentDetails({ treatment, category }: Props) {
  if (!treatment || !category) {
    return (
      <aside className="treatment-details treatment-details--empty">
        <strong>Treatment Details</strong>
        <p>Select a treatment record to review clinical details.</p>
      </aside>
    );
  }

  return (
    <aside className="treatment-details">
      <div className="treatment-details__header">
        <span>Treatment Details</span>
        <h3>{treatment.procedure}</h3>
        <p>{category.label}</p>
      </div>

      <dl className="treatment-details__list">
        <div><dt>Date</dt><dd>{formatDisplayDate(treatment.date)}</dd></div>
        <div><dt>Affected Tooth</dt><dd>{formatTooth(treatment.toothNumber)}</dd></div>
        <div><dt>Dentist</dt><dd>{treatment.dentist}</dd></div>
        <div><dt>Status</dt><dd>{treatment.status}</dd></div>
        <div><dt>Amount</dt><dd>{formatCurrency(treatment.amount)}</dd></div>
        <div><dt>Description</dt><dd>{treatment.description || 'No description provided.'}</dd></div>
        <div><dt>Notes</dt><dd>{treatment.notes || 'No notes recorded.'}</dd></div>
      </dl>
    </aside>
  );
}
