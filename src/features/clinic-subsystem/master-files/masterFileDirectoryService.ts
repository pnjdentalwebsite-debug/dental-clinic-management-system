import { defaultMasterFileTagRecords, defaultToothStatuses } from './masterFileSeedRecords';

export type MasterFileCategoryId =
  | 'tooth-status'
  | 'tooth-condition'
  | 'prosthodontics'
  | 'dental-surgery'
  | 'xray-scan-items'
  | 'prescription-templates'
  | 'intra-oral-appliance'
  | 'occlusion-index'
  | 'periodontal-psr'
  | 'tmj-assessment'
  | 'hmo-accredited'
  | 'recall-reasons'
  | 'clinical-services'
  | 'medicine-catalog'
  | 'medical-conditions'
  | 'dental-habits'
  | 'risk-tags';

export type ToothStatusBehavior = 'clear' | 'surface' | 'whole-tooth';

export interface ToothStatusRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  sortOrder: number;
  behavior: ToothStatusBehavior;
  instructions?: string;
  clinicalCode?: string;
  clinicalCodeOverride?: string;
  legacyCode?: string;
  chartMeaning?: string;
  updatedAt: string;
}

export interface MasterFileTagRecord {
  id: string;
  categoryId: Exclude<MasterFileCategoryId, 'tooth-status'>;
  code: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  instructions?: string;
  details?: string;
  color?: string;
  clinicalMeaning?: string;
  severity?: string;
  category?: string;
  procedureCategory?: string;
  treatmentCategory?: string;
  xrayType?: string;
  legacyCode?: string;
  chartMeaning?: string;
  defaultPrice?: number;
  commonTeethSurfaces?: string;
  autoAddToBill?: boolean;
  genericName?: string;
  indication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  contraindications?: string;
  warningNotes?: string;
  showAsClinicalAlert?: boolean;
  habitDescription?: string;
  priority?: string;
  contactNumber?: string;
  coverageNotes?: string;
  networkType?: string;
  defaultRecallWindow?: string;
  updatedAt: string;
}

interface MasterFileDirectoryState {
  toothStatuses: ToothStatusRecord[];
  tagRecords: MasterFileTagRecord[];
}

const STORAGE_KEY = 'pnj_mock_clinic_master_file_directory';
export const MASTER_FILE_DIRECTORY_UPDATED_EVENT = 'master-file-directory:updated';

const DEFAULT_STATE: MasterFileDirectoryState = {
  toothStatuses: defaultToothStatuses,
  tagRecords: defaultMasterFileTagRecords
};

const categoryLabels: Record<MasterFileCategoryId, string> = {
  'tooth-status': 'Tooth Status',
  'tooth-condition': 'Tooth Condition',
  prosthodontics: 'Restoration & Prosthodontics',
  'dental-surgery': 'Dental Surgery',
  'xray-scan-items': 'X-Ray Scan Items',
  'prescription-templates': 'Prescriptions',
  'intra-oral-appliance': 'Intra Oral Appliance',
  'occlusion-index': 'Occlusion Index',
  'periodontal-psr': 'Periodontal PSR',
  'tmj-assessment': 'TMJ Assessment',
  'hmo-accredited': 'HMO Accredited',
  'recall-reasons': 'Recall Reasons',
  'clinical-services': 'Clinical Services',
  'medicine-catalog': 'Medicine Catalog',
  'medical-conditions': 'Medical Conditions',
  'dental-habits': 'Dental Habits',
  'risk-tags': 'Tags'
};

const TOOTH_CONDITION_DEFAULTS: Record<string, Partial<MasterFileTagRecord>> = {
  '/': {
    clinicalMeaning: 'Existing natural tooth',
    category: 'symbol-only',
    severity: 'condition',
    color: '#94a3b8',
    instructions: 'Baseline natural tooth notation.'
  },
  M: {
    clinicalMeaning: 'Tooth missing because of decay',
    category: 'whole-tooth-marking',
    severity: 'missing',
    color: '#111827',
    instructions: 'Use when loss is related to caries.'
  },
  MO: {
    clinicalMeaning: 'Tooth missing from non-caries cause',
    category: 'whole-tooth-marking',
    severity: 'missing',
    color: '#334155',
    instructions: 'Use for trauma, extraction, or other non-caries loss.'
  },
  IM: {
    clinicalMeaning: 'Impacted tooth finding',
    category: 'symbol-only',
    severity: 'developmental',
    color: '#7c3aed',
    instructions: 'Use for impacted tooth notation.'
  },
  SP: {
    clinicalMeaning: 'Supernumerary tooth finding',
    category: 'symbol-only',
    severity: 'developmental',
    color: '#0891b2',
    instructions: 'Use for extra tooth findings.'
  },
  RF: {
    clinicalMeaning: 'Retained root fragment finding',
    category: 'whole-tooth-marking',
    severity: 'condition',
    color: '#b45309',
    instructions: 'Use when retained root structure is present.'
  },
  UN: {
    clinicalMeaning: 'Unerupted tooth finding',
    category: 'symbol-only',
    severity: 'developmental',
    color: '#4f46e5',
    instructions: 'Use for unerupted tooth notation.'
  },
  PT: {
    clinicalMeaning: 'Partially erupted tooth finding',
    category: 'symbol-only',
    severity: 'developmental',
    color: '#0f766e',
    instructions: 'Use for partially erupted tooth notation.'
  },
  D: {
    clinicalMeaning: 'Dental caries or decay finding',
    category: 'surface-marking',
    severity: 'condition',
    color: '#ef4444',
    instructions: 'Use when tooth decay is present.'
  },
  RCT: {
    clinicalMeaning: 'Root canal treated tooth',
    category: 'whole-tooth-marking',
    severity: 'endodontic',
    color: '#16a34a',
    instructions: 'Use for endodontically treated tooth notation.'
  }
};

const normalizeToothConditionRecord = (record: MasterFileTagRecord): MasterFileTagRecord => {
  if (record.categoryId !== 'tooth-condition') {
    return record;
  }

  const defaults = TOOTH_CONDITION_DEFAULTS[record.code] || {};
  return {
    ...defaults,
    ...record,
    instructions: record.instructions?.trim() || defaults.instructions || '',
    clinicalMeaning: record.clinicalMeaning?.trim() || defaults.clinicalMeaning || '',
    severity: record.severity?.trim() || defaults.severity || 'condition',
    category: record.category?.trim() || defaults.category || 'symbol-only',
    color: record.color?.trim() || defaults.color || '#94a3b8'
  };
};

const mergeRecordsById = <T extends { id: string }>(defaults: T[], stored: T[]) => {
  const merged = new Map<string, T>();

  defaults.forEach((record) => {
    merged.set(record.id, record);
  });

  stored.forEach((record) => {
    const base = merged.get(record.id);
    merged.set(record.id, base ? { ...base, ...record } : record);
  });

  return Array.from(merged.values());
};

const sortByOrder = <T extends { sortOrder: number; name: string }>(records: T[]) =>
  [...records].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

const safeRead = (): MasterFileDirectoryState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<MasterFileDirectoryState>;
    const storedToothStatuses = Array.isArray(parsed.toothStatuses) ? parsed.toothStatuses : [];
    const storedTagRecords = Array.isArray(parsed.tagRecords) ? parsed.tagRecords : [];

    return {
      toothStatuses: mergeRecordsById(defaultToothStatuses, storedToothStatuses),
      tagRecords: mergeRecordsById(defaultMasterFileTagRecords, storedTagRecords)
    };
  } catch {
    return DEFAULT_STATE;
  }
};

const safeWrite = (state: MasterFileDirectoryState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MASTER_FILE_DIRECTORY_UPDATED_EVENT));
  }
};

export const masterFileDirectoryService = {
  getCategoryLabel(categoryId: MasterFileCategoryId) {
    return categoryLabels[categoryId];
  },
  getToothStatuses() {
    return sortByOrder(safeRead().toothStatuses);
  },
  saveToothStatus(input: Omit<ToothStatusRecord, 'id' | 'updatedAt'> & { id?: string }) {
    const state = safeRead();
    const nextRecord: ToothStatusRecord = {
      id: input.id || `status-${Date.now()}`,
      updatedAt: '2026-08-10',
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description.trim(),
      color: input.color,
      active: input.active,
      sortOrder: input.sortOrder,
      behavior: input.behavior,
      instructions: input.instructions?.trim() || '',
      clinicalCode: input.clinicalCode?.trim() || '',
      clinicalCodeOverride: input.clinicalCodeOverride?.trim() || '',
      legacyCode: input.legacyCode?.trim() || '',
      chartMeaning: input.chartMeaning?.trim() || ''
    };
    const existingIndex = state.toothStatuses.findIndex((record) => record.id === nextRecord.id);
    if (existingIndex >= 0) {
      state.toothStatuses[existingIndex] = nextRecord;
    } else {
      state.toothStatuses.push(nextRecord);
    }
    safeWrite(state);
    return nextRecord;
  },
  deleteToothStatus(id: string) {
    const state = safeRead();
    state.toothStatuses = state.toothStatuses.filter((record) => record.id !== id);
    safeWrite(state);
  },
  getTagRecords(categoryId: Exclude<MasterFileCategoryId, 'tooth-status'>) {
    return sortByOrder(
      safeRead().tagRecords
        .filter((record) => record.categoryId === categoryId)
        .map((record) => normalizeToothConditionRecord(record))
    );
  },
  getActiveTagRecords(categoryId: Exclude<MasterFileCategoryId, 'tooth-status'>) {
    return this.getTagRecords(categoryId).filter((record) => record.active);
  },
  searchTagRecords(categoryId: Exclude<MasterFileCategoryId, 'tooth-status'>, query: string) {
    const search = query.trim().toLowerCase();
    return this.getActiveTagRecords(categoryId).filter((record) => {
      if (!search) return true;
      return [
        record.code,
        record.name,
        record.description,
        record.details,
        record.instructions,
        record.genericName,
        record.indication,
        record.treatmentCategory
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  },
  saveTagRecord(input: Omit<MasterFileTagRecord, 'id' | 'updatedAt'> & { id?: string }) {
    const state = safeRead();
    const nextRecord: MasterFileTagRecord = {
      id: input.id || `tag-${Date.now()}`,
      updatedAt: '2026-08-10',
      categoryId: input.categoryId,
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description.trim(),
      active: input.active,
      sortOrder: input.sortOrder,
      instructions: input.instructions?.trim() || '',
      details: input.details?.trim() || '',
      color: input.color?.trim() || '',
      clinicalMeaning: input.clinicalMeaning?.trim() || '',
      severity: input.severity?.trim() || '',
      category: input.category?.trim() || '',
      procedureCategory: input.procedureCategory?.trim() || '',
      treatmentCategory: input.treatmentCategory?.trim() || '',
      xrayType: input.xrayType?.trim() || '',
      legacyCode: input.legacyCode?.trim() || '',
      chartMeaning: input.chartMeaning?.trim() || '',
      defaultPrice: Number(input.defaultPrice) || 0,
      commonTeethSurfaces: input.commonTeethSurfaces?.trim() || '',
      autoAddToBill: Boolean(input.autoAddToBill),
      genericName: input.genericName?.trim() || '',
      indication: input.indication?.trim() || '',
      dosage: input.dosage?.trim() || '',
      frequency: input.frequency?.trim() || '',
      duration: input.duration?.trim() || '',
      contraindications: input.contraindications?.trim() || '',
      warningNotes: input.warningNotes?.trim() || '',
      showAsClinicalAlert: Boolean(input.showAsClinicalAlert),
      habitDescription: input.habitDescription?.trim() || '',
      priority: input.priority?.trim() || '',
      contactNumber: input.contactNumber?.trim() || '',
      coverageNotes: input.coverageNotes?.trim() || '',
      networkType: input.networkType?.trim() || '',
      defaultRecallWindow: input.defaultRecallWindow?.trim() || ''
    };
    const existingIndex = state.tagRecords.findIndex((record) => record.id === nextRecord.id);
    if (existingIndex >= 0) {
      state.tagRecords[existingIndex] = nextRecord;
    } else {
      state.tagRecords.push(nextRecord);
    }
    safeWrite(state);
    return nextRecord;
  },
  deleteTagRecord(id: string) {
    const state = safeRead();
    state.tagRecords = state.tagRecords.filter((record) => record.id !== id);
    safeWrite(state);
  }
};
