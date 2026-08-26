import { useEffect, useState } from 'react';
import type { MasterFileTagRecord, ToothStatusRecord } from '../masterFileDirectoryService';
import type { ToothItemFieldConfig, ToothItemModuleConfig, ToothItemRecord } from '../toothItemConfigs';
import { MasterFileFormSection } from './MasterFileFormSection';
import { MasterFileModal } from './MasterFileModal';
import { MasterFileModalFooter } from './MasterFileModalFooter';
import { MasterFilePreviewCard } from './MasterFilePreviewCard';

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  config: ToothItemModuleConfig;
  initialRecord: ToothItemRecord;
  onClose: () => void;
  onSave: (record: ToothItemRecord) => void;
}

function renderFieldValue(record: ToothItemRecord, key: string) {
  return String((record as unknown as Record<string, unknown>)[key] ?? '');
}

export function MasterFileRecordModal({ open, mode, config, initialRecord, onClose, onSave }: Props) {
  const [record, setRecord] = useState<ToothItemRecord>(initialRecord);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setRecord(initialRecord);
    setErrors({});
  }, [initialRecord, open]);

  const title = mode === 'edit' ? `Edit ${config.title}` : config.modalTitle;
  const isToothCondition = config.categoryId === 'tooth-condition';
  const isToothStatus = config.categoryId === 'tooth-status';
  const generalFields = config.fields.filter((field) => isToothCondition ? ['name', 'code', 'description', 'instructions'].includes(field.key) : field.section !== 'clinical');
  const clinicalFields = config.fields.filter((field) => isToothCondition ? ['clinicalMeaning', 'category', 'severity'].includes(field.key) : field.section === 'clinical');
  const visualFields = config.fields.filter((field) => isToothCondition ? ['color'].includes(field.key) : false);
  const settingsFields = config.fields.filter((field) => isToothCondition ? ['sortOrder', 'active'].includes(field.key) : false);
  const recordView = record as unknown as Record<string, unknown>;
  const previewCode = String((isToothCondition || isToothStatus ? record.code : recordView.clinicalCode) || record.code || '-');
  const previewColor = String(recordView.color || '#cbd5e1');
  const previewMeaning = config.previewLabel(record);
  const previewDescription = String(record.description || 'Description will appear here...');
  const previewName = String(record.name || config.title);
  const isEdit = mode === 'edit';

  const updateRecord = (key: string, value: string | boolean | number) => {
    setRecord((current) => ({ ...current, [key]: value } as ToothStatusRecord & MasterFileTagRecord));
  };

  const renderField = (fieldKey: string, fieldType: ToothItemFieldConfig['type'], placeholder?: string, options?: Array<{ value: string; label: string }>) => {
    const value = renderFieldValue(record, fieldKey);

    if (fieldType === 'textarea') {
      return (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => updateRecord(fieldKey, event.target.value)}
        />
      );
    }

    if (fieldType === 'select') {
      return (
        <select
          value={value}
          onChange={(event) => updateRecord(
            fieldKey,
            event.target.value === 'true'
              ? true
              : event.target.value === 'false'
                ? false
                : event.target.value
          )}
        >
          {(options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    if (fieldType === 'color') {
      return (
        <div className="master-file-record-modal__color-field">
          <div className="master-file-record-modal__color-swatch">
            <input
              type="color"
              value={value || '#4f7bf5'}
              onChange={(event) => updateRecord(fieldKey, event.target.value)}
            />
          </div>
          <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => updateRecord(fieldKey, event.target.value)}
          />
        </div>
      );
    }

    return (
      <input
        type={fieldType === 'number' ? 'number' : 'text'}
        value={value}
        placeholder={placeholder}
        onChange={(event) => updateRecord(fieldKey, fieldType === 'number' ? Number(event.target.value) || 0 : event.target.value)}
      />
    );
  };

  const renderFieldGrid = (fields: ToothItemFieldConfig[]) => (
    <div className="master-file-record-modal__grid">
      {fields.map((field) => {
        const isFull = field.type === 'textarea';

        return (
          <label
            key={field.key}
            className={`dental-chart-input master-file-record-modal__field ${isFull ? 'master-file-record-modal__field--full' : ''}`}
          >
            <span>{field.label}</span>
            {renderField(field.key, field.type, field.placeholder, field.options)}
            {errors[field.key] && <small className="master-file-record-modal__error">{errors[field.key]}</small>}
          </label>
        );
      })}
    </div>
  );

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (!record.name.trim()) nextErrors.name = 'Name is required.';
    if (!record.code.trim()) nextErrors.code = 'Code is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(record);
  };

  return (
    <MasterFileModal
      open={open}
      title={title}
      description={config.modalDescription}
      preview={(
        <MasterFilePreviewCard
          code={previewCode}
          name={previewName}
          description={previewDescription}
          meaning={previewMeaning}
          color={previewColor}
        />
      )}
      onClose={onClose}
      width="lg"
      footer={<MasterFileModalFooter isEdit={isEdit} onClose={onClose} onSave={handleSave} />}
    >
      <MasterFileFormSection
        title="General Information"
      >
        {renderFieldGrid(generalFields)}
      </MasterFileFormSection>

      {clinicalFields.length > 0 && (
        <MasterFileFormSection
          title="Clinical Configuration"
          panelClassName="master-file-record-modal__panel--clinical"
        >
          {renderFieldGrid(clinicalFields)}
        </MasterFileFormSection>
      )}

      {visualFields.length > 0 && (
        <MasterFileFormSection
          title="Visual Configuration"
          panelClassName="master-file-record-modal__panel--visual"
        >
          {renderFieldGrid(visualFields)}
        </MasterFileFormSection>
      )}

      {settingsFields.length > 0 && (
        <MasterFileFormSection
          title="Record Settings"
          panelClassName="master-file-record-modal__panel--settings"
        >
          {renderFieldGrid(settingsFields)}
        </MasterFileFormSection>
      )}
    </MasterFileModal>
  );
}
