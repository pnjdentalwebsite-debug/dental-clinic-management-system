import type {
  MasterFileCategoryId,
  MasterFileTagRecord,
  ToothStatusBehavior,
  ToothStatusRecord
} from './masterFileDirectoryService';

export type ToothItemRecord = ToothStatusRecord | MasterFileTagRecord;

export interface ToothItemFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'color';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  section?: 'general' | 'clinical';
}

export interface ToothItemModuleConfig {
  categoryId: MasterFileCategoryId;
  sectionLabel: string;
  title: string;
  description: string;
  addLabel: string;
  modalTitle: string;
  modalDescription: string;
  searchPlaceholder?: string;
  sortOptions?: Array<{ value: string; label: string }>;
  detailsValue: (record: ToothItemRecord) => string;
  fields: ToothItemFieldConfig[];
  previewLabel: (record: ToothItemRecord) => string;
}

const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '-';
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const toothStatusBehaviorOptions: Array<{ value: ToothStatusBehavior; label: string }> = [
  { value: 'surface', label: 'Surface Color' },
  { value: 'whole-tooth', label: 'Whole Tooth' },
  { value: 'clear', label: 'Clear' }
];

export const toothItemModuleConfigs: Record<MasterFileCategoryId, ToothItemModuleConfig> = {
  'tooth-status': {
    categoryId: 'tooth-status',
    sectionLabel: 'TOOTH STATUS',
    title: 'Tooth Status',
    description: 'Status labels used in dental tooth charting.',
    addLabel: 'Add Tooth Status',
    modalTitle: 'Add Tooth Status',
    modalDescription: 'Create or update a reusable tooth status record for the dental chart.',
    searchPlaceholder: 'Search status name, code, description',
    sortOptions: [
      { value: 'sortOrder', label: 'Sort Order' },
      { value: 'name', label: 'Name' },
      { value: 'updatedAt', label: 'Updated' }
    ],
    detailsValue: (record) => (record as ToothStatusRecord).color || '-',
    previewLabel: (record) => (record as ToothStatusRecord).chartMeaning || record.name || 'Tooth status preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'clinicalCode', label: 'Clinical Code', type: 'text', placeholder: 'cv / ok / d / m', section: 'clinical' },
      { key: 'color', label: 'Color', type: 'color', placeholder: '#ef4444', section: 'clinical' },
      { key: 'clinicalCodeOverride', label: 'Clinical Code Override', type: 'text', placeholder: 'Leave blank to use Code', section: 'clinical' },
      { key: 'legacyCode', label: 'Legacy Code', type: 'text', placeholder: 'Optional legacy code', section: 'clinical' },
      { key: 'chartMeaning', label: 'Chart Meaning', type: 'textarea', placeholder: 'Optional chart meaning', section: 'clinical' },
      { key: 'behavior', label: 'Behavior', type: 'select', options: toothStatusBehaviorOptions, section: 'clinical' }
    ]
  },
  'tooth-condition': {
    categoryId: 'tooth-condition',
    sectionLabel: 'TOOTH CONDITION',
    title: 'Tooth Condition',
    description: 'Clinical tooth conditions available in the dental chart.',
    addLabel: 'Add Tooth Condition',
    modalTitle: 'Add Tooth Condition',
    modalDescription: 'Create or update a reusable clinical tooth condition definition for dental charting.',
    searchPlaceholder: 'Search condition name, clinical code, description',
    sortOptions: [
      { value: 'sortOrder', label: 'Sort Order' },
      { value: 'name', label: 'Name' },
      { value: 'updatedAt', label: 'Updated' }
    ],
    detailsValue: (record) => (record as MasterFileTagRecord).category || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).clinicalMeaning || record.name || 'Tooth condition preview',
    fields: [
      { key: 'name', label: 'Condition Name', type: 'text', placeholder: 'Decayed', required: true, section: 'general' },
      { key: 'code', label: 'Clinical Code', type: 'text', placeholder: 'D', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short clinical description', section: 'general' },
      { key: 'instructions', label: 'Clinical Instructions', type: 'textarea', placeholder: 'Optional clinical notes or usage instructions', section: 'general' },
      { key: 'clinicalMeaning', label: 'Chart Meaning', type: 'textarea', placeholder: 'Tooth decay finding', section: 'clinical' },
      { key: 'category', label: 'Chart Behavior', type: 'select', options: [{ value: 'surface-marking', label: 'Surface Marking' }, { value: 'whole-tooth-marking', label: 'Whole Tooth Marking' }, { value: 'symbol-only', label: 'Symbol Only' }, { value: 'text-only', label: 'Text Only' }], section: 'clinical' },
      { key: 'severity', label: 'Clinical Category', type: 'select', options: [{ value: 'condition', label: 'Condition' }, { value: 'missing', label: 'Missing' }, { value: 'developmental', label: 'Developmental' }, { value: 'endodontic', label: 'Endodontic' }], section: 'clinical' },
      { key: 'color', label: 'Color', type: 'color', placeholder: '#ef4444', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Record Status', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  prosthodontics: {
    categoryId: 'prosthodontics',
    sectionLabel: 'PROSTHODONTICS',
    title: 'Prosthodontics',
    description: 'Prosthodontic procedures and restorations used in charting.',
    addLabel: 'Add Prosthodontics',
    modalTitle: 'Add Prosthodontics',
    modalDescription: 'Create or update a restorative or prosthodontic master record.',
    detailsValue: (record) => (record as MasterFileTagRecord).clinicalMeaning || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).clinicalMeaning || record.name || 'Restoration preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'category', label: 'Restoration Type', type: 'text', placeholder: 'Restoration or prosthodontics', section: 'clinical' },
      { key: 'procedureCategory', label: 'Procedure Category', type: 'text', placeholder: 'Procedure category', section: 'clinical' },
      { key: 'clinicalMeaning', label: 'Clinical Meaning', type: 'textarea', placeholder: 'Meaning used in charting', section: 'clinical' },
      { key: 'color', label: 'Color', type: 'color', placeholder: '#4f7bf5', section: 'clinical' }
    ]
  },
  'dental-surgery': {
    categoryId: 'dental-surgery',
    sectionLabel: 'DENTAL SURGERY',
    title: 'Dental Surgery',
    description: 'Dental surgery procedures available in the tooth chart.',
    addLabel: 'Add Dental Surgery',
    modalTitle: 'Add Dental Surgery',
    modalDescription: 'Create or update a surgical tooth-chart master record.',
    detailsValue: (record) => (record as MasterFileTagRecord).procedureCategory || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).clinicalMeaning || record.name || 'Dental surgery preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'procedureCategory', label: 'Surgical Category', type: 'text', placeholder: 'Extraction or surgery', section: 'clinical' },
      { key: 'clinicalMeaning', label: 'Procedure Meaning', type: 'textarea', placeholder: 'Meaning used in charting', section: 'clinical' }
    ]
  },
  'xray-scan-items': {
    categoryId: 'xray-scan-items',
    sectionLabel: 'X-RAY SCAN ITEMS',
    title: 'X-Ray Scan Items',
    description: 'Diagnostic X-ray and imaging items used in charting.',
    addLabel: 'Add X-Ray Scan Item',
    modalTitle: 'Add X-Ray Scan Item',
    modalDescription: 'Create or update a reusable X-ray or imaging chart record.',
    detailsValue: (record) => (record as MasterFileTagRecord).xrayType || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).clinicalMeaning || record.name || 'X-ray preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'xrayType', label: 'X-Ray Type', type: 'text', placeholder: 'Panoramic, cephalometric, occlusal', section: 'clinical' },
      { key: 'clinicalMeaning', label: 'Reference Code', type: 'textarea', placeholder: 'Meaning used in charting', section: 'clinical' }
    ]
  },
  'prescription-templates': {
    categoryId: 'prescription-templates',
    sectionLabel: 'PRESCRIPTIONS',
    title: 'Prescriptions',
    description: 'Reusable prescription sets and diagnosis notes.',
    addLabel: 'Add Prescription Template',
    modalTitle: 'Add Prescription Template',
    modalDescription: 'Create or update reusable prescription templates for patient medication orders.',
    searchPlaceholder: 'Search prescription, code, description...',
    detailsValue: (record) => (record as MasterFileTagRecord).details || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'Prescription template preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'details', label: 'Prescription Details', type: 'textarea', placeholder: 'Medication lines, dosage, and notes', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  'intra-oral-appliance': {
    categoryId: 'intra-oral-appliance',
    sectionLabel: 'INTRA ORAL APPLIANCE',
    title: 'Intra Oral Appliance',
    description: 'Ortho, stayplate, and other appliance recall definitions.',
    addLabel: 'Add Intra Oral Appliance',
    modalTitle: 'Add Intra Oral Appliance',
    modalDescription: 'Create or update reusable appliance assessment definitions for dental charting.',
    searchPlaceholder: 'Search name, code, description...',
    detailsValue: (record) => (record as MasterFileTagRecord).details || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'Appliance preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'details', label: 'Details', type: 'textarea', placeholder: 'Reference notes or interpretation', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  'occlusion-index': {
    categoryId: 'occlusion-index',
    sectionLabel: 'OCCLUSION INDEX',
    title: 'Occlusion Index',
    description: 'Molar class, overjet, overbite, and interpretation rules.',
    addLabel: 'Add Occlusion Index',
    modalTitle: 'Add Occlusion Index',
    modalDescription: 'Create or update reusable occlusion assessment references.',
    searchPlaceholder: 'Search name, code, description...',
    detailsValue: (record) => (record as MasterFileTagRecord).details || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'Occlusion preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'details', label: 'Details', type: 'textarea', placeholder: 'Reference notes or interpretation', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  'periodontal-psr': {
    categoryId: 'periodontal-psr',
    sectionLabel: 'PERIODONTAL PSR',
    title: 'Periodontal PSR',
    description: 'Gingivitis, periodontitis, calculus, and hygiene screening.',
    addLabel: 'Add Periodontal PSR',
    modalTitle: 'Add Periodontal PSR',
    modalDescription: 'Create or update reusable periodontal screening references.',
    searchPlaceholder: 'Search name, code, description...',
    detailsValue: (record) => (record as MasterFileTagRecord).details || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'PSR preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'details', label: 'Details', type: 'textarea', placeholder: 'Reference notes or interpretation', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  'tmj-assessment': {
    categoryId: 'tmj-assessment',
    sectionLabel: 'TMJ ASSESSMENT',
    title: 'TMJ Assessment',
    description: 'Clenching, clicking, trismus, and muscle findings.',
    addLabel: 'Add TMJ Assessment',
    modalTitle: 'Add TMJ Assessment',
    modalDescription: 'Create or update reusable TMJ and muscular finding references.',
    searchPlaceholder: 'Search name, code, description...',
    detailsValue: (record) => (record as MasterFileTagRecord).details || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'TMJ preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'details', label: 'Details', type: 'textarea', placeholder: 'Reference notes or interpretation', section: 'clinical' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'clinical' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'clinical' }
    ]
  },
  'hmo-accredited': {
    categoryId: 'hmo-accredited',
    sectionLabel: 'HMO ACCREDITED',
    title: 'HMO Accredited',
    description: 'Accredited HMO and insurance provider references for the clinic.',
    addLabel: 'Add HMO Accredited',
    modalTitle: 'Add HMO Accredited',
    modalDescription: 'Create or update a reusable HMO or insurance provider record.',
    searchPlaceholder: 'Search provider, code, or notes',
    detailsValue: (record) => (record as MasterFileTagRecord).coverageNotes || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).networkType || record.name || 'HMO preview',
    fields: [
      { key: 'name', label: 'Provider Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'networkType', label: 'Network Type', type: 'text', placeholder: 'HMO, corporate, private', section: 'clinical' },
      { key: 'contactNumber', label: 'Contact Number', type: 'text', placeholder: 'Provider contact number', section: 'clinical' },
      { key: 'coverageNotes', label: 'Coverage Notes', type: 'textarea', placeholder: 'Coverage summary or reminders', section: 'clinical' }
    ]
  },
  'recall-reasons': {
    categoryId: 'recall-reasons',
    sectionLabel: 'RECALL REASONS',
    title: 'Recall Reasons',
    description: 'Master list used by the progress note recall reason dropdown.',
    addLabel: 'Add Recall Reason',
    modalTitle: 'Add Recall Reason',
    modalDescription: 'Create or update a reusable recall reason for follow-up scheduling.',
    searchPlaceholder: 'Search reason, code, category',
    detailsValue: (record) => (record as MasterFileTagRecord).defaultRecallWindow || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).category || record.name || 'Recall reason preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'category', label: 'Recall Category', type: 'text', placeholder: 'Orthodontic, preventive, surgical', section: 'clinical' },
      { key: 'defaultRecallWindow', label: 'Default Recall Window', type: 'text', placeholder: '7 days / 30 days / Custom', section: 'clinical' }
    ]
  },
  'clinical-services': {
    categoryId: 'clinical-services',
    sectionLabel: 'CLINICAL SERVICES',
    title: 'Clinical Services',
    description: 'Treatment services, procedures, and default prices.',
    addLabel: 'Add Clinical Services',
    modalTitle: 'Add Clinical Services',
    modalDescription: 'Create or update a reusable clinical service or procedure record.',
    searchPlaceholder: 'Search name, code, description...',
    detailsValue: (record) => formatCurrency((record as MasterFileTagRecord).defaultPrice),
    previewLabel: (record) => (record as MasterFileTagRecord).treatmentCategory || record.name || 'Clinical service preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'defaultPrice', label: 'Default Price', type: 'number', placeholder: '1000', section: 'clinical' },
      { key: 'treatmentCategory', label: 'Treatment Category', type: 'text', placeholder: 'Preventive, Surgery, Restorative', section: 'clinical' },
      { key: 'commonTeethSurfaces', label: 'Common Teeth / Surfaces', type: 'text', placeholder: 'Optional', section: 'clinical' },
      { key: 'autoAddToBill', label: 'Auto add to bill', type: 'select', options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }], section: 'clinical' }
    ]
  },
  'medicine-catalog': {
    categoryId: 'medicine-catalog',
    sectionLabel: 'MEDICINE CATALOG',
    title: 'Medicine Catalog',
    description: 'Reusable medicine references for prescriptions and follow-up care.',
    addLabel: 'Add Medicine Catalog',
    modalTitle: 'Add Medicine Catalog',
    modalDescription: 'Create or update a reusable medicine catalog record.',
    searchPlaceholder: 'Search medicine, code, or indication',
    detailsValue: (record) => (record as MasterFileTagRecord).indication || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).genericName || record.name || 'Medicine preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'genericName', label: 'Generic Name', type: 'text', placeholder: 'Amoxicillin', section: 'clinical' },
      { key: 'indication', label: 'Indication', type: 'text', placeholder: 'Pain, infection, inflammation', section: 'clinical' },
      { key: 'dosage', label: 'Dosage', type: 'text', placeholder: '500mg', section: 'clinical' },
      { key: 'frequency', label: 'Frequency', type: 'text', placeholder: 'Every 8 hours', section: 'clinical' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: '7 days', section: 'clinical' },
      { key: 'contraindications', label: 'Contraindications', type: 'text', placeholder: 'Allergy, pregnancy, etc.', section: 'clinical' }
    ]
  },
  'medical-conditions': {
    categoryId: 'medical-conditions',
    sectionLabel: 'MEDICAL CONDITIONS',
    title: 'Medical Conditions',
    description: 'Reusable medical checklist and warning conditions.',
    addLabel: 'Add Medical Conditions',
    modalTitle: 'Add Medical Conditions',
    modalDescription: 'Create or update a reusable medical condition record.',
    searchPlaceholder: 'Search condition name, code, severity',
    detailsValue: (record) => (record as MasterFileTagRecord).severity || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).warningNotes || record.name || 'Medical condition preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'severity', label: 'Severity', type: 'select', options: [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }], section: 'clinical' },
      { key: 'showAsClinicalAlert', label: 'Show as clinical alert', type: 'select', options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }], section: 'clinical' },
      { key: 'warningNotes', label: 'Dental Warning Notes', type: 'textarea', placeholder: 'Clinical warning notes', section: 'clinical' }
    ]
  },
  'dental-habits': {
    categoryId: 'dental-habits',
    sectionLabel: 'DENTAL HABITS',
    title: 'Dental Habits',
    description: 'Reusable dental and oral habit options for patient records.',
    addLabel: 'Add Dental Habits',
    modalTitle: 'Add Dental Habits',
    modalDescription: 'Create or update a reusable dental habit record.',
    searchPlaceholder: 'Search habit name, code, category',
    detailsValue: (record) => (record as MasterFileTagRecord).category || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).habitDescription || record.name || 'Dental habit preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'habitDescription', label: 'Habit Description', type: 'text', placeholder: 'Optional note', section: 'clinical' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'Habit group', section: 'clinical' }
    ]
  },
  'risk-tags': {
    categoryId: 'risk-tags',
    sectionLabel: 'RISK TAGS',
    title: 'Tags',
    description: 'Reusable clinic tags for patient grouping and quick categorization.',
    addLabel: 'Add Risk Tags',
    modalTitle: 'Add Risk Tags',
    modalDescription: 'Create or update a reusable tag record.',
    searchPlaceholder: 'Search tag name, code, priority',
    detailsValue: (record) => (record as MasterFileTagRecord).priority || '-',
    previewLabel: (record) => (record as MasterFileTagRecord).description || record.name || 'Tag preview',
    fields: [
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Record name', required: true, section: 'general' },
      { key: 'code', label: 'Code', type: 'text', placeholder: 'Optional code', required: true, section: 'general' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description', section: 'general' },
      { key: 'instructions', label: 'Instructions', type: 'textarea', placeholder: 'Default notes or instructions', section: 'general' },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0', section: 'general' },
      { key: 'active', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }], section: 'general' },
      { key: 'color', label: 'Color', type: 'color', placeholder: '#0ea5e9', section: 'clinical' },
      { key: 'priority', label: 'Priority', type: 'text', placeholder: 'Optional', section: 'clinical' }
    ]
  }
};
