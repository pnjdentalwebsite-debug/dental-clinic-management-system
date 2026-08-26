import {
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  Tags,
  Pill,
  ShieldPlus,
  Stethoscope,
  ScanLine,
  Building2,
  HeartPulse,
  BellRing,
  BriefcaseMedical,
  FilePenLine,
  type LucideIcon
} from 'lucide-react';

export interface MasterFileRouteItem {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  routeSuffix: string;
  countKey?: string;
  disabled?: boolean;
}

export interface MasterFileRouteGroup {
  key: string;
  label: string;
  items: MasterFileRouteItem[];
}

export const masterFileRouteItems: MasterFileRouteItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Workspace overview and administration landing page.',
    icon: LayoutDashboard,
    routeSuffix: 'dashboard'
  },
  {
    key: 'tooth-status',
    label: 'Tooth Status',
    description: 'Color-coded tooth chart statuses for clinical marking.',
    icon: ShieldCheck,
    routeSuffix: 'tooth-status',
    countKey: 'tooth-status'
  },
  {
    key: 'dental-conditions',
    label: 'Tooth Condition',
    description: 'Reusable condition records for dental chart tagging.',
    icon: ClipboardList,
    routeSuffix: 'dental-conditions',
    countKey: 'tooth-condition'
  },
  {
    key: 'procedure-tags',
    label: 'Procedure Tags',
    description: 'Tooth-level procedure and notation tag masters.',
    icon: Tags,
    routeSuffix: 'procedure-tags'
  },
  {
    key: 'restorations',
    label: 'Restoration & Prosthodontics',
    description: 'Reusable restorative and prosthodontic records.',
    icon: ShieldPlus,
    routeSuffix: 'restorations',
    countKey: 'prosthodontics'
  },
  {
    key: 'surgery',
    label: 'Dental Surgery',
    description: 'Surgical charting and extraction master records.',
    icon: Stethoscope,
    routeSuffix: 'surgery',
    countKey: 'dental-surgery'
  },
  {
    key: 'xray',
    label: 'X-Ray Scan Items',
    description: 'Diagnostic imaging master options for dental records.',
    icon: ScanLine,
    routeSuffix: 'xray',
    countKey: 'xray-scan-items'
  },
  {
    key: 'prescription-templates',
    label: 'Prescriptions',
    description: 'Reusable prescription sets and diagnosis notes.',
    icon: Pill,
    routeSuffix: 'prescriptions',
    countKey: 'prescription-templates'
  },
  {
    key: 'intra-oral-appliance',
    label: 'Intra Oral Appliance',
    description: 'Ortho, stayplate, and other appliance recall definitions.',
    icon: ClipboardList,
    routeSuffix: 'intra-oral-appliance',
    countKey: 'intra-oral-appliance'
  },
  {
    key: 'occlusion-index',
    label: 'Occlusion Index',
    description: 'Molar class, overjet, overbite, and interpretation rules.',
    icon: ClipboardList,
    routeSuffix: 'occlusion-index',
    countKey: 'occlusion-index'
  },
  {
    key: 'periodontal-psr',
    label: 'Periodontal PSR',
    description: 'Gingivitis, periodontitis, calculus, and hygiene screening.',
    icon: ClipboardList,
    routeSuffix: 'periodontal-psr',
    countKey: 'periodontal-psr'
  },
  {
    key: 'tmj-assessment',
    label: 'TMJ Assessment',
    description: 'Clenching, clicking, trismus, and muscle findings.',
    icon: ClipboardList,
    routeSuffix: 'tmj-assessment',
    countKey: 'tmj-assessment'
  },
  {
    key: 'hmo-accredited',
    label: 'HMO Accredited',
    description: 'Reusable HMO and insurance provider directory records.',
    icon: Building2,
    routeSuffix: 'hmo-accredited',
    countKey: 'hmo-accredited'
  },
  {
    key: 'recall-reasons',
    label: 'Recall Reasons',
    description: 'Master list for progress note recall reason options.',
    icon: BellRing,
    routeSuffix: 'recall-reasons',
    countKey: 'recall-reasons'
  },
  {
    key: 'clinical-services',
    label: 'Clinical Services',
    description: 'Treatment services, procedures, and default prices.',
    icon: BriefcaseMedical,
    routeSuffix: 'clinical-services',
    countKey: 'clinical-services'
  },
  {
    key: 'medicine-catalog',
    label: 'Medicine Catalog',
    description: 'Reusable medicine list for prescriptions and notes.',
    icon: Pill,
    routeSuffix: 'medicine-catalog',
    countKey: 'medicine-catalog'
  },
  {
    key: 'medical-conditions',
    label: 'Medical Conditions',
    description: 'Reusable medical checklist and warning conditions.',
    icon: HeartPulse,
    routeSuffix: 'medical-conditions',
    countKey: 'medical-conditions'
  },
  {
    key: 'dental-habits',
    label: 'Dental Habits',
    description: 'Reusable oral habits checklist records.',
    icon: ClipboardList,
    routeSuffix: 'dental-habits',
    countKey: 'dental-habits'
  },
  {
    key: 'risk-tags',
    label: 'Tags',
    description: 'Reusable risk, source, and patient categorization tags.',
    icon: Tags,
    routeSuffix: 'tags',
    countKey: 'risk-tags'
  },
  {
    key: 'modify-pdf',
    label: 'Modify Pdf',
    description: 'Clinic PDF template designer and preview workspace.',
    icon: FilePenLine,
    routeSuffix: 'modify-pdf'
  }
];

export const masterFileRouteGroups: MasterFileRouteGroup[] = [
  {
    key: 'tooth-items',
    label: 'Tooth Items',
    items: masterFileRouteItems.filter((item) =>
      ['tooth-status', 'dental-conditions', 'restorations', 'surgery', 'xray'].includes(item.key)
    )
  },
  {
    key: 'clinical-templates',
    label: 'Clinical Templates',
    items: masterFileRouteItems.filter((item) =>
      ['prescription-templates', 'intra-oral-appliance', 'occlusion-index', 'periodontal-psr', 'tmj-assessment'].includes(item.key)
    )
  },
  {
    key: 'master-files',
    label: 'Master Files',
    items: masterFileRouteItems.filter((item) =>
      ['hmo-accredited', 'recall-reasons', 'clinical-services', 'medicine-catalog', 'medical-conditions', 'dental-habits', 'risk-tags'].includes(item.key)
    )
  },
  {
    key: 'pdf-designer',
    label: 'Pdf Designer',
    items: masterFileRouteItems.filter((item) => ['modify-pdf'].includes(item.key))
  }
];
