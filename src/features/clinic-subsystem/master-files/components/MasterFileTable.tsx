import { Copy, Pencil, Trash2 } from 'lucide-react';
import type { ToothItemRecord, ToothItemModuleConfig } from '../toothItemConfigs';
import { MasterFilePagination } from './MasterFilePagination';

interface Props {
  config: ToothItemModuleConfig;
  records: ToothItemRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit: (record: ToothItemRecord) => void;
  onDelete: (record: ToothItemRecord) => void;
  onDuplicate: (record: ToothItemRecord) => void;
  onAdd: () => void;
}

export function MasterFileTable({
  config,
  records,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onEdit,
  onDelete,
  onDuplicate,
  onAdd
}: Props) {
  const isToothCondition = config.categoryId === 'tooth-condition';
  const isToothStatus = config.categoryId === 'tooth-status';
  const isPrescriptionTemplates = config.categoryId === 'prescription-templates';

  return (
    <section className={`patient-record__card master-file-admin-table ${isToothCondition ? 'master-file-admin-table--tooth-condition' : ''}`}>
      {!isToothStatus ? (
        <div className="master-file-admin-table__header">
          <div>
            <p className="patient-clinical-workspace__eyebrow">{config.sectionLabel}</p>
            <h3>{config.title}</h3>
            <p className="master-file-directory__description">{config.description}</p>
          </div>
        </div>
      ) : null}

      <div className="master-file-admin-table__grid">
        {records.length === 0 ? (
          <div className="master-file-admin-table__empty-state">
            <div className="master-file-admin-table__empty-copy">
              <h3>
                {isToothStatus ? 'No tooth status records found.' : `No ${config.title.toLowerCase()} records found.`}
              </h3>
              <p>
                {isToothStatus
                  ? 'Create the first reusable tooth status to start configuring dental chart color labels.'
                  : `Add a new ${config.title.toLowerCase()} record to populate this configuration table.`}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary master-file-admin-table__empty-action"
              onClick={onAdd}
            >
              + {config.addLabel}
            </button>
          </div>
        ) : (
          <>
            {isToothCondition ? (
              <div className="master-file-admin-table__row master-file-admin-table__row--header">
                <span>Code</span>
                <span>Name</span>
                <span>Clinical Meaning</span>
                <span>Description</span>
                <span>Chart Behavior</span>
                <span>Status</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
            ) : (
              <div className="master-file-admin-table__row master-file-admin-table__row--header">
                <span>Code</span>
                <span>Name</span>
                <span>Description</span>
                <span>Details</span>
                <span>Status</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
            )}

            {records.map((record) => (
              isToothCondition ? (
                <div key={record.id} className="master-file-admin-table__row master-file-admin-table__row--tooth-condition">
                  <div className="master-file-admin-table__code master-file-admin-table__code--condition">
                    <span className="master-file-admin-table__code-symbol" style={{ backgroundColor: ('color' in record && record.color) ? record.color : '#94a3b8' }} />
                    <strong>{record.code || '-'}</strong>
                  </div>
                  <div className="master-file-admin-table__name">
                    <strong>{record.name}</strong>
                    {'color' in record && record.color ? (
                      <span className="master-file-directory__color-chip">
                        <i style={{ backgroundColor: record.color }} />
                        {record.color}
                      </span>
                    ) : null}
                  </div>
                  <span>{'clinicalMeaning' in record && record.clinicalMeaning ? record.clinicalMeaning : '-'}</span>
                  <span>{record.description || '-'}</span>
                  <span className="master-file-admin-table__behavior">
                    {'category' in record && record.category ? record.category.replace(/-/g, ' ') : '-'}
                  </span>
                  <span className={`master-file-admin-table__status ${record.active ? 'is-active' : 'is-inactive'}`}>
                    {record.active ? 'Active' : 'Inactive'}
                  </span>
                  <span>{record.updatedAt}</span>
                  <div className="master-file-admin-table__actions">
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button"
                      onClick={() => onEdit(record)}
                      aria-label={`Edit ${record.name}`}
                      title={`Edit ${record.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button"
                      onClick={() => onDuplicate(record)}
                      aria-label={`Duplicate ${record.name}`}
                      title={`Duplicate ${record.name}`}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button is-danger"
                      onClick={() => onDelete(record)}
                      aria-label={`Delete ${record.name}`}
                      title={`Delete ${record.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div key={record.id} className="master-file-admin-table__row">
                  <span className="master-file-admin-table__code">
                    <strong>{record.code || '-'}</strong>
                  </span>
                  <div className="master-file-admin-table__name">
                    <strong>{record.name}</strong>
                    {'color' in record && record.color ? (
                      <span className="master-file-directory__color-chip">
                        <i style={{ backgroundColor: record.color }} />
                        {record.color}
                      </span>
                    ) : null}
                  </div>
                  <span className="master-file-admin-table__description">
                    {record.description || '-'}
                  </span>
                  <span className={`master-file-admin-table__details ${isPrescriptionTemplates ? 'master-file-admin-table__details--prescription' : ''}`}>
                    {isPrescriptionTemplates ? (
                      <span className="master-file-admin-table__details-preview">
                        <span className="master-file-admin-table__details-text">
                          {config.detailsValue(record) || '-'}
                        </span>
                        {config.detailsValue(record) ? (
                          <span className="master-file-admin-table__details-tooltip" role="tooltip">
                            {config.detailsValue(record)}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      config.detailsValue(record) || '-'
                    )}
                  </span>
                  <span className={`master-file-admin-table__status ${record.active ? 'is-active' : 'is-inactive'}`}>
                    <span className="master-file-admin-table__status-dot" />
                    {record.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="master-file-admin-table__updated">{record.updatedAt}</span>
                  <div className="master-file-admin-table__actions">
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button"
                      onClick={() => onEdit(record)}
                      aria-label={`Edit ${record.name}`}
                      title={`Edit ${record.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button"
                      onClick={() => onDuplicate(record)}
                      aria-label={`Duplicate ${record.name}`}
                      title={`Duplicate ${record.name}`}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      className="master-file-admin-table__icon-button is-danger"
                      onClick={() => onDelete(record)}
                      aria-label={`Delete ${record.name}`}
                      title={`Delete ${record.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </div>

      <MasterFilePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        hideControls={records.length === 0}
      />
    </section>
  );
}
