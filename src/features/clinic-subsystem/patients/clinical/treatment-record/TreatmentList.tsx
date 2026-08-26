import { TreatmentCard } from './TreatmentCard';
import type { TreatmentCategory, TreatmentRecordEntry } from './treatmentTypes';

interface Props {
  treatments: TreatmentRecordEntry[];
  categoriesById: Record<string, TreatmentCategory>;
  onAddFirst: () => void;
  onView: (treatmentId: string) => void;
  onEdit: (treatmentId: string) => void;
  onDelete: (treatmentId: string) => void;
}

export function TreatmentList({ treatments, categoriesById, onAddFirst, onView, onEdit, onDelete }: Props) {
  if (treatments.length === 0) {
    return (
      <div className="treatment-empty-state">
        <strong>No treatment records available for this patient.</strong>
        <p>Add treatment history to start building the patient's clinical timeline.</p>
        <button type="button" className="btn btn-primary" onClick={onAddFirst}>Add First Treatment</button>
      </div>
    );
  }

  return (
    <div className="treatment-list">
      {treatments.map((treatment) => (
        <TreatmentCard
          key={treatment.id}
          treatment={treatment}
          category={categoriesById[treatment.category]}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
