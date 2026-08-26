import type { CSSProperties, KeyboardEvent } from 'react';
import type { DentalConditionConfig } from './dentalChartConfig';
import type {
  DentalConditionId,
  DentalSurfaceId,
  ToothEntry
} from './dentalChartTypes';
import { odontogramSurfacePaths } from './odontogramGeometry';

interface Props {
  tooth: ToothEntry;
  activeCondition: DentalConditionId;
  conditionsById: Record<DentalConditionId, DentalConditionConfig>;
  onSurfaceMark: (surface: DentalSurfaceId) => void;
  interactive?: boolean;
}

const surfaceLabels: Record<DentalSurfaceId, string> = {
  mesial: 'Mesial',
  distal: 'Distal',
  buccal: 'Buccal',
  lingual: 'Lingual',
  occlusal: 'Occlusal'
};

type SurfaceStyle = CSSProperties & {
  '--dental-surface-fill': string;
  '--dental-surface-border': string;
};

export function DentalOdontogramTooth({
  tooth,
  activeCondition,
  conditionsById,
  onSurfaceMark,
  interactive = true
}: Props) {
  const toothCondition = conditionsById[tooth.condition] || conditionsById['status-clear'];
  const isWholeToothCondition = toothCondition?.behavior === 'whole-tooth';

  const handleSurfaceKeyDown = (
    event: KeyboardEvent<SVGPathElement>,
    surface: DentalSurfaceId
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSurfaceMark(surface);
    }
  };

  return (
    <svg
      className="dental-odontogram-symbol"
      viewBox="0 0 100 100"
      role="group"
      aria-label={`Five-surface dental odontogram for tooth ${tooth.toothNumber}`}
    >
      <title>Tooth {tooth.toothNumber} odontogram</title>
      {odontogramSurfacePaths.map(({ surface, path }) => {
        const marking = tooth.surfaceMarkings.find((item) => item.surface === surface);
        const surfaceCondition = marking?.condition
          ?? (isWholeToothCondition ? tooth.condition : 'status-clear');
        const condition = conditionsById[surfaceCondition] || conditionsById['status-clear'];
        const style: SurfaceStyle = {
          '--dental-surface-fill': condition.surfaceColor,
          '--dental-surface-border': condition.borderColor
        };

        return (
          <path
            key={surface}
            d={path}
            className={`dental-odontogram-symbol__surface ${surfaceCondition !== 'healthy' ? 'is-marked' : ''}`}
            style={style}
            onClick={interactive ? () => onSurfaceMark(surface) : undefined}
            onKeyDown={interactive ? (event) => handleSurfaceKeyDown(event, surface) : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : -1}
            aria-label={`${surfaceLabels[surface]} surface, ${condition.label}. Apply ${(conditionsById[activeCondition] || conditionsById['status-clear']).label}.`}
            aria-pressed={interactive ? surfaceCondition !== 'status-clear' : undefined}
          >
            <title>{surfaceLabels[surface]}: {condition.label}</title>
          </path>
        );
      })}
      <circle
        className="dental-odontogram-symbol__outline"
        cx="50"
        cy="50"
        r="44"
        aria-hidden="true"
      />
    </svg>
  );
}
