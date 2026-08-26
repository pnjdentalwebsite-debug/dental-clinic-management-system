import { DentalTooth } from './DentalTooth';
import { DentalOdontogramTooth } from './DentalOdontogramTooth';
import type { DentalConditionConfig } from './dentalChartConfig';
import type {
  DentalChartQuadrant,
  DentalConditionId,
  DentalSurfaceId,
  ToothEntry
} from './dentalChartTypes';
import type { ToothNotationSystem } from './toothNotationHelper';

interface Props {
  quadrants: DentalChartQuadrant[];
  teethByNumber: Record<string, ToothEntry>;
  conditionsById: Record<string, DentalConditionConfig>;
  selectedToothNumber: string;
  activeCondition: DentalConditionId;
  notation?: ToothNotationSystem;
  onSelectTooth: (toothNumber: string, anchorRect?: DOMRect) => void;
  onSurfaceMark: (toothNumber: string, surface: DentalSurfaceId) => void;
}

const pediatricUpperRight = ['55', '54', '53', '52', '51'];
const pediatricUpperLeft = ['61', '62', '63', '64', '65'];
const pediatricLowerRight = ['85', '84', '83', '82', '81'];
const pediatricLowerLeft = ['71', '72', '73', '74', '75'];

export function ToothMap({
  quadrants,
  teethByNumber,
  conditionsById,
  selectedToothNumber,
  activeCondition,
  notation = 'FDI',
  onSelectTooth,
  onSurfaceMark
}: Props) {
  const [upperRight, upperLeft, lowerRight, lowerLeft] = quadrants;

  return (
    <section className="dental-chart-map" aria-label="Interactive dental chart">
      <div className="dental-chart-map__sheet">
        <ToothArchRow
          placement="upper"
          leftNumbers={pediatricUpperRight}
          rightNumbers={pediatricUpperLeft}
          teethByNumber={teethByNumber}
          conditionsById={conditionsById}
          selectedToothNumber={selectedToothNumber}
          activeCondition={activeCondition}
          notation={notation}
          onSelectTooth={onSelectTooth}
          onSurfaceMark={onSurfaceMark}
          pediatric
        />

        <ToothArchRow
          placement="upper"
          leftNumbers={upperRight.teeth}
          rightNumbers={upperLeft.teeth}
          teethByNumber={teethByNumber}
          conditionsById={conditionsById}
          selectedToothNumber={selectedToothNumber}
          activeCondition={activeCondition}
          notation={notation}
          onSelectTooth={onSelectTooth}
          onSurfaceMark={onSurfaceMark}
        />

        <div className="dental-chart-map__divider" aria-hidden="true" />

        <ToothArchRow
          placement="lower"
          leftNumbers={lowerRight.teeth}
          rightNumbers={lowerLeft.teeth}
          teethByNumber={teethByNumber}
          conditionsById={conditionsById}
          selectedToothNumber={selectedToothNumber}
          activeCondition={activeCondition}
          notation={notation}
          onSelectTooth={onSelectTooth}
          onSurfaceMark={onSurfaceMark}
        />

        <ToothArchRow
          placement="lower"
          leftNumbers={pediatricLowerRight}
          rightNumbers={pediatricLowerLeft}
          teethByNumber={teethByNumber}
          conditionsById={conditionsById}
          selectedToothNumber={selectedToothNumber}
          activeCondition={activeCondition}
          notation={notation}
          onSelectTooth={onSelectTooth}
          onSurfaceMark={onSurfaceMark}
          pediatric
        />
      </div>
    </section>
  );
}

function ToothArchRow({
  placement,
  leftNumbers,
  rightNumbers,
  teethByNumber,
  conditionsById,
  selectedToothNumber,
  activeCondition,
  notation = 'FDI',
  onSelectTooth,
  onSurfaceMark,
  pediatric = false
}: {
  placement: 'upper' | 'lower';
  leftNumbers: string[];
  rightNumbers: string[];
  teethByNumber: Record<string, ToothEntry>;
  conditionsById: Record<string, DentalConditionConfig>;
  selectedToothNumber: string;
  activeCondition: DentalConditionId;
  notation?: ToothNotationSystem;
  onSelectTooth: (toothNumber: string, anchorRect?: DOMRect) => void;
  onSurfaceMark: (toothNumber: string, surface: DentalSurfaceId) => void;
  pediatric?: boolean;
}) {
  return (
    <div className={`dental-chart-map__arch dental-chart-map__arch--${placement} ${pediatric ? 'is-pediatric' : ''}`}>
      <div className="dental-chart-map__arch-group">
        {leftNumbers.map((toothNumber) => (
          <ToothSlot
            key={toothNumber}
            toothNumber={toothNumber}
            placement={placement}
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            selectedToothNumber={selectedToothNumber}
            activeCondition={activeCondition}
            notation={notation}
            onSelectTooth={onSelectTooth}
            onSurfaceMark={onSurfaceMark}
          />
        ))}
      </div>
      <div className="dental-chart-map__arch-gap" aria-hidden="true" />
      <div className="dental-chart-map__arch-group">
        {rightNumbers.map((toothNumber) => (
          <ToothSlot
            key={toothNumber}
            toothNumber={toothNumber}
            placement={placement}
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            selectedToothNumber={selectedToothNumber}
            activeCondition={activeCondition}
            notation={notation}
            onSelectTooth={onSelectTooth}
            onSurfaceMark={onSurfaceMark}
          />
        ))}
      </div>
    </div>
  );
}

function ToothSlot({
  toothNumber,
  placement,
  teethByNumber,
  conditionsById,
  selectedToothNumber,
  activeCondition,
  notation = 'FDI',
  onSelectTooth,
  onSurfaceMark
}: {
  toothNumber: string;
  placement: 'upper' | 'lower';
  teethByNumber: Record<string, ToothEntry>;
  conditionsById: Record<string, DentalConditionConfig>;
  selectedToothNumber: string;
  activeCondition: DentalConditionId;
  notation?: ToothNotationSystem;
  onSelectTooth: (toothNumber: string, anchorRect?: DOMRect) => void;
  onSurfaceMark: (toothNumber: string, surface: DentalSurfaceId) => void;
}) {
  const tooth = teethByNumber[toothNumber];

  if (!tooth) {
    return <StaticToothPlaceholder toothNumber={toothNumber} placement={placement} />;
  }

  const condition = conditionsById[tooth.condition];

  return (
    <DentalTooth
      tooth={tooth}
      condition={condition || conditionsById['status-clear']}
      conditionsById={conditionsById}
      selected={selectedToothNumber === toothNumber}
      activeCondition={activeCondition}
      placement={placement}
      notation={notation}
      suppressHealthyCondition
      onOpenTags={onSelectTooth}
      onSurfaceMark={onSurfaceMark}
    />
  );
}

function StaticToothPlaceholder({
  toothNumber,
  placement
}: {
  toothNumber: string;
  placement: 'upper' | 'lower';
}) {
  const placeholderTooth: ToothEntry = {
    toothNumber,
    condition: 'healthy',
    notes: '',
    surfaces: [],
    surfaceMarkings: [],
    tags: [],
    createdAt: ''
  };

  return (
    <article className={`dental-odontogram-tooth dental-odontogram-tooth--${placement} is-placeholder`} aria-hidden="true">
      {placement === 'upper' ? (
        <>
        <div className="dental-procedure-box dental-procedure-box--static">
            <span className="dental-procedure-box__grid" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <span key={index} className="dental-procedure-box__cell" />
              ))}
            </span>
            <span className="dental-procedure-box__overflow is-empty">&nbsp;</span>
          </div>
          <span className="dental-odontogram-tooth__number dental-odontogram-tooth__number--static">{toothNumber}</span>
        </>
      ) : (
        <span className="dental-odontogram-tooth__number dental-odontogram-tooth__number--static">{toothNumber}</span>
      )}

      <div className="dental-odontogram-tooth__symbol">
        <DentalOdontogramTooth
          tooth={placeholderTooth}
          activeCondition="status-clear"
          conditionsById={{
            'status-clear': {
              id: 'status-clear',
              code: 'CLR',
              label: 'Clear',
              description: 'Clear',
              visualState: 'clear',
              surfaceColor: '#ffffff',
              borderColor: '#64748b',
              behavior: 'clear'
            }
          }}
          onSurfaceMark={() => undefined}
        />
      </div>

      {placement === 'upper' ? null : (
        <div className="dental-procedure-box dental-procedure-box--static">
          <span className="dental-procedure-box__grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className="dental-procedure-box__cell" />
            ))}
          </span>
          <span className="dental-procedure-box__overflow is-empty">&nbsp;</span>
        </div>
      )}

      <span className="dental-odontogram-tooth__condition dental-odontogram-tooth__condition--hidden" aria-hidden="true" />
    </article>
  );
}
