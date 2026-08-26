import { useMemo, useState } from 'react';
import { ClinicPageHeader } from '../components/ClinicPageHeader';
import {
  masterFileDirectoryService,
  type MasterFileCategoryId,
  type ToothStatusBehavior
} from '../master-files/masterFileDirectoryService';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  onReturnToDashboard: () => void;
}

const categories: MasterFileCategoryId[] = [
  'tooth-status',
  'tooth-condition',
  'prosthodontics',
  'dental-surgery',
  'xray-scan-items'
];

const defaultStatusForm = {
  id: '',
  code: '',
  name: '',
  description: '',
  color: '#4f7bf5',
  active: true,
  sortOrder: 0,
  behavior: 'surface' as ToothStatusBehavior
};

const defaultTagForm = {
  id: '',
  code: '',
  name: '',
  description: '',
  active: true,
  sortOrder: 0
};

export function MasterFilesPage({ currentClinic, showToast, onReturnToDashboard }: Props) {
  const [activeCategory, setActiveCategory] = useState<MasterFileCategoryId>('tooth-status');
  const [version, setVersion] = useState(0);
  const [statusForm, setStatusForm] = useState(defaultStatusForm);
  const [tagForm, setTagForm] = useState(defaultTagForm);

  const toothStatuses = useMemo(() => masterFileDirectoryService.getToothStatuses(), [version]);
  const tagRecords = useMemo(
    () =>
      activeCategory === 'tooth-status'
        ? []
        : masterFileDirectoryService.getTagRecords(activeCategory),
    [activeCategory, version]
  );

  const refresh = () => setVersion((current) => current + 1);

  const resetForms = () => {
    setStatusForm(defaultStatusForm);
    setTagForm(defaultTagForm);
  };

  const handleSaveStatus = () => {
    if (!statusForm.name.trim() || !statusForm.code.trim()) {
      showToast('Tooth status requires both name and code.', 'info');
      return;
    }
    masterFileDirectoryService.saveToothStatus(statusForm);
    refresh();
    resetForms();
    showToast('Tooth status saved.', 'success');
  };

  const handleSaveTag = () => {
    if (activeCategory === 'tooth-status') {
      return;
    }
    if (!tagForm.name.trim() || !tagForm.code.trim()) {
      showToast('Category item requires both name and code.', 'info');
      return;
    }
    masterFileDirectoryService.saveTagRecord({
      ...tagForm,
      categoryId: activeCategory
    });
    refresh();
    resetForms();
    showToast(`${masterFileDirectoryService.getCategoryLabel(activeCategory)} item saved.`, 'success');
  };

  return (
    <div className="clinic-settings master-file-directory">
      <ClinicPageHeader
        sectionLabel="CLINIC CONFIGURATION"
        title="Master File Directory"
        subtitle={`Manage reusable clinic records and dental chart categories for ${currentClinic?.name || 'this clinic branch'}.`}
        actions={(
          <div className="master-file-directory__header-actions">
            <button type="button" className="btn btn-outline" onClick={() => { refresh(); showToast('Master files refreshed.', 'info'); }}>
              Refresh
            </button>
            <button type="button" className="btn btn-outline clinic-settings__return" onClick={onReturnToDashboard}>
              Return to Branch Dashboard
            </button>
          </div>
        )}
      />

      <section className="master-file-directory__workspace patient-record__card">
        <aside className="master-file-directory__sidebar">
          <p className="master-file-directory__sidebar-title">Dental Chart Items</p>
          <div className="master-file-directory__nav">
            {categories.map((categoryId) => {
              const count = categoryId === 'tooth-status'
                ? toothStatuses.length
                : masterFileDirectoryService.getTagRecords(categoryId).length;
              const active = activeCategory === categoryId;

              return (
                <button
                  key={categoryId}
                  type="button"
                  className={`master-file-directory__nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveCategory(categoryId);
                    resetForms();
                  }}
                >
                  <span>{masterFileDirectoryService.getCategoryLabel(categoryId)}</span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="master-file-directory__content">
          {activeCategory === 'tooth-status' ? (
            <>
              <section className="master-file-directory__section">
                <div>
                  <p className="patient-clinical-workspace__eyebrow">Tooth Status</p>
                  <h3>Dental chart color statuses</h3>
                  <p className="master-file-directory__description">Statuses saved here appear as selectable color chips in the dental chart.</p>
                </div>
                <div className="master-file-directory__form-grid">
                  <label className="dental-chart-input">
                    <span>Name</span>
                    <input value={statusForm.name} onChange={(event) => setStatusForm((current) => ({ ...current, name: event.target.value }))} placeholder="Cavity" />
                  </label>
                  <label className="dental-chart-input">
                    <span>Code</span>
                    <input value={statusForm.code} onChange={(event) => setStatusForm((current) => ({ ...current, code: event.target.value }))} placeholder="CV" />
                  </label>
                  <label className="dental-chart-input">
                    <span>Description</span>
                    <input value={statusForm.description} onChange={(event) => setStatusForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short chart meaning" />
                  </label>
                  <label className="dental-chart-input">
                    <span>Color</span>
                    <input type="color" value={statusForm.color} onChange={(event) => setStatusForm((current) => ({ ...current, color: event.target.value }))} />
                  </label>
                  <label className="dental-chart-input">
                    <span>Behavior</span>
                    <select value={statusForm.behavior} onChange={(event) => setStatusForm((current) => ({ ...current, behavior: event.target.value as ToothStatusBehavior }))}>
                      <option value="surface">Surface Color</option>
                      <option value="whole-tooth">Whole Tooth</option>
                      <option value="clear">Clear</option>
                    </select>
                  </label>
                  <label className="dental-chart-input">
                    <span>Sort Order</span>
                    <input type="number" value={statusForm.sortOrder} onChange={(event) => setStatusForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} />
                  </label>
                </div>
                <div className="master-file-directory__section-actions">
                  <button type="button" className="btn btn-outline" onClick={resetForms}>Clear Form</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveStatus}>Save Tooth Status</button>
                </div>
              </section>

              <section className="master-file-directory__table patient-record__card">
                <div className="master-file-directory__table-header">
                  <h4>Saved Tooth Status Records</h4>
                  <span>{toothStatuses.length} items</span>
                </div>
                <div className="master-file-directory__rows">
                  {toothStatuses.map((record) => (
                    <article key={record.id} className="master-file-directory__row">
                      <div>
                        <strong>{record.name}</strong>
                        <p>{record.code} · {record.description || 'No description'}</p>
                      </div>
                      <div className="master-file-directory__row-meta">
                        <span className="master-file-directory__color-chip"><i style={{ backgroundColor: record.color }} />{record.color}</span>
                        <span>{record.behavior}</span>
                        <span>{record.active ? 'Active' : 'Inactive'}</span>
                        <button type="button" className="btn btn-outline" onClick={() => setStatusForm(record)}>Edit</button>
                        <button type="button" className="btn btn-outline" onClick={() => { masterFileDirectoryService.deleteToothStatus(record.id); refresh(); showToast('Tooth status deleted.', 'success'); }}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="master-file-directory__section">
                <div>
                  <p className="patient-clinical-workspace__eyebrow">{masterFileDirectoryService.getCategoryLabel(activeCategory)}</p>
                  <h3>{masterFileDirectoryService.getCategoryLabel(activeCategory)}</h3>
                  <p className="master-file-directory__description">Items saved here appear inside the dental chart tooth box popover under the matching category.</p>
                </div>
                <div className="master-file-directory__form-grid">
                  <label className="dental-chart-input">
                    <span>Name</span>
                    <input value={tagForm.name} onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))} placeholder="Present Teeth" />
                  </label>
                  <label className="dental-chart-input">
                    <span>Code</span>
                    <input value={tagForm.code} onChange={(event) => setTagForm((current) => ({ ...current, code: event.target.value }))} placeholder="/" />
                  </label>
                  <label className="dental-chart-input master-file-directory__form-grid--full">
                    <span>Description</span>
                    <input value={tagForm.description} onChange={(event) => setTagForm((current) => ({ ...current, description: event.target.value }))} placeholder="Chart meaning" />
                  </label>
                  <label className="dental-chart-input">
                    <span>Sort Order</span>
                    <input type="number" value={tagForm.sortOrder} onChange={(event) => setTagForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} />
                  </label>
                </div>
                <div className="master-file-directory__section-actions">
                  <button type="button" className="btn btn-outline" onClick={resetForms}>Clear Form</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveTag}>Save Category Item</button>
                </div>
              </section>

              <section className="master-file-directory__table patient-record__card">
                <div className="master-file-directory__table-header">
                  <h4>Saved Category Items</h4>
                  <span>{tagRecords.length} items</span>
                </div>
                <div className="master-file-directory__rows">
                  {tagRecords.map((record) => (
                    <article key={record.id} className="master-file-directory__row">
                      <div>
                        <strong>{record.name}</strong>
                        <p>{record.code} · {record.description || 'No description'}</p>
                      </div>
                      <div className="master-file-directory__row-meta">
                        <span>{record.active ? 'Active' : 'Inactive'}</span>
                        <button type="button" className="btn btn-outline" onClick={() => setTagForm(record)}>Edit</button>
                        <button type="button" className="btn btn-outline" onClick={() => { masterFileDirectoryService.deleteTagRecord(record.id); refresh(); showToast('Category item deleted.', 'success'); }}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
