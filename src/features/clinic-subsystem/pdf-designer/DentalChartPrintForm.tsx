import { useMemo } from 'react';
import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';
import type { PatientPreviewItem } from '../patients/components/patientTypes';
import {
  getDentalConditionsById,
  type DentalConditionConfig
} from '../patients/clinical/dental-chart/dentalChartConfig';
import type {
  DentalChartRecord,
  DentalSurfaceId,
  ToothEntry
} from '../patients/clinical/dental-chart/dentalChartTypes';
import { odontogramSurfacePaths } from '../patients/clinical/dental-chart/odontogramGeometry';
import {
  buildPatientDocumentIdentity,
  getPatientDocumentDate
} from '../patients/components/patientDocumentData';
import {
  getToothNotationLabel,
  type ToothNotationSystem
} from '../patients/clinical/dental-chart/toothNotationHelper';

interface DentalChartPrintFormProps {
  clinicName: string;
  address: string;
  contact: string;
  chartTitle?: string;
  showClinicName?: boolean;
  showAddress?: boolean;
  showContact?: boolean;
  showLeftImage?: boolean;
  showLeftImageOutline?: boolean;
  showRightImage?: boolean;
  showLegend?: boolean;
  showFindings?: boolean;
  showRecommendations?: boolean;
  showFooter?: boolean;
  showTitle?: boolean;
  headerSettings?: Partial<DocumentHeaderSettings>;
  dentistName?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
  patient?: PatientPreviewItem;
  dentalChart?: DentalChartRecord;
  notation?: ToothNotationSystem;
}

const pediatricUpper = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
const permanentUpper = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const permanentLower = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
const pediatricLower = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];

const conditionLegend = [
  ['/', 'Present Teeth'],
  ['D', 'Decayed (Caries Indicated for Filling)'],
  ['M', 'Missing Due to Caries'],
  ['MO', 'Missing Due to Other Causes'],
  ['Im', 'Impacted Teeth'],
  ['Sp', 'Supernumerary Tooth'],
  ['Rf', 'Root Fragment'],
  ['Un', 'Unerupted']
];

const restorationLegend = [
  ['Am', 'Amalgam Filling'],
  ['Co', 'Composite Filling'],
  ['JC', 'Jacket Crown'],
  ['Ab', 'Abutment'],
  ['Att', 'Attachment'],
  ['P', 'Pontic'],
  ['In', 'Inlay'],
  ['Imp', 'Implant'],
  ['S', 'Sealants'],
  ['Rm', 'Removal Denture']
];

const surgeryLegend = [
  ['X', 'Extraction Due to Caries'],
  ['XO', 'Extraction Due to Other Causes']
];

const formatDentalChartDate = (value?: string) => {
  if (!value) return getPatientDocumentDate();
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DentalChartPrintForm({
  clinicName,
  address,
  contact,
  chartTitle = 'Dental Status Chart',
  showClinicName = true,
  showAddress = true,
  showContact = true,
  showLeftImage = true,
  showLeftImageOutline = true,
  showRightImage = true,
  showLegend = true,
  showFindings = true,
  showRecommendations = true,
  showFooter = true,
  showTitle = true,
  headerSettings,
  dentistName = '',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align',
  patient,
  dentalChart,
  notation
}: DentalChartPrintFormProps) {
  const identity = patient ? buildPatientDocumentIdentity(patient) : null;
  const conditionsById = useMemo(() => getDentalConditionsById(), []);
  const teethByNumber = useMemo(
    () => Object.fromEntries(
      (dentalChart?.teeth || []).map((tooth) => [tooth.toothNumber, tooth])
    ) as Record<string, ToothEntry>,
    [dentalChart?.teeth]
  );
  const patientDisplayName = identity?.fullName || [identity?.firstName, identity?.middleName, identity?.lastName].filter(Boolean).join(' ');
  const chartDate = formatDentalChartDate(dentalChart?.checkedDate);
  const activeNotation: ToothNotationSystem = notation || dentalChart?.toothNotation || 'FDI';

  return (
    <article className="dental-chart-print" data-pdf-print-root="dental-chart">
      <ConfigurableDocumentHeader
        settings={headerSettings ?? {
          clinicName,
          address,
          contact,
          showClinicName,
          showAddress,
          showContact,
          showLeftImage,
          showLeftImageOutline,
          showRightImage
        }}
      />

      <section className="dental-chart-print__patient-meta">
        <PrintLine label="Patient:" value={patientDisplayName} className="dental-chart-print__line--patient" valueClassName="dental-chart-print__line-value--strong" />
        <PrintLine label="Age/Sex:" value={identity ? `${identity.age} / ${identity.sex}` : '/'} className="dental-chart-print__line--compact" valueClassName="dental-chart-print__line-value--strong" />
        <PrintLine label="Date:" value={chartDate} className="dental-chart-print__line--date" valueClassName="dental-chart-print__line-value--strong" />
      </section>

      <section className="dental-chart-print__chart">
        <div className="dental-chart-print__chart-head">
          <span>Status<br />Right</span>
          <strong>{showTitle ? chartTitle : ''}</strong>
          <span>Left</span>
        </div>

        <div className="dental-chart-print__chart-body">
          <div className="dental-chart-print__row-label">Temporary<br />Teeth</div>
          <ToothArch
            teeth={pediatricUpper}
            position="upper"
            pediatric
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            notation={activeNotation}
          />

          <div className="dental-chart-print__row-label">Permanent<br />Teeth</div>
          <ToothArch
            teeth={permanentUpper}
            position="upper"
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            notation={activeNotation}
          />

          <div className="dental-chart-print__row-label">Permanent<br />Teeth</div>
          <ToothArch
            teeth={permanentLower}
            position="lower"
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            notation={activeNotation}
          />

          <div className="dental-chart-print__row-label">Temporary<br />Teeth</div>
          <ToothArch
            teeth={pediatricLower}
            position="lower"
            pediatric
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            notation={activeNotation}
          />
        </div>
      </section>

      {showLegend && (
        <section className="dental-chart-print__legend">
          <strong className="dental-chart-print__legend-label">Legend:</strong>
          <LegendColumn title="Condition" items={conditionLegend} />
          <LegendColumn title="Restorations & Prosthetics" items={restorationLegend} />
          <LegendColumn title="Surgery" items={surgeryLegend} />
          <div className="dental-chart-print__legend-column dental-chart-print__legend-column--xray">
            <h3>X-ray Taken</h3>
            <XrayLine label="Periapical Taken" suffix="(Tth no. __________)" />
            <XrayLine label="Panoramic" />
            <XrayLine label="Cephalometric" />
            <XrayLine label="Occlusal (Upper/Lower)" />
            <XrayLine label="Others:" />
          </div>
        </section>
      )}

      {showRecommendations && (
        <section className="dental-chart-print__recommendations">
          <h3>RECOMMENDATION:</h3>
          <div className="dental-chart-print__recommendation-grid">
            <div className="dental-chart-print__recommendation-options">
              <CheckLine
                label="ORAL PROPHYLAXIS"
                checked={dentalChart?.recommendationPlan.oralProphylaxis}
              />
              <CheckLine
                label="PROSTHODONTICS MANAGEMENT"
                checked={dentalChart?.recommendationPlan.prosthodonticsManagement}
              />
              <CheckLine
                label="ROOT CANAL TREATMENT (RCT)"
                checked={dentalChart?.recommendationPlan.rootCanalTreatment}
              />
              <CheckLine
                label="OTHERS"
                checked={dentalChart?.recommendationPlan.others}
              />
            </div>
            <div className="dental-chart-print__tooth-recommendations">
              <PrintLine
                label="TOOTH #"
                value={
                  dentalChart?.recommendationPlan.restorativeFillingToothNumber
                  || dentalChart?.recommendationPlan.toothNumber
                }
                valueClassName="dental-chart-print__line-value--strong"
              />
              <span className="dental-chart-print__recommendation-label">RESTORATIVE FILLING</span>
              <PrintLine
                label="TOOTH #"
                value={dentalChart?.recommendationPlan.extractionToothNumber}
                valueClassName="dental-chart-print__line-value--strong"
              />
              <span className="dental-chart-print__recommendation-label">TOOTH EXTRACTION</span>
            </div>
          </div>
        </section>
      )}

      {showFindings && (
        <section className="dental-chart-print__remarks">
          <h3>REMARKS:</h3>
          <div className="dental-chart-print__remarks-copy">
            {dentalChart?.remarks || dentalChart?.findings || ''}
          </div>
          <div className="dental-chart-print__remark-statuses">
            <label>
              <span className={`dental-chart-print__radio ${dentalChart?.status === 'dentally-fit' ? 'is-selected' : ''}`} />
              DENTALLY FIT
            </label>
            <label>
              <span className={`dental-chart-print__radio ${dentalChart?.status === 'for-compliance' ? 'is-selected' : ''}`} />
              FOR COMPLIANCE
            </label>
          </div>
        </section>
      )}

      {showFooter && (
        <footer className="dental-chart-print__footer">
          <div
            className="document-dentist-signoff"
            style={{ justifyItems: signaturePlacement === 'Center' ? 'center' : signaturePlacement === 'Left Align' ? 'start' : 'end' }}
          >
            {signatureImageData && (
              <img
                className="document-dentist-signature"
                src={signatureImageData}
                alt="Dentist signature"
                style={{ width: `${signatureSize}px` }}
              />
            )}
            <div className="dental-chart-print__footer-line">
              <PrintLine
                label="Checked By:"
                value={normalizeDentistName(dentalChart?.checkedBy || dentistName)}
                valueClassName="dental-chart-print__line-value--strong"
              />
            </div>
          </div>
          <PrintLine label="Date:" value={chartDate} className="dental-chart-print__line--footer-date" valueClassName="dental-chart-print__line-value--strong" />
        </footer>
      )}
    </article>
  );
}

function ToothArch({
  teeth,
  position,
  pediatric = false,
  teethByNumber,
  conditionsById,
  notation = 'FDI'
}: {
  teeth: string[];
  position: 'upper' | 'lower';
  pediatric?: boolean;
  teethByNumber: Record<string, ToothEntry>;
  conditionsById: Record<string, DentalConditionConfig>;
  notation?: ToothNotationSystem;
}) {
  const midpoint = Math.ceil(teeth.length / 2);
  const leftHalf = teeth.slice(0, midpoint);
  const rightHalf = teeth.slice(midpoint);

  return (
    <div
      className={`dental-chart-print__arch ${pediatric ? 'is-pediatric' : 'is-permanent'} is-${position}`}
    >
      <div className="dental-chart-print__arch-half is-left">
        {leftHalf.map((tooth) => (
          <PrintTooth
            key={tooth}
            number={tooth}
            position={position}
            tooth={teethByNumber[tooth]}
            conditionsById={conditionsById}
            notation={notation}
          />
        ))}
      </div>
      <div className="dental-chart-print__arch-half is-right">
        {rightHalf.map((tooth) => (
          <PrintTooth
            key={tooth}
            number={tooth}
            position={position}
            tooth={teethByNumber[tooth]}
            conditionsById={conditionsById}
            notation={notation}
          />
        ))}
      </div>
    </div>
  );
}

function PrintTooth({
  number,
  position,
  tooth,
  conditionsById,
  notation = 'FDI'
}: {
  number: string;
  position: 'upper' | 'lower';
  tooth?: ToothEntry;
  conditionsById: Record<string, DentalConditionConfig>;
  notation?: ToothNotationSystem;
}) {
  const tags = tooth?.tags || [];
  const visibleTags = tags.slice(0, 4);
  const overflowCount = Math.max(0, tags.length - 3);
  const displayLabel = getToothNotationLabel(number, notation);
  const codeBox = (
    <div className="dental-chart-print__code-box" aria-label={`Tooth ${displayLabel} (FDI ${number}) procedure code`}>
      {Array.from({ length: 4 }, (_, index) => (
        <span
          key={index}
          className={index === 3 && overflowCount > 0 ? 'has-overflow-count' : ''}
        >
          {index === 3 && overflowCount > 0 ? `+${overflowCount}` : visibleTags[index] || ''}
        </span>
      ))}
    </div>
  );
  const odontogram = (
    <svg
      className="dental-chart-print__tooth-svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Tooth ${displayLabel} (FDI ${number}) odontogram`}
    >
      {odontogramSurfacePaths.map(({ surface, path }) => {
        const condition = getPrintedSurfaceCondition(tooth, surface, conditionsById);

        return (
          <path
            key={surface}
            d={path}
            style={{
              fill: condition?.surfaceColor || '#ffffff',
              stroke: condition?.borderColor || '#8294af'
            }}
          />
        );
      })}
      <circle cx="50" cy="50" r="44" style={{ fill: 'none', stroke: '#8294af' }} />
    </svg>
  );

  return (
    <div className="dental-chart-print__tooth">
      {position === 'upper' && codeBox}
      {position === 'upper' && <strong>{displayLabel}</strong>}
      {odontogram}
      {position === 'lower' && <strong>{displayLabel}</strong>}
      {position === 'lower' && codeBox}
    </div>
  );
}

function getPrintedSurfaceCondition(
  tooth: ToothEntry | undefined,
  surface: DentalSurfaceId,
  conditionsById: Record<string, DentalConditionConfig>
) {
  if (!tooth) return undefined;

  const wholeToothCondition = conditionsById[tooth.condition];
  const marking = tooth.surfaceMarkings.find((item) => item.surface === surface);
  const conditionId = marking?.condition
    || (wholeToothCondition?.behavior === 'whole-tooth' ? tooth.condition : 'status-clear');

  return conditionsById[conditionId];
}

function LegendColumn({ title, items }: { title: string; items: string[][] }) {
  return (
    <div className="dental-chart-print__legend-column">
      <h3>{title}</h3>
      {items.map(([code, label]) => (
        <div key={`${title}-${code}`} className="dental-chart-print__legend-row">
          <strong>{code}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function XrayLine({ label, suffix = '' }: { label: string; suffix?: string }) {
  return (
    <div className="dental-chart-print__xray-row">
      <i>( )</i>
      <span>{label}</span>
      {suffix && <small>{suffix}</small>}
    </div>
  );
}

function CheckLine({ label, checked = false }: { label: string; checked?: boolean }) {
  return (
    <div className="dental-chart-print__check-line">
      <i className={checked ? 'is-checked' : ''}>{checked ? 'x' : ''}</i>
      <span>{label}</span>
    </div>
  );
}

function normalizeDentistName(value: string) {
  return /^no (doctor|dentist) selected/i.test(value.trim()) ? '' : value;
}

function PrintLine({
  label,
  value = '',
  className = '',
  valueClassName = ''
}: {
  label: string;
  value?: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`dental-chart-print__line ${className}`.trim()}>
      <strong>{label}</strong>
      <i className={valueClassName}>{value}</i>
    </div>
  );
}
