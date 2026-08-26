import type { DentalConditionOption, DentalSurfaceId, ToothEntry } from './dentalChartTypes';

interface Props {
  selectedTooth: ToothEntry;
  conditionOptions: DentalConditionOption[];
  selectedCondition: DentalConditionOption;
  surfaceOptions: DentalSurfaceId[];
  onConditionChange: (conditionId: DentalConditionOption['id']) => void;
  onSurfaceToggle: (surfaceId: DentalSurfaceId) => void;
  onNotesChange: (notes: string) => void;
}

const surfaceLabels: Record<DentalSurfaceId, string> = {
  mesial: 'Mesial',
  distal: 'Distal',
  buccal: 'Buccal',
  lingual: 'Lingual',
  occlusal: 'Occlusal'
};

export function ToothConditionPanel({
  selectedTooth,
  conditionOptions,
  selectedCondition,
  surfaceOptions,
  onConditionChange,
  onSurfaceToggle,
  onNotesChange
}: Props) {
  return (
    <aside className="tooth-condition-panel" aria-label="Selected tooth details">
      <div className="tooth-condition-panel__header">
        <span>Selected Tooth</span>
        <strong>{selectedTooth.toothNumber}</strong>
        <p>{selectedCondition.description}</p>
      </div>

      <div className="tooth-condition-panel__section">
        <h4>Condition</h4>
        <div className="tooth-condition-panel__conditions">
          {conditionOptions.map((condition) => (
            <button
              key={condition.id}
              type="button"
              className={`dental-condition-button dental-condition-button--${condition.visualState} ${selectedTooth.condition === condition.id ? 'is-active' : ''}`}
              onClick={() => onConditionChange(condition.id)}
            >
              <strong>{condition.label}</strong>
              <span>{condition.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tooth-condition-panel__section">
        <h4>Surface Marking</h4>
        <div className="tooth-condition-panel__surfaces">
          {surfaceOptions.map((surface) => {
            const active = selectedTooth.surfaces.includes(surface);
            return (
              <button
                key={surface}
                type="button"
                className={`dental-surface-button ${active ? 'is-active' : ''}`}
                onClick={() => onSurfaceToggle(surface)}
                aria-pressed={active}
              >
                {surfaceLabels[surface]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="tooth-condition-panel__notes">
        <span>Tooth Notes</span>
        <textarea
          rows={4}
          value={selectedTooth.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Add tooth-specific notes..."
        />
      </label>
    </aside>
  );
}
