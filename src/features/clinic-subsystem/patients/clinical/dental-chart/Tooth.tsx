import type { DentalConditionId, DentalConditionOption, DentalSurfaceId, ToothEntry } from './dentalChartTypes';

interface Props {
  tooth: ToothEntry;
  condition: DentalConditionOption;
  selected: boolean;
  activeCondition: DentalConditionId;
  onSelect: (toothNumber: string) => void;
  onSurfaceMark: (toothNumber: string, surface: DentalSurfaceId) => void;
}

const surfaceLabels: Record<DentalSurfaceId, string> = {
  mesial: 'M',
  distal: 'D',
  buccal: 'B',
  lingual: 'L',
  occlusal: 'O'
};

const surfaceClassMap: Record<DentalSurfaceId, string> = {
  mesial: 'left',
  distal: 'right',
  buccal: 'bottom',
  lingual: 'top',
  occlusal: 'center'
};

const surfaceOrder: DentalSurfaceId[] = ['lingual', 'distal', 'buccal', 'mesial', 'occlusal'];

const getSurfaceCondition = (tooth: ToothEntry, surface: DentalSurfaceId) =>
  tooth.surfaceMarkings.find((marking) => marking.surface === surface)?.condition;

export function Tooth({ tooth, condition, selected, activeCondition, onSelect, onSurfaceMark }: Props) {
  const surfaceSummary = tooth.surfaceMarkings.map((marking) => surfaceLabels[marking.surface]).join('');
  const toothMissing = tooth.condition === 'missing';

  return (
    <div
      className={`dental-tooth dental-tooth--${condition.visualState} ${selected ? 'is-selected' : ''}`}
      aria-label={`Tooth ${tooth.toothNumber}, ${condition.label}, active mode ${activeCondition}`}
    >
      <button type="button" className="dental-tooth__number" onClick={() => onSelect(tooth.toothNumber)}>
        {tooth.toothNumber}
      </button>

      <span className="dental-tooth__shape">
        {surfaceOrder.map((surface) => {
          const markedCondition = getSurfaceCondition(tooth, surface);

          return (
            <button
              key={surface}
              type="button"
              className={`dental-tooth__surface dental-tooth__surface--${surfaceClassMap[surface]} ${markedCondition ? `is-${markedCondition}` : ''}`}
              disabled={toothMissing}
              onClick={() => {
                onSelect(tooth.toothNumber);
                onSurfaceMark(tooth.toothNumber, surface);
              }}
              title={`${surfaceLabels[surface]} surface`}
              aria-label={`Mark ${surface} surface for tooth ${tooth.toothNumber}`}
            />
          );
        })}
      </span>

      <span className="dental-tooth__condition">{condition.label}</span>
      {surfaceSummary && <span className="dental-tooth__surfaces">{surfaceSummary}</span>}
      {tooth.tags.length > 0 && <span className="dental-tooth__tags">{tooth.tags.slice(0, 3).join(' ')}</span>}
    </div>
  );
}
