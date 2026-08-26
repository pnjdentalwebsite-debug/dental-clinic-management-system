import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Save,
  FileText,
  Image as ImageIcon,
  Minus,
  MoreVertical,
  PencilLine,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { DatePicker } from '../../../../../components/overlays/DatePicker';

type ModuleStatusTone = 'neutral' | 'success' | 'warning' | 'attention';

export interface PatientModuleRecordBase {
  id: string;
  statusLabel: string;
  statusTone: ModuleStatusTone;
}

export interface PatientModuleColumn<TRecord> {
  key: string;
  label: string;
  render: (record: TRecord) => ReactNode;
  exportValue?: (record: TRecord) => string;
}

export interface PatientModuleField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'number' | 'select' | 'file';
  placeholder?: string;
  readOnly?: boolean;
  span?: boolean;
  options?: string[];
  accept?: string;
}

interface Props<TRecord extends PatientModuleRecordBase> {
  patient: PatientPreviewItem;
  title: string;
  icon: LucideIcon;
  searchPlaceholder: string;
  newButtonLabel: string;
  exportFileName: string;
  emptyTitle: string;
  emptyDescription: string;
  fields: PatientModuleField[];
  columns: PatientModuleColumn<TRecord>[];
  initialRecords: (patient: PatientPreviewItem) => TRecord[];
  createDraft: (patient: PatientPreviewItem) => Record<string, string>;
  recordToDraft: (record: TRecord) => Record<string, string>;
  buildRecord: (
    draft: Record<string, string>,
    patient: PatientPreviewItem,
    existingRecord?: TRecord | null,
    uploadPreview?: UploadPreviewState | null
  ) => TRecord;
  duplicateRecord: (record: TRecord) => TRecord;
  getSearchText: (record: TRecord) => string;
  getMenuMeta: (record: TRecord) => string;
  getRowGridTemplate: () => string;
  modalTitle: {
    create: string;
    edit: string;
  };
  modalDescription: string;
  modalVariant?: 'default' | 'upload';
  getFieldOptions?: (field: PatientModuleField, draft: Record<string, string>) => string[] | undefined;
  onDraftFieldChange?: (
    fieldKey: string,
    value: string,
    draft: Record<string, string>
  ) => Partial<Record<string, string>> | void;
  storageKey?: string;
  syncEventName?: string;
}

export interface UploadPreviewState {
  file: File;
  previewUrl: string;
  kind: 'image' | 'video';
  extensionLabel: string;
  sizeLabel: string;
  resolutionLabel: string;
}

export function PatientModuleScaffold<TRecord extends PatientModuleRecordBase>({
  patient,
  title,
  icon: Icon,
  searchPlaceholder,
  newButtonLabel,
  exportFileName,
  emptyTitle,
  emptyDescription,
  fields,
  columns,
  initialRecords,
  createDraft,
  recordToDraft,
  buildRecord,
  duplicateRecord,
  getSearchText,
  getMenuMeta,
  getRowGridTemplate,
  modalTitle,
  modalDescription,
  modalVariant = 'default',
  getFieldOptions,
  onDraftFieldChange,
  storageKey,
  syncEventName
}: Props<TRecord>) {
  const loadRecords = () => {
    if (!storageKey) {
      return initialRecords(patient);
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return initialRecords(patient);
      }

      const parsed = JSON.parse(raw) as TRecord[];
      return Array.isArray(parsed) ? parsed : initialRecords(patient);
    } catch {
      return initialRecords(patient);
    }
  };

  const [records, setRecords] = useState<TRecord[]>(() => loadRecords());
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>(() => createDraft(patient));
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewState | null>(null);
  const [uploadInputVersion, setUploadInputVersion] = useState(0);
  const [isUploadImagePreviewOpen, setIsUploadImagePreviewOpen] = useState(false);
  const [uploadImageZoom, setUploadImageZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  useEffect(() => {
    if (!syncEventName) return;

    const handleSync = () => {
      setRecords(loadRecords());
    };

    window.addEventListener(syncEventName, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(syncEventName, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [syncEventName, storageKey]);

  useEffect(() => {
    return () => {
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview.previewUrl);
      }
    };
  }, [uploadPreview]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => getSearchText(record).includes(term));
  }, [getSearchText, records, search]);

  const gridTemplateColumns = useMemo(
    () => `${getRowGridTemplate()} minmax(52px, 52px)`,
    [getRowGridTemplate]
  );
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const paginatedRecords = filteredRecords.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleOpenNew = () => {
    setEditingRecordId(null);
    setFormState(createDraft(patient));
    setUploadPreview(null);
    setUploadInputVersion((version) => version + 1);
    setIsUploadImagePreviewOpen(false);
    setUploadImageZoom(1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: TRecord) => {
    setEditingRecordId(record.id);
    setFormState(recordToDraft(record));
    setUploadPreview(readRecordUploadPreview(record));
    setUploadInputVersion((version) => version + 1);
    setIsUploadImagePreviewOpen(false);
    setUploadImageZoom(1);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDuplicate = (record: TRecord) => {
    setRecords((current) => [duplicateRecord(record), ...current]);
    setActiveMenuId(null);
  };

  const handleDelete = (recordId: string) => {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setActiveMenuId(null);
  };

  const handleExport = () => {
    const header = columns.map((column) => column.label).join(',');
    const rows = records.map((record) =>
      columns
        .map((column) => {
          const raw = column.exportValue ? column.exportValue(record) : stringifyCell(column.render(record));
          return `"${raw.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${patient.id}-${exportFileName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateField = (key: string, value: string) => {
    setFormState((current) => {
      const nextDraft = { ...current, [key]: value };
      const patch = onDraftFieldChange?.(key, value, nextDraft);
      if (!patch) {
        return nextDraft;
      }

      const normalizedPatch = Object.fromEntries(
        Object.entries(patch).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      );

      return { ...nextDraft, ...normalizedPatch };
    });
  };

  const resetUploadPreview = () => {
    setUploadPreview(null);
    setIsUploadImagePreviewOpen(false);
    setUploadImageZoom(1);
  };

  const handleUploadFileChange = async (file: File | null) => {
    if (!file) {
      updateField('uploadFile', '');
      resetUploadPreview();
      return;
    }

    const preview = await buildUploadPreview(file);
    setUploadPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return preview;
    });
    updateField('uploadFile', file.name);
    if (!formState.fileName.trim()) {
      updateField('fileName', file.name);
    }
  };

  const handleUploadPreviewRemove = () => {
    resetUploadPreview();
    setFormState((current) => ({
      ...current,
      uploadFile: '',
      fileName: current.fileName === current.uploadFile ? '' : current.fileName
    }));
    setUploadInputVersion((version) => version + 1);
    setIsUploadImagePreviewOpen(false);
    setUploadImageZoom(1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const existingRecord = editingRecordId
      ? records.find((record) => record.id === editingRecordId) || null
      : null;
    const nextRecord = buildRecord(formState, patient, existingRecord, uploadPreview);

    setRecords((current) =>
      editingRecordId
        ? current.map((record) => (record.id === editingRecordId ? nextRecord : record))
        : [nextRecord, ...current]
    );
    setIsModalOpen(false);
    setEditingRecordId(null);
    resetUploadPreview();
    setIsUploadImagePreviewOpen(false);
    setUploadImageZoom(1);
  };

  return (
    <section className="progress-notes-module patient-module-workspace" aria-label={title}>
      <div className="patient-record__card progress-notes-toolbar">
        <div className="progress-notes-toolbar__title">
          <Icon size={18} />
          <strong>{title}</strong>
        </div>

        <label className="progress-notes-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </label>

        <div className="progress-notes-toolbar__actions">
          <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={() => handleSearchChange('')}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={handleExport}>
            <Download size={16} />
            Export Report
          </button>
          <button className="progress-notes-button progress-notes-button--primary" type="button" onClick={handleOpenNew}>
            <Plus size={16} />
            {newButtonLabel}
          </button>
        </div>
      </div>

      <div className="patient-record__card progress-notes-table patient-module-table">
        <div className="progress-notes-table__head patient-module-table__head" role="row" style={{ gridTemplateColumns }}>
          {columns.map((column) => (
            <span key={column.key}>{column.label}</span>
          ))}
          <span aria-label="Actions" />
        </div>

        {filteredRecords.length > 0 ? (
          paginatedRecords.map((record) => (
            <article className="progress-notes-table__row patient-module-table__row" key={record.id} style={{ gridTemplateColumns }}>
              {columns.map((column) => (
                <div key={column.key} className="patient-module-table__cell">
                  {column.render(record)}
                </div>
              ))}

              <div className="progress-notes-actions">
                <button
                  className="progress-notes-icon-button"
                  type="button"
                  aria-label={`Open options for ${title}`}
                  onClick={() => setActiveMenuId((current) => (current === record.id ? null : record.id))}
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenuId === record.id ? (
                  <PatientModuleOptionsMenu
                    menuMeta={getMenuMeta(record)}
                    onEdit={() => handleOpenEdit(record)}
                    onDuplicate={() => handleDuplicate(record)}
                    onPrint={() => {
                      window.print();
                      setActiveMenuId(null);
                    }}
                    onDelete={() => handleDelete(record.id)}
                  />
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="progress-notes-empty">
            <Icon size={36} />
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        )}
      </div>

      {filteredRecords.length > 0 ? (
        <PaginationFooter
          currentPage={currentPageSafe}
          pageCount={pageCount}
          totalRecords={filteredRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      ) : null}

      {isModalOpen ? (
        <div className="progress-note-modal-overlay" role="presentation">
          <form className={`progress-note-modal patient-module-modal ${modalVariant === 'upload' ? 'patient-module-modal--upload' : ''}`} onSubmit={handleSubmit}>
            <header className="progress-note-modal__header">
              <div className="progress-note-modal__header-left">
                {modalVariant === 'upload' ? (
                  <div className="patient-module-modal__hero-icon" aria-hidden="true">
                    <ImageIcon size={24} />
                  </div>
                ) : null}
                <div>
                <h2>{editingRecordId ? modalTitle.edit : modalTitle.create}</h2>
                <p>{modalDescription}</p>
                </div>
              </div>
              <button className="progress-note-modal__close-btn" type="button" aria-label={`Close ${title} modal`} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </header>

            <div className="progress-note-modal__body patient-module-modal__body">
              <div className="patient-module-form-grid">
                {fields.map((field) => (
                  <label
                    key={field.key}
                    className={`progress-note-field patient-module-field ${field.span ? 'patient-module-field--span' : ''} ${modalVariant === 'upload' ? 'patient-module-field--upload' : ''}`}
                  >
                    <span>{field.label}</span>
                    {renderField(
                      field,
                      formState[field.key] || '',
                      (value) => updateField(field.key, value),
                      getFieldOptions?.(field, formState) || field.options,
                      modalVariant,
                      uploadPreview,
                      uploadInputVersion,
                      handleUploadFileChange,
                      handleUploadPreviewRemove,
                      () => setIsUploadImagePreviewOpen(true)
                    )}
                  </label>
                ))}
              </div>
            </div>

            <footer className="progress-note-modal__footer">
              <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="progress-notes-button progress-notes-button--primary" type="submit">
                {modalVariant === 'upload' ? <Save size={16} /> : null}
                Save Record
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      {isUploadImagePreviewOpen && uploadPreview?.kind === 'image' ? (
        <div className="patient-module-image-lightbox" role="presentation" onClick={() => setIsUploadImagePreviewOpen(false)}>
          <div
            className="patient-module-image-lightbox__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Full image preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="patient-module-image-lightbox__header">
              <strong title={uploadPreview.file.name}>{uploadPreview.file.name}</strong>
              <div className="patient-module-image-lightbox__actions">
                <button
                  type="button"
                  aria-label="Zoom out image preview"
                  onClick={() => setUploadImageZoom((zoom) => Math.max(0.5, Number((zoom - 0.25).toFixed(2))))}
                >
                  <Minus size={18} />
                </button>
                <span>{Math.round(uploadImageZoom * 100)}%</span>
                <button
                  type="button"
                  aria-label="Zoom in image preview"
                  onClick={() => setUploadImageZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))}
                >
                  <Plus size={18} />
                </button>
                <button type="button" aria-label="Close full image preview" onClick={() => setIsUploadImagePreviewOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="patient-module-image-lightbox__body">
              <img
                src={uploadPreview.previewUrl}
                alt={uploadPreview.file.name}
                style={{ transform: `scale(${uploadImageZoom})`, transformOrigin: 'top center' }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PatientModuleOptionsMenu({
  menuMeta,
  onEdit,
  onDuplicate,
  onPrint,
  onDelete
}: {
  menuMeta: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="progress-notes-menu" role="menu">
      <div className="progress-notes-menu__header">
        <strong>Record Options</strong>
        <span>{menuMeta}</span>
      </div>
      <button type="button" onClick={onEdit}>
        <PencilLine size={16} />
        Edit Record
      </button>
      <button type="button" onClick={onDuplicate}>
        <Copy size={16} />
        Duplicate
      </button>
      <button type="button" onClick={onPrint}>
        <Printer size={16} />
        Print
      </button>
      <button className="progress-notes-menu__danger" type="button" onClick={onDelete}>
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
}

function renderField(
  field: PatientModuleField,
  value: string,
  onChange: (value: string) => void,
  options: string[] | undefined,
  modalVariant: 'default' | 'upload',
  uploadPreview?: UploadPreviewState | null,
  uploadInputVersion?: number,
  onUploadFileChange?: (file: File | null) => void,
  onUploadPreviewRemove?: () => void,
  onOpenImagePreview?: () => void
) {
  const iconMap: Partial<Record<PatientModuleField['key'], LucideIcon>> = {
    uploadedDate: CalendarDays,
    fileName: FileText,
    imageType: ImageIcon,
    requestedBy: UserRound,
    notes: FileText,
    statusLabel: CheckCircle2
  };
  const FieldIcon = modalVariant === 'upload' ? iconMap[field.key] : undefined;

  if (field.type === 'textarea') {
    return (
      <div className={`patient-module-input-shell patient-module-input-shell--textarea ${FieldIcon ? 'has-icon' : ''}`}>
        {FieldIcon ? (
          <span className="patient-module-input-shell__icon" aria-hidden="true">
            <FieldIcon size={18} />
          </span>
        ) : null}
        <textarea
          rows={4}
          value={value}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
        {modalVariant === 'upload' ? (
          <span className="patient-module-input-shell__counter">{value.length} / 500</span>
        ) : null}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={`patient-module-input-shell ${FieldIcon ? 'has-icon' : ''}`}>
        {FieldIcon ? (
          <span className="patient-module-input-shell__icon" aria-hidden="true">
            <FieldIcon size={18} />
          </span>
        ) : null}
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={field.readOnly}>
          <option value="">-- Select --</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div className={`patient-module-input-shell ${FieldIcon ? 'has-icon' : ''}`}>
        {FieldIcon ? (
          <span className="patient-module-input-shell__icon" aria-hidden="true">
            <FieldIcon size={18} />
          </span>
        ) : null}
        <DatePicker value={value} onChange={onChange} />
      </div>
    );
  }

  if (field.type === 'file') {
    return (
      <label className="patient-module-upload">
        <input
          key={uploadInputVersion}
          className="patient-module-upload__native"
          type="file"
          accept={field.accept}
          onChange={(event) => onUploadFileChange?.(event.target.files?.[0] || null)}
        />
        <div className="patient-module-upload__stack">
          <div className="patient-module-upload__surface">
            <div className="patient-module-upload__lead">
              <div className="patient-module-upload__badge">
                <UploadCloud size={20} />
              </div>
              <div className="patient-module-upload__content">
                <strong>Drag and drop or choose an image / video file</strong>
                <small>PNG, JPG, JPEG, or MP4 up to prototype-only local selection.</small>
                {value ? <em>{value}</em> : null}
              </div>
            </div>
            <div className="patient-module-upload__controls">
              <span className="patient-module-upload__cta">Browse Files</span>
            </div>
          </div>
          {uploadPreview ? (
            <FilePreview
              preview={uploadPreview}
              onRemove={onUploadPreviewRemove || (() => undefined)}
              onOpenImagePreview={onOpenImagePreview}
            />
          ) : null}
        </div>
      </label>
    );
  }

  return (
    <div className={`patient-module-input-shell ${FieldIcon ? 'has-icon' : ''}`}>
      {FieldIcon ? (
        <span className="patient-module-input-shell__icon" aria-hidden="true">
          <FieldIcon size={18} />
        </span>
      ) : null}
      <input
        type={field.type}
        value={value}
        placeholder={field.placeholder}
        readOnly={field.readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function PaginationFooter({
  currentPage,
  pageCount,
  totalRecords,
  pageSize,
  onPageChange
}: {
  currentPage: number;
  pageCount: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);

  return (
    <footer className="patient-module-pagination">
      <span>Showing {start} to {end} of {totalRecords} records</span>
      <div className="patient-module-pagination__controls" aria-label="Pagination">
        <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            type="button"
            className={page === currentPage ? 'is-active' : ''}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button type="button" disabled={currentPage >= pageCount} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </footer>
  );
}

function stringifyCell(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
}

function FilePreview({
  preview,
  onRemove,
  onOpenImagePreview
}: {
  preview: UploadPreviewState;
  onRemove: () => void;
  onOpenImagePreview?: () => void;
}) {
  return (
    <div className="patient-module-upload-preview">
      <div className="patient-module-upload-preview__eyebrow">
        <span>Preview</span>
        <strong>{preview.kind === 'image' ? 'Image' : 'Video'}</strong>
      </div>

      <div className="patient-module-upload-preview__body">
        <button
          className={`patient-module-upload-preview__media ${preview.kind === 'image' ? 'is-clickable' : ''}`}
          type="button"
          onClick={preview.kind === 'image' ? onOpenImagePreview : undefined}
          aria-label={preview.kind === 'image' ? `Open full preview for ${preview.file.name}` : preview.file.name}
        >
          {preview.kind === 'image' ? (
            <>
              <img src={preview.previewUrl} alt={preview.file.name} />
              <span className="patient-module-upload-preview__media-hint">View full preview</span>
            </>
          ) : (
            <video src={preview.previewUrl} controls preload="metadata" />
          )}
        </button>

        <div className="patient-module-upload-preview__meta">
          <strong title={preview.file.name}>{preview.file.name}</strong>
          <span>
            {preview.extensionLabel} • {preview.sizeLabel} • {preview.resolutionLabel}
          </span>
          <div className="patient-module-upload-preview__status">
            <CheckCircle2 size={15} />
            <span>File ready to upload</span>
          </div>
        </div>

        <button
          className="patient-module-upload-preview__remove"
          type="button"
          aria-label={`Remove ${preview.file.name}`}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

async function buildUploadPreview(file: File): Promise<UploadPreviewState> {
  const previewUrl = URL.createObjectURL(file);
  const kind = file.type.startsWith('video/') ? 'video' : 'image';
  const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
  const resolution = kind === 'image' ? await readImageResolution(previewUrl) : await readVideoResolution(previewUrl);

  return {
    file,
    previewUrl,
    kind,
    extensionLabel: `${extension} ${kind === 'image' ? 'Image' : 'Video'}`,
    sizeLabel: formatFileSize(file.size),
    resolutionLabel: `${resolution.width} x ${resolution.height} px`
  };
}

function readImageResolution(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = src;
  });
}

function readVideoResolution(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve({ width: video.videoWidth || 0, height: video.videoHeight || 0 });
    video.onerror = () => resolve({ width: 0, height: 0 });
    video.src = src;
  });
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
}

function readRecordUploadPreview<TRecord extends PatientModuleRecordBase>(record: TRecord): UploadPreviewState | null {
  const candidate = (record as TRecord & { uploadPreview?: UploadPreviewState | null }).uploadPreview;
  if (!candidate?.file) {
    return null;
  }

  return {
    ...candidate,
    previewUrl: URL.createObjectURL(candidate.file)
  };
}
