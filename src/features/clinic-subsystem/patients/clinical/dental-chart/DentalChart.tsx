import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type RefObject,
  type SetStateAction
} from 'react';
import { DentalOdontogramTooth } from './DentalOdontogramTooth';
import { DentalProcedureTagBox } from './DentalProcedureTagBox';
import { ToothMap } from './ToothMap';
import {
  getDentalConditionOptions,
  getDentalConditionsById,
  getDentalTagGroups
} from './dentalChartConfig';
import type {
  DentalConditionConfig,
  DentalTagGroup
} from './dentalChartConfig';
import type {
  DentalChartQuadrant,
  DentalChartRecord,
  DentalConditionId,
  DentalSurfaceId,
  ToothEntry
} from './dentalChartTypes';

import { DatePicker } from '../../../../../components/overlays/DatePicker';
import { masterFileDirectoryService } from '../../../master-files/masterFileDirectoryService';
import {
  getToothNotationLabel,
  type ToothNotationSystem
} from './toothNotationHelper';
import {
  branchSettingsStore,
  BRANCH_SETTINGS_UPDATED_EVENT
} from '../../../settings/services/branchSettingsStore';

interface Props {
  chart: DentalChartRecord;
  onChartChange: Dispatch<SetStateAction<DentalChartRecord>>;
  readOnly?: boolean;
}

interface MultiSelectionRow {
  id: string;
  label: string;
  helper: string;
  placement: 'upper' | 'lower';
  teeth: string[];
}

const adultQuadrants: DentalChartQuadrant[] = [
  { id: 'upper-right', label: 'Upper Right 18-11', teeth: ['18', '17', '16', '15', '14', '13', '12', '11'] },
  { id: 'upper-left', label: 'Upper Left 21-28', teeth: ['21', '22', '23', '24', '25', '26', '27', '28'] },
  { id: 'lower-right', label: 'Lower Right 48-41', teeth: ['48', '47', '46', '45', '44', '43', '42', '41'] },
  { id: 'lower-left', label: 'Lower Left 31-38', teeth: ['31', '32', '33', '34', '35', '36', '37', '38'] }
];

const multiSelectionRows: MultiSelectionRow[] = [
  {
    id: 'upper-primary',
    label: 'Upper Arc (Primary)',
    helper: 'Primary upper teeth 55-51 and 61-65.',
    placement: 'upper',
    teeth: ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
  },
  {
    id: 'upper-permanent',
    label: 'Upper Arc (Permanent)',
    helper: 'Permanent upper teeth 18-11 and 21-28.',
    placement: 'upper',
    teeth: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28']
  },
  {
    id: 'lower-permanent',
    label: 'Lower Arc (Permanent)',
    helper: 'Permanent lower teeth 48-41 and 31-38.',
    placement: 'lower',
    teeth: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
  },
  {
    id: 'lower-primary',
    label: 'Lower Arc (Primary)',
    helper: 'Primary lower teeth 85-81 and 71-75.',
    placement: 'lower',
    teeth: ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75']
  }
];

const allSurfaceIds: DentalSurfaceId[] = ['mesial', 'distal', 'buccal', 'lingual', 'occlusal'];
const maxToothTagCount = 4;

function findRowIndexForTooth(toothNumber: string) {
  const index = multiSelectionRows.findIndex((row) => row.teeth.includes(toothNumber));
  return index >= 0 ? index : 0;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildSelectedTagGroups(
  selectedTeeth: ToothEntry[],
  tagGroups: DentalTagGroup[]
) {
  return tagGroups
    .map((group) => ({
      title: group.title,
      category: group.category,
      tags: uniqueValues(
        selectedTeeth.flatMap((tooth) =>
          tooth.tags.filter((tagCode) => group.tags.some((tag) => tag.code === tagCode))
        )
      )
    }))
    .filter((group) => group.tags.length > 0);
}

export function DentalChart({ chart, onChartChange: setChart, readOnly = false }: Props) {
  const [selectedToothNumber, setSelectedToothNumber] = useState('18');
  const [chartMode, setChartMode] = useState<'inline' | 'multiple'>('inline');
  const [multiEditMode, setMultiEditMode] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState(() => findRowIndexForTooth('55'));
  const [selectedMultipleToothNumbers, setSelectedMultipleToothNumbers] = useState<string[]>([]);
  const [notation, setNotation] = useState<ToothNotationSystem>(() => {
    if (chart.toothNotation) return chart.toothNotation;
    try {
      return (branchSettingsStore.getSettings('CLN-000013').clinicalDefaults.toothNumberingSystem as ToothNotationSystem) || 'FDI';
    } catch {
      return 'FDI';
    }
  });

  useEffect(() => {
    if (chart.toothNotation) {
      setNotation(chart.toothNotation);
    }
  }, [chart.toothNotation, chart.id]);

  useEffect(() => {
    const handleBranchSettingsSync = (e: any) => {
      if (!chart.toothNotation && e?.detail?.clinicalDefaults?.toothNumberingSystem) {
        setNotation(e.detail.clinicalDefaults.toothNumberingSystem);
      }
    };
    window.addEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleBranchSettingsSync);
    return () => window.removeEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleBranchSettingsSync);
  }, [chart.toothNotation]);

  const conditionOptions = useMemo(() => getDentalConditionOptions(), []);
  const conditionsById = useMemo(() => getDentalConditionsById(), []);
  const tagGroups = useMemo(() => getDentalTagGroups(), []);
  const intraOralApplianceOptions = useMemo(() => masterFileDirectoryService.getActiveTagRecords('intra-oral-appliance'), []);
  const occlusionIndexOptions = useMemo(() => masterFileDirectoryService.getActiveTagRecords('occlusion-index'), []);
  const periodontalPsrOptions = useMemo(() => masterFileDirectoryService.getActiveTagRecords('periodontal-psr'), []);
  const tmjAssessmentOptions = useMemo(() => masterFileDirectoryService.getActiveTagRecords('tmj-assessment'), []);
  const [activeCondition, setActiveCondition] = useState<DentalConditionId>(conditionOptions[0]?.id || 'status-clear');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnchorRect, setModalAnchorRect] = useState<DOMRect | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const teethByNumber = useMemo(
    () => Object.fromEntries(chart.teeth.map((tooth) => [tooth.toothNumber, tooth])) as Record<string, ToothEntry>,
    [chart.teeth]
  );
  const selectedTooth = teethByNumber[selectedToothNumber] || chart.teeth[0];
  const focusedRow = multiSelectionRows[focusedRowIndex];
  const focusedRowTeeth = useMemo(
    () => focusedRow.teeth.map((toothNumber) => teethByNumber[toothNumber]).filter(Boolean),
    [focusedRow, teethByNumber]
  );
  const selectedMultipleTeeth = useMemo(
    () => selectedMultipleToothNumbers.map((toothNumber) => teethByNumber[toothNumber]).filter(Boolean),
    [selectedMultipleToothNumbers, teethByNumber]
  );
  const selectionPreviewTooth = selectedMultipleTeeth[0] || focusedRowTeeth[0] || chart.teeth[0];
  const selectedConditionCodes = uniqueValues(
    selectedMultipleTeeth.map((tooth) => conditionsById[tooth.condition]?.code || '')
  );
  const selectedConditionLabels = uniqueValues(
    selectedMultipleTeeth.map((tooth) => conditionsById[tooth.condition]?.label || '')
  );
  const selectedTagGroups = useMemo(
    () => buildSelectedTagGroups(selectedMultipleTeeth, tagGroups),
    [selectedMultipleTeeth, tagGroups]
  );

  useEffect(() => {
    if (!modalOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setModalOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (chartMode === 'multiple') {
      setFocusedRowIndex(findRowIndexForTooth(selectedToothNumber));
      setModalOpen(false);
    }
  }, [chartMode, selectedToothNumber]);

  useEffect(() => {
    setSelectedMultipleToothNumbers((current) =>
      current.filter((toothNumber) => focusedRow.teeth.includes(toothNumber))
    );
  }, [focusedRow]);

  useEffect(() => {
    if (readOnly) {
      setMultiEditMode(false);
    }
  }, [readOnly]);

  const updateTooth = (toothNumber: string, updater: (tooth: ToothEntry) => ToothEntry) => {
    if (readOnly) return;
    setChart((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      teeth: current.teeth.map((tooth) => (tooth.toothNumber === toothNumber ? updater(tooth) : tooth))
    }));
  };

  const updateTeeth = (toothNumbers: string[], updater: (tooth: ToothEntry) => ToothEntry) => {
    if (readOnly) return;
    if (toothNumbers.length === 0) {
      return;
    }

    const selectedToothNumbersSet = new Set(toothNumbers);
    setChart((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      teeth: current.teeth.map((tooth) =>
        selectedToothNumbersSet.has(tooth.toothNumber) ? updater(tooth) : tooth
      )
    }));
  };

  const applyConditionToTeeth = (toothNumbers: string[], surface: DentalSurfaceId) => {
    const activeStatus = conditionsById[activeCondition] || conditionOptions[0];

    if (!activeStatus || toothNumbers.length === 0) {
      return;
    }

    updateTeeth(toothNumbers, (tooth) => {
      if (activeStatus.behavior === 'clear') {
        const nextSurfaceMarkings = tooth.surfaceMarkings.filter((marking) => marking.surface !== surface);
        const nextSurfaces = tooth.surfaces.filter((item) => item !== surface);

        return {
          ...tooth,
          condition: nextSurfaceMarkings[0]?.condition || 'status-clear',
          surfaces: nextSurfaces,
          surfaceMarkings: nextSurfaceMarkings
        };
      }

      if (activeStatus.behavior === 'whole-tooth') {
        return {
          ...tooth,
          condition: activeStatus.id,
          surfaces: [...allSurfaceIds],
          surfaceMarkings: allSurfaceIds.map((surfaceId) => ({
            surface: surfaceId,
            condition: activeStatus.id
          }))
        };
      }

      const nextMarkings = tooth.surfaceMarkings.filter((marking) => marking.surface !== surface);

      return {
        ...tooth,
        condition: activeStatus.id,
        surfaces: Array.from(new Set([...tooth.surfaces, surface])),
        surfaceMarkings: [...nextMarkings, { surface, condition: activeStatus.id }]
      };
    });
  };

  const handleSurfaceMark = (toothNumber: string, surface: DentalSurfaceId) => {
    applyConditionToTeeth([toothNumber], surface);
  };

  const toggleToothTag = (tagCode: string) => {
    updateTooth(selectedTooth.toothNumber, (tooth) => ({
      ...tooth,
      tags: tooth.tags.includes(tagCode)
        ? tooth.tags.filter((tag) => tag !== tagCode)
        : tooth.tags.length >= maxToothTagCount
          ? tooth.tags
          : [...tooth.tags, tagCode]
    }));
  };

  const toggleSelectedToothTag = (tagCode: string) => {
    if (selectedMultipleTeeth.length === 0) {
      return;
    }

    const removeFromAll = selectedMultipleTeeth.every((tooth) => tooth.tags.includes(tagCode));

    updateTeeth(selectedMultipleToothNumbers, (tooth) => {
      if (removeFromAll) {
        return {
          ...tooth,
          tags: tooth.tags.filter((tag) => tag !== tagCode)
        };
      }

      if (tooth.tags.includes(tagCode) || tooth.tags.length >= maxToothTagCount) {
        return tooth;
      }

      return {
        ...tooth,
        tags: [...tooth.tags, tagCode]
      };
    });
  };

  const updateSelectedToothNotes = (notes: string) => {
    updateTooth(selectedTooth.toothNumber, (tooth) => ({ ...tooth, notes }));
  };

  const handleChartTextChange = (field: 'findings' | 'recommendations' | 'remarks', value: string) => {
    if (readOnly) return;
    setChart((current) => ({
      ...current,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const toggleAssessmentSelection = (
    field: 'intraOralAppliances' | 'occlusionIndexSelections' | 'periodontalPsrSelections' | 'tmjAssessmentSelections',
    optionName: string
  ) => {
    if (readOnly) return;
    setChart((current) => {
      const currentValues = current[field] || [];
      const nextValues = currentValues.includes(optionName)
        ? currentValues.filter((value) => value !== optionName)
        : [...currentValues, optionName];

      return {
        ...current,
        [field]: nextValues,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const updatePlan = (field: keyof DentalChartRecord['recommendationPlan'], value: string | boolean) => {
    if (readOnly) return;
    setChart((current) => ({
      ...current,
      recommendationPlan: { ...current.recommendationPlan, [field]: value },
      updatedAt: new Date().toISOString()
    }));
  };

  const toggleMultipleToothSelection = (toothNumber: string) => {
    setSelectedToothNumber(toothNumber);
    setSelectedMultipleToothNumbers((current) =>
      current.includes(toothNumber)
        ? current.filter((value) => value !== toothNumber)
        : [...current, toothNumber]
    );
  };

  const showInlineMode = chartMode === 'inline';

  return (
    <div className="dental-chart-module">
      <section className="patient-record__card dental-chart-module__hero">
        <div>
          <h3>Clinical Dental Chart</h3>
          <span>Inline single-tooth charting plus row-focused multiple-selection editing.</span>
        </div>
      </section>
      <div className="dental-chart-top-panel">
        <div className="dental-chart-top-row">
          <label className="dental-chart-field">
            <span>Present Medical Condition</span>
            <input
              type="text"
              value={chart.presentMedicalCondition || ''}
              onChange={(e) => setChart((curr) => ({ ...curr, presentMedicalCondition: e.target.value }))}
              placeholder="Describe condition (e.g. Hypertension)"
              disabled={readOnly}
            />
          </label>
          <label className="dental-chart-field">
            <span>Present Medications</span>
            <input
              type="text"
              value={chart.presentMedications || ''}
              onChange={(e) => setChart((curr) => ({ ...curr, presentMedications: e.target.value }))}
              placeholder="Active medications"
              disabled={readOnly}
            />
          </label>
          <label className="dental-chart-field">
            <span>Allergies to Medications</span>
            <input
              type="text"
              value={chart.allergiesToMedications || ''}
              onChange={(e) => setChart((curr) => ({ ...curr, allergiesToMedications: e.target.value }))}
              placeholder="Allergies (e.g. Penicillin)"
              disabled={readOnly}
            />
          </label>
        </div>
        <div className="dental-chart-top-row-2">
          <div className="dental-chart-field">
            <span>Recall Date</span>
            <DatePicker
              value={chart.recallDate || ''}
              onChange={(val) => setChart((curr) => ({ ...curr, recallDate: val }))}
              disabled={readOnly}
            />
          </div>
          <label className="dental-chart-field">
            <span>Extraoral Examination</span>
            <input
              type="text"
              value={chart.findings || ''}
              onChange={(e) => setChart((curr) => ({ ...curr, findings: e.target.value }))}
              placeholder="Asymmetry, lymph nodes, joints..."
              disabled={readOnly}
            />
          </label>
        </div>
      </div>

      {/* Tooth Numbering System Selector Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          marginBottom: '0.5rem'
        }}
      >
        <label
          htmlFor="tooth-notation-select"
          style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          TOOTH NUMBERING:
        </label>
        <select
          id="tooth-notation-select"
          value={notation}
          onChange={(e) => {
            const next = e.target.value as ToothNotationSystem;
            setNotation(next);
            if (!readOnly) {
              setChart((curr) => ({
                ...curr,
                toothNotation: next,
                updatedAt: new Date().toISOString()
              }));
            }
          }}
          disabled={readOnly}
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--background)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(79, 123, 245, 0.15)'
          }}
        >
          <option value="FDI">FDI (ISO-3950 Two-Digit 11–48 / 51–85)</option>
          <option value="Universal">Universal (ADA) (1–32 / A–T)</option>
          <option value="Palmer">Palmer Notation (1–8 / A–E with Quadrants)</option>
        </select>
      </div>

      <section className="patient-record__card dental-chart-mode-switcher">
        <div className="dental-chart-mode-switcher__tabs" role="tablist" aria-label="Dental chart mode">
          <button
            type="button"
            role="tab"
            aria-selected={showInlineMode}
            className={`dental-chart-mode-switcher__tab ${showInlineMode ? 'is-active' : ''}`}
            onClick={() => {
              setChartMode('inline');
              setMultiEditMode(false);
              setSelectedMultipleToothNumbers([]);
            }}
          >
            Inline Surfaces
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!showInlineMode}
            className={`dental-chart-mode-switcher__tab ${!showInlineMode ? 'is-active' : ''}`}
            onClick={() => setChartMode('multiple')}
          >
            Charting w/ Multiple Selection
          </button>
        </div>
      </section>

      {showInlineMode ? (
        <section className="dental-chart-module__map-card">
          <div className="dental-chart-status-toolbar">
            {conditionOptions.map((condition) => (
              <button
                key={condition.id}
                type="button"
                className={`dental-chart-status-chip ${activeCondition === condition.id ? 'is-active' : ''}`}
                onClick={() => setActiveCondition(condition.id)}
              >
                <span style={{ backgroundColor: condition.surfaceColor, borderColor: condition.borderColor }} aria-hidden="true" />
                {condition.label}
              </button>
            ))}
          </div>
          <ToothMap
            quadrants={adultQuadrants}
            teethByNumber={teethByNumber}
            conditionsById={conditionsById}
            selectedToothNumber={selectedTooth.toothNumber}
            activeCondition={activeCondition}
            notation={notation}
            onSelectTooth={(toothNumber, anchorRect) => {
              setSelectedToothNumber(toothNumber);
              setModalAnchorRect(anchorRect ?? null);
              setModalOpen(true);
            }}
            onSurfaceMark={handleSurfaceMark}
          />
        </section>
      ) : (
        <>
          <section className="patient-record__card dental-chart-multi-toolbar">
            <div className="dental-chart-multi-toolbar__buttons">
              <button
                type="button"
                className="dental-chart-multi-toolbar__button"
                onClick={() => {
                  setFocusedRowIndex((current) => Math.max(0, current - 1));
                  setSelectedMultipleToothNumbers([]);
                }}
                disabled={focusedRowIndex === 0}
              >
                Prev
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className={`dental-chart-multi-toolbar__button ${multiEditMode ? 'is-active' : ''}`}
                  onClick={() => {
                    setMultiEditMode(true);
                    setSelectedMultipleToothNumbers([]);
                  }}
                >
                  Edit Multiple
                </button>
              )}
              <button
                type="button"
                className={`dental-chart-multi-toolbar__button ${!multiEditMode ? 'is-active is-dark' : ''}`}
                onClick={() => {
                  setMultiEditMode(false);
                  setSelectedMultipleToothNumbers([]);
                }}
              >
                View Chart
              </button>
              <button
                type="button"
                className="dental-chart-multi-toolbar__button"
                onClick={() => {
                  setFocusedRowIndex((current) => Math.min(multiSelectionRows.length - 1, current + 1));
                  setSelectedMultipleToothNumbers([]);
                }}
                disabled={focusedRowIndex === multiSelectionRows.length - 1}
              >
                Next
              </button>
            </div>
          </section>

          {multiEditMode ? (
            <>
              <section className="patient-record__card dental-chart-row-focus">
                <p className="patient-clinical-workspace__eyebrow">{focusedRow.label}</p>
                <p className="dental-chart-row-focus__helper">{focusedRow.helper}</p>
                <div className="dental-chart-row-focus__teeth">
                  {focusedRowTeeth.map((tooth) => (
                    <SelectableChartTooth
                      key={tooth.toothNumber}
                      tooth={tooth}
                      placement={focusedRow.placement}
                      condition={conditionsById[tooth.condition] || conditionsById['status-clear']}
                      conditionsById={conditionsById}
                      selected={selectedMultipleToothNumbers.includes(tooth.toothNumber)}
                      notation={notation}
                      onToggle={() => toggleMultipleToothSelection(tooth.toothNumber)}
                    />
                  ))}
                </div>
              </section>

              <section className="patient-record__card dental-chart-multi-editor">
                <aside className="dental-chart-multi-editor__panel dental-chart-multi-editor__panel--status">
                  <p className="patient-clinical-workspace__eyebrow">Tooth Status</p>
                  <div className="dental-chart-multi-editor__status-list">
                    {conditionOptions.map((condition) => (
                      <button
                        key={condition.id}
                        type="button"
                        className={`dental-chart-multi-editor__status-option ${activeCondition === condition.id ? 'is-active' : ''}`}
                        onClick={() => setActiveCondition(condition.id)}
                      >
                        <span
                          className="dental-chart-multi-editor__status-swatch"
                          style={{ backgroundColor: condition.surfaceColor, borderColor: condition.borderColor }}
                          aria-hidden="true"
                        />
                        {condition.label}
                      </button>
                    ))}
                  </div>
                </aside>

                <div className="dental-chart-multi-editor__panel dental-chart-multi-editor__panel--preview">
                  <div className="dental-chart-multi-editor__selection-card">
                    <p className="patient-clinical-workspace__eyebrow">Selected Tooth</p>
                    <strong>{selectedMultipleToothNumbers.length > 0 ? selectedMultipleToothNumbers.join(', ') : 'None selected'}</strong>
                    <p>
                      {selectedMultipleToothNumbers.length > 0
                        ? `Applying updates to ${focusedRow.label}.`
                        : 'Select one or more teeth from the current row to begin multiple charting.'}
                    </p>
                  </div>
                  <p className="dental-chart-multi-editor__instruction">
                    Select a Tooth Status or Clear, then click a surface to apply it to the selected tooth/teeth.
                  </p>
                  <div className="dental-chart-multi-editor__big-tooth">
                    <DentalOdontogramTooth
                      tooth={selectionPreviewTooth}
                      activeCondition={activeCondition}
                      conditionsById={conditionsById}
                      onSurfaceMark={(surface) => applyConditionToTeeth(selectedMultipleToothNumbers, surface)}
                      interactive={selectedMultipleToothNumbers.length > 0}
                    />
                  </div>
                </div>

                <aside className="dental-chart-multi-editor__panel dental-chart-multi-editor__panel--tags">
                  <p className="patient-clinical-workspace__eyebrow">Procedures & Tags</p>
                  <div className="dental-chart-multi-editor__summary">
                    <div>
                      <span>Status</span>
                      <div className="dental-chart-multi-editor__summary-chips">
                        {selectedConditionCodes.length > 0 ? (
                          selectedConditionCodes.map((code) => (
                            <small key={code}>{code}</small>
                          ))
                        ) : (
                          <small>None</small>
                        )}
                      </div>
                    </div>
                    <div>
                      <span>Conditions</span>
                      <div className="dental-chart-multi-editor__summary-chips">
                        {selectedConditionLabels.length > 0 ? (
                          selectedConditionLabels.map((label) => (
                            <small key={label}>{label}</small>
                          ))
                        ) : (
                          <small>None</small>
                        )}
                      </div>
                    </div>
                    {selectedTagGroups.map((group) => (
                      <div key={group.category}>
                        <span>{group.title}</span>
                        <div className="dental-chart-multi-editor__summary-chips">
                          {group.tags.map((tagCode) => (
                            <small key={tagCode}>{tagCode}</small>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="dental-chart-multi-editor__tag-groups">
                    {tagGroups.map((group) => (
                      <section key={group.category} className="dental-chart-multi-editor__tag-group">
                        <h4>{group.title}</h4>
                        <div className="dental-chart-multi-editor__tag-grid">
                          {group.tags.map((tag) => {
                            const active = selectedMultipleTeeth.length > 0
                              && selectedMultipleTeeth.every((tooth) => tooth.tags.includes(tag.code));
                            const blockedByMax = selectedMultipleTeeth.length > 0
                              && !active
                              && selectedMultipleTeeth.some((tooth) => !tooth.tags.includes(tag.code) && tooth.tags.length >= maxToothTagCount);

                            return (
                              <button
                                key={tag.code}
                                type="button"
                                className={`dental-chart-multi-editor__tag-button ${active ? 'is-active' : ''}`}
                                onClick={() => toggleSelectedToothTag(tag.code)}
                                disabled={selectedMultipleTeeth.length === 0 || blockedByMax}
                                title={blockedByMax ? 'Maximum of 4 tags per tooth.' : tag.label}
                              >
                                {tag.code}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </aside>
              </section>
            </>
          ) : (
            <section className="dental-chart-module__map-card dental-chart-module__map-card--multiple">
              <div className="dental-chart-multi-overview__header">
                <div>
                  <p className="patient-clinical-workspace__eyebrow">{focusedRow.label}</p>
                  <p className="dental-chart-multi-overview__helper">
                    Use Edit Multiple to focus this row, select teeth, and apply one status across several teeth at once.
                  </p>
                </div>
              </div>
              <div className="dental-chart-multi-overview">
                {multiSelectionRows.map((row) => (
                  <div
                    key={row.id}
                    className={`dental-chart-multi-overview__row ${row.id === focusedRow.id ? 'is-focused' : ''}`}
                  >
                    <p className="patient-clinical-workspace__eyebrow">{row.label}</p>
                    <div className="dental-chart-multi-overview__teeth">
                      {row.teeth.map((toothNumber) => {
                        const tooth = teethByNumber[toothNumber];

                        if (!tooth) {
                          return null;
                        }

                        return (
                          <ChartPreviewTooth
                            key={toothNumber}
                            tooth={tooth}
                            placement={row.placement}
                            condition={conditionsById[tooth.condition] || conditionsById['status-clear']}
                            conditionsById={conditionsById}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="patient-record__card dental-chart-checklist-panel">
        <div className="dental-chart-checklist-grid">
          <ChecklistAssessmentGroup
            title="Predental Screening"
            options={periodontalPsrOptions.map((option) => option.name)}
            selectedValues={chart.periodontalPsrSelections || []}
            onToggle={(optionName) => toggleAssessmentSelection('periodontalPsrSelections', optionName)}
            readOnly={readOnly}
          />
          <ChecklistAssessmentGroup
            title="Occlusion"
            options={occlusionIndexOptions.map((option) => option.name)}
            selectedValues={chart.occlusionIndexSelections || []}
            onToggle={(optionName) => toggleAssessmentSelection('occlusionIndexSelections', optionName)}
            readOnly={readOnly}
          />
          <ChecklistAssessmentGroup
            title="Intra-oral Appliance"
            options={intraOralApplianceOptions.map((option) => option.name)}
            selectedValues={chart.intraOralAppliances || []}
            onToggle={(optionName) => toggleAssessmentSelection('intraOralAppliances', optionName)}
            readOnly={readOnly}
          />
          <ChecklistAssessmentGroup
            title="TMJ"
            options={tmjAssessmentOptions.map((option) => option.name)}
            selectedValues={chart.tmjAssessmentSelections || []}
            onToggle={(optionName) => toggleAssessmentSelection('tmjAssessmentSelections', optionName)}
            readOnly={readOnly}
          />
        </div>
      </section>

      <section className="dental-chart-clinical-grid">
        <label className="patient-record__card dental-chart-notes__field">
          <span>Clinical Findings</span>
          <textarea
            rows={5}
            value={chart.findings}
            onChange={(event) => handleChartTextChange('findings', event.target.value)}
            placeholder="Enter dental observations..."
            disabled={readOnly}
          />
        </label>
        <label className="patient-record__card dental-chart-notes__field">
          <span>Recommendations</span>
          <textarea
            rows={5}
            value={chart.recommendations}
            onChange={(event) => handleChartTextChange('recommendations', event.target.value)}
            placeholder="Enter recommended procedures..."
            disabled={readOnly}
          />
        </label>
      </section>

      <section className="patient-record__card dental-recommendation-panel">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Recommendation Section</p>
          <h3>Recommended Care Plan</h3>
        </div>
        <div className="dental-recommendation-panel__grid">
          {[
            ['oralProphylaxis', 'ORAL PROPHYLAXIS'],
            ['prosthodonticsManagement', 'PROSTHODONTICS MANAGEMENT'],
            ['rootCanalTreatment', 'ROOT CANAL TREATMENT (RCT)'],
            ['others', 'OTHERS']
          ].map(([field, label]) => (
            <label key={field} className="dental-recommendation-check">
              <input
                type="checkbox"
                checked={Boolean(chart.recommendationPlan[field as keyof DentalChartRecord['recommendationPlan']])}
                onChange={(event) => updatePlan(field as keyof DentalChartRecord['recommendationPlan'], event.target.checked)}
                disabled={readOnly}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="dental-recommendation-panel__inputs">
          <ChartInput label="TOOTH #" value={chart.recommendationPlan.toothNumber} onChange={(value) => updatePlan('toothNumber', value)} disabled={readOnly} />
          <ChartInput label="RESTORATIVE FILLING TOOTH #" value={chart.recommendationPlan.restorativeFillingToothNumber} onChange={(value) => updatePlan('restorativeFillingToothNumber', value)} disabled={readOnly} />
          <ChartInput label="TOOTH EXTRACTION TOOTH #" value={chart.recommendationPlan.extractionToothNumber} onChange={(value) => updatePlan('extractionToothNumber', value)} disabled={readOnly} />
        </div>
      </section>

      <section className="patient-record__card dental-signoff-panel">
        <label className="dental-chart-notes__field">
          <span>Remarks</span>
          <textarea rows={4} value={chart.remarks} onChange={(event) => handleChartTextChange('remarks', event.target.value)} placeholder="Enter remarks..." disabled={readOnly} />
        </label>
        <div className="dental-signoff-panel__meta">
          <label>
            <span>Status</span>
            <select value={chart.status} onChange={(event) => setChart((current) => ({ ...current, status: event.target.value as DentalChartRecord['status'] }))} disabled={readOnly}>
              <option value="unset">SELECT STATUS</option>
              <option value="dentally-fit">DENTALLY FIT</option>
              <option value="for-compliance">FOR COMPLIANCE</option>
            </select>
          </label>
          <ChartInput label="Checked By" value={chart.checkedBy} onChange={(value) => setChart((current) => ({ ...current, checkedBy: value }))} disabled={readOnly} />
          <label className="dental-chart-input">
            <span>Date</span>
            <DatePicker
              value={chart.checkedDate}
              onChange={(value) => setChart((current) => ({ ...current, checkedDate: value }))}
              disabled={readOnly}
            />
          </label>
        </div>
      </section>
 
      {modalOpen && showInlineMode && (
        <ToothTagModal
          panelRef={modalRef}
          anchorRect={modalAnchorRect}
          tooth={selectedTooth}
          tagGroups={tagGroups}
          notation={notation}
          onClose={() => setModalOpen(false)}
          onToggleTag={toggleToothTag}
          onNotesChange={updateSelectedToothNotes}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function ChecklistAssessmentGroup({
  title,
  options,
  selectedValues,
  onToggle,
  readOnly
}: {
  title: string;
  options: string[];
  selectedValues: string[];
  onToggle: (optionName: string) => void;
  readOnly: boolean;
}) {
  return (
    <section className="dental-chart-checklist-group">
      <h4>{title}</h4>
      <div className="dental-chart-checklist-options">
        {options.map((option) => {
          const isActive = selectedValues.includes(option);
          return (
            <label key={option} className="dental-chart-checklist-option">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggle(option)}
                disabled={readOnly}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
 
function ChartInput({ label, value, type = 'text', onChange, disabled = false }: { label: string; value: string; type?: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="dental-chart-input">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
    </label>
  );
}

function SelectableChartTooth({
  tooth,
  placement,
  condition,
  conditionsById,
  selected,
  notation = 'FDI',
  onToggle
}: {
  tooth: ToothEntry;
  placement: 'upper' | 'lower';
  condition: DentalConditionConfig;
  conditionsById: Record<DentalConditionId, DentalConditionConfig>;
  selected: boolean;
  notation?: ToothNotationSystem;
  onToggle: () => void;
}) {
  const displayLabel = getToothNotationLabel(tooth.toothNumber, notation);

  return (
    <button
      type="button"
      className={`dental-chart-selection-tooth ${selected ? 'is-selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Select tooth ${displayLabel} (FDI ${tooth.toothNumber})`}
    >
      <div className={`dental-odontogram-tooth dental-odontogram-tooth--${placement} ${selected ? 'is-selected' : ''}`}>
        {placement === 'upper' ? (
          <>
            <DentalProcedureTagBox toothNumber={tooth.toothNumber} tags={tooth.tags} interactive={false} />
            <span className="dental-odontogram-tooth__number">{displayLabel}</span>
          </>
        ) : (
          <span className="dental-odontogram-tooth__number">{displayLabel}</span>
        )}

        <div className="dental-odontogram-tooth__symbol">
          <DentalOdontogramTooth
            tooth={tooth}
            activeCondition="status-clear"
            conditionsById={conditionsById}
            onSurfaceMark={() => undefined}
            interactive={false}
          />
        </div>

        {placement === 'upper' ? null : (
          <DentalProcedureTagBox toothNumber={tooth.toothNumber} tags={tooth.tags} interactive={false} />
        )}

        <span
          className={`dental-odontogram-tooth__condition ${condition.behavior === 'clear' ? 'dental-odontogram-tooth__condition--hidden' : ''}`}
          style={{ '--dental-condition-color': condition.surfaceColor } as CSSProperties}
        >
          <span aria-hidden="true" />
          {condition.label}
        </span>
      </div>
    </button>
  );
}

function ChartPreviewTooth({
  tooth,
  placement,
  condition,
  conditionsById,
  notation = 'FDI'
}: {
  tooth: ToothEntry;
  placement: 'upper' | 'lower';
  condition: DentalConditionConfig;
  conditionsById: Record<DentalConditionId, DentalConditionConfig>;
  notation?: ToothNotationSystem;
}) {
  const displayLabel = getToothNotationLabel(tooth.toothNumber, notation);

  return (
    <div className="dental-chart-preview-tooth">
      <div className={`dental-odontogram-tooth dental-odontogram-tooth--${placement}`}>
        {placement === 'upper' ? (
          <>
            <DentalProcedureTagBox toothNumber={tooth.toothNumber} tags={tooth.tags} interactive={false} />
            <span className="dental-odontogram-tooth__number">{displayLabel}</span>
          </>
        ) : (
          <span className="dental-odontogram-tooth__number">{displayLabel}</span>
        )}

        <div className="dental-odontogram-tooth__symbol">
          <DentalOdontogramTooth
            tooth={tooth}
            activeCondition="status-clear"
            conditionsById={conditionsById}
            onSurfaceMark={() => undefined}
            interactive={false}
          />
        </div>

        {placement === 'upper' ? null : (
          <DentalProcedureTagBox toothNumber={tooth.toothNumber} tags={tooth.tags} interactive={false} />
        )}

        <span
          className={`dental-odontogram-tooth__condition ${condition.behavior === 'clear' ? 'dental-odontogram-tooth__condition--hidden' : ''}`}
          style={{ '--dental-condition-color': condition.surfaceColor } as CSSProperties}
        >
          <span aria-hidden="true" />
          {condition.label}
        </span>
      </div>
    </div>
  );
}

function ToothTagModal({
  panelRef,
  anchorRect,
  tooth,
  tagGroups,
  notation = 'FDI',
  onClose,
  onToggleTag,
  onNotesChange,
  readOnly = false
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  anchorRect: DOMRect | null;
  tooth: ToothEntry;
  tagGroups: DentalTagGroup[];
  notation?: ToothNotationSystem;
  onClose: () => void;
  onToggleTag: (tagCode: string) => void;
  onNotesChange: (notes: string) => void;
  readOnly?: boolean;
}) {
  const panelWidth = 340;
  const panelHeight = 520;
  const gap = 12;
  const margin = 12;
  const defaultTop = 96;
  const defaultLeft = Math.max((window.innerWidth - panelWidth) / 2, margin);
  const hasAnchor = Boolean(anchorRect);
  const preferredTop = hasAnchor ? anchorRect!.top : defaultTop;
  const clampedTop = Math.max(margin, Math.min(preferredTop, window.innerHeight - panelHeight - margin));
  const roomOnRight = hasAnchor ? window.innerWidth - anchorRect!.right - gap : 0;
  const roomOnLeft = hasAnchor ? anchorRect!.left - gap : 0;
  const anchoredLeft = hasAnchor
    ? roomOnRight >= panelWidth || roomOnRight >= roomOnLeft
      ? anchorRect!.right + gap
      : anchorRect!.left - panelWidth - gap
    : defaultLeft;
  const clampedLeft = Math.max(margin, Math.min(anchoredLeft, window.innerWidth - panelWidth - margin));

  const displayLabel = getToothNotationLabel(tooth.toothNumber, notation);
  const titleText = notation === 'FDI' ? `Tooth ${tooth.toothNumber}` : `Tooth ${displayLabel} (FDI ${tooth.toothNumber})`;

  return (
    <div
      className="dental-tooth-modal"
      role="dialog"
      aria-modal="false"
      aria-labelledby="dental-tooth-modal-title"
    >
      <div
        ref={panelRef}
        className="dental-tooth-modal__panel"
        style={{ top: `${clampedTop}px`, left: `${clampedLeft}px` }}
      >
        <div className="dental-tooth-modal__header">
          <div>
            <p className="patient-clinical-workspace__eyebrow">Procedures & Tags</p>
            <h3 id="dental-tooth-modal-title">{titleText}</h3>
            <span>Tags {tooth.tags.length}/4</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="dental-tooth-modal__content">
          {tagGroups.map((group) => (
            <section key={group.category} className="dental-tooth-modal__group">
              <h4>{group.title}</h4>
              <div className="dental-tooth-modal__tags">
                {group.tags.map((tag) => {
                  const active = tooth.tags.includes(tag.code);
                  const disableAdd = !active && tooth.tags.length >= maxToothTagCount;

                  return (
                    <button
                      key={tag.code}
                      type="button"
                      className={`dental-tooth-tag ${active ? 'is-active' : ''}`}
                      onClick={() => onToggleTag(tag.code)}
                      disabled={disableAdd || readOnly}
                      title={disableAdd ? 'Maximum of 4 tags per tooth.' : tag.label}
                    >
                      {tag.code}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          <label className="dental-chart-notes__field">
            <span>Tooth Notes</span>
            <textarea rows={3} value={tooth.notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="Add tooth-specific notes..." disabled={readOnly} />
          </label>
        </div>
      </div>
    </div>
  );
}
