import type { CSSProperties } from 'react';
import type { DentalConditionConfig } from './dentalChartConfig';
import { DentalOdontogramTooth } from './DentalOdontogramTooth';
import { DentalProcedureTagBox } from './DentalProcedureTagBox';
import type {
  DentalConditionId,
  DentalSurfaceId,
  ToothEntry
} from './dentalChartTypes';
import { getToothNotationLabel, type ToothNotationSystem } from './toothNotationHelper';

interface Props {
  tooth: ToothEntry;
  condition: DentalConditionConfig;
  conditionsById: Record<DentalConditionId, DentalConditionConfig>;
  selected: boolean;
  activeCondition: DentalConditionId;
  placement?: 'upper' | 'lower';
  suppressHealthyCondition?: boolean;
  notation?: ToothNotationSystem;
  onOpenTags: (toothNumber: string, anchorRect?: DOMRect) => void;
  onSurfaceMark: (toothNumber: string, surface: DentalSurfaceId) => void;
}

type ConditionStyle = CSSProperties & {
  '--dental-condition-color': string;
};

export function DentalTooth({
  tooth,
  condition,
  conditionsById,
  selected,
  activeCondition,
  placement = 'upper',
  suppressHealthyCondition = false,
  notation = 'FDI',
  onOpenTags,
  onSurfaceMark
}: Props) {
  const conditionStyle: ConditionStyle = {
    '--dental-condition-color': condition.surfaceColor
  };
  const showCondition = !(suppressHealthyCondition && condition.behavior === 'clear');
  const isUpper = placement === 'upper';
  const displayLabel = getToothNotationLabel(tooth.toothNumber, notation);

  return (
    <article
      className={`dental-odontogram-tooth dental-odontogram-tooth--${placement} ${selected ? 'is-selected' : ''}`}
      aria-label={`Tooth ${displayLabel} (FDI ${tooth.toothNumber}), ${condition.label}`}
    >
      {isUpper ? (
        <>
          <DentalProcedureTagBox
            toothNumber={tooth.toothNumber}
            tags={tooth.tags}
            onOpen={(anchorRect) => onOpenTags(tooth.toothNumber, anchorRect)}
          />
          <button
            type="button"
            className="dental-odontogram-tooth__number"
            onClick={() => onOpenTags(tooth.toothNumber)}
            title={`Tooth ${displayLabel} (FDI ${tooth.toothNumber})`}
          >
            {displayLabel}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="dental-odontogram-tooth__number"
            onClick={() => onOpenTags(tooth.toothNumber)}
            title={`Tooth ${displayLabel} (FDI ${tooth.toothNumber})`}
          >
            {displayLabel}
          </button>
        </>
      )}

      <DentalOdontogramTooth
        tooth={tooth}
        activeCondition={activeCondition}
        conditionsById={conditionsById}
        onSurfaceMark={(surface) => onSurfaceMark(tooth.toothNumber, surface)}
      />

      {isUpper ? null : (
        <DentalProcedureTagBox
          toothNumber={tooth.toothNumber}
          tags={tooth.tags}
          onOpen={(anchorRect) => onOpenTags(tooth.toothNumber, anchorRect)}
        />
      )}

      {showCondition ? (
        <button
          type="button"
          className="dental-odontogram-tooth__condition"
          style={conditionStyle}
          onClick={() => onOpenTags(tooth.toothNumber)}
        >
          <span aria-hidden="true" />
          {condition.label}
        </button>
      ) : (
        <span className="dental-odontogram-tooth__condition dental-odontogram-tooth__condition--hidden" aria-hidden="true" />
      )}
    </article>
  );
}
