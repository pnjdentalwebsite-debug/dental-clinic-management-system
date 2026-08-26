import {
  masterFileDirectoryService,
  type MasterFileCategoryId
} from '../../../master-files/masterFileDirectoryService';
import type {
  DentalConditionId,
  DentalConditionOption,
  DentalTagOption
} from './dentalChartTypes';

type DentalMasterFileCategoryId = Extract<
  MasterFileCategoryId,
  'tooth-condition' | 'prosthodontics' | 'dental-surgery' | 'xray-scan-items'
>;

export interface DentalConditionConfig extends DentalConditionOption {
  code: string;
  surfaceColor: string;
  borderColor: string;
  behavior: 'clear' | 'surface' | 'whole-tooth';
}

export interface DentalTagGroup {
  title: string;
  category: DentalTagOption['category'];
  tags: DentalTagOption[];
}

export interface DentalLegendItem {
  code: string;
  label: string;
}

export interface DentalLegendGroup {
  title: string;
  items: DentalLegendItem[];
}

const categoryMap: Record<DentalMasterFileCategoryId, DentalTagOption['category']> = {
  'tooth-condition': 'conditions',
  prosthodontics: 'restorations',
  'dental-surgery': 'surgery',
  'xray-scan-items': 'xray'
};

const titleMap: Record<DentalMasterFileCategoryId, string> = {
  'tooth-condition': 'Conditions',
  prosthodontics: 'Restoration & Prosthodontics',
  'dental-surgery': 'Surgery',
  'xray-scan-items': 'Xray'
};

const buildVisualState = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const getDentalConditionOptions = (): DentalConditionConfig[] =>
  masterFileDirectoryService.getToothStatuses()
    .filter((record) => record.active)
    .map((record) => ({
      id: record.id as DentalConditionId,
      code: record.code,
      label: record.name,
      description: record.description || record.name,
      visualState: buildVisualState(record.name),
      surfaceColor: record.color,
      borderColor: record.behavior === 'clear' ? '#64748b' : record.color,
      behavior: record.behavior
    }));

export const getDentalConditionsById = () =>
  Object.fromEntries(
    getDentalConditionOptions().map((condition) => [condition.id, condition])
  ) as Record<DentalConditionId, DentalConditionConfig>;

export const getDentalTagGroups = (): DentalTagGroup[] =>
  (Object.keys(categoryMap) as DentalMasterFileCategoryId[]).map((categoryId) => ({
    title: titleMap[categoryId],
    category: categoryMap[categoryId],
    tags: masterFileDirectoryService
      .getTagRecords(categoryId)
      .filter((record) => record.active)
      .map((record) => ({
        code: record.code,
        label: record.name,
        category: categoryMap[categoryId]
      }))
  }));

export const getDentalLegendGroups = (): DentalLegendGroup[] =>
  getDentalTagGroups().map((group) => ({
    title: group.title,
    items: group.tags.map((tag) => ({
      code: tag.code,
      label: tag.label
    }))
  }));
