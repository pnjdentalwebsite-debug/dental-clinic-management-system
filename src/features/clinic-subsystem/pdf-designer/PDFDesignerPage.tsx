import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  FileLock2,
  GripVertical,
  PencilLine,
  Printer,
  Stethoscope
} from 'lucide-react';
import { PatientRecordPrintForm } from './PatientRecordPrintForm';
import { DentalChartPrintForm } from './DentalChartPrintForm';
import { TreatmentRecordPrintForm } from './TreatmentRecordPrintForm';
import { branchSettingsStore } from '../settings/services/branchSettingsStore';
import { CertificatePrintForm } from './CertificatePrintForm';
import { ConsentPrintForm } from './ConsentPrintForm';
import { ContractPrintForm } from './ContractPrintForm';
import { capturePrintableDocument } from './capturePrintableDocument';
import { getPrintablePages } from './getPrintablePages';
import { optimizeUploadedImage } from './optimizeUploadedImage';
import {
  createDocumentHeaderSettings,
  getDocumentThemePresentation,
  loadModifyPdfSettings,
  saveModifyPdfSettings,
  type ModifyPdfHeaderItemKey,
  type ModifyPdfModuleVisibilityKey,
  type ModifyPdfPageKey,
  type ModifyPdfSettings
} from './modifyPdfSettings';

interface Props {
  currentClinic: any;
}

type PageKey = ModifyPdfPageKey;
type HeaderItemKey = ModifyPdfHeaderItemKey;
type ModuleVisibilityKey = ModifyPdfModuleVisibilityKey;

const pageLabels: Array<{ key: PageKey; label: string }> = [
  { key: 'patient-information-form', label: 'Patient Information Form' },
  { key: 'dental-chart-form', label: 'Dental Chart Form' },
  { key: 'treatment-record', label: 'Treatment Record' },
  { key: 'certificate-form', label: 'Certificate Form' },
  { key: 'consent-form', label: 'Consent Form' },
  { key: 'contract-form', label: 'Contract Form' }
];

const previewTabLabels: Record<PageKey, string> = {
  'patient-information-form': 'Patient Form',
  'dental-chart-form': 'Dental Chart',
  'treatment-record': 'Treatment Record',
  'certificate-form': 'Certificate Form',
  'consent-form': 'Consent Form',
  'contract-form': 'Contract Form'
};

const pageVisibilityKeys: Record<PageKey, ModuleVisibilityKey> = {
  'patient-information-form': 'patient-information-record',
  'dental-chart-form': 'dental-chart',
  'treatment-record': 'treatment-record',
  'certificate-form': 'certificate-form',
  'consent-form': 'consent-form',
  'contract-form': 'contract-form'
};

const headerLayoutLabels: Record<HeaderItemKey, string> = {
  'left-image': 'Left Image (Circle)',
  'clinic-info-logo': 'Clinic Info & Logo',
  'right-photo': 'Right Photo (2x2)'
};

const visibilityRows: Array<{ key: ModuleVisibilityKey; label: string }> = [
  { key: 'patient-information-record', label: 'Patient Information Record' },
  { key: 'dental-chart', label: 'Dental Chart' },
  { key: 'treatment-record', label: 'Treatment Record' },
  { key: 'certificate-form', label: 'Certificate Form' },
  { key: 'consent-form', label: 'Consent Form' },
  { key: 'contract-form', label: 'Contract Form' }
];

export function PDFDesignerPage({ currentClinic }: Props) {
  const [settings, setSettingsState] = useState<ModifyPdfSettings>(loadModifyPdfSettings);
  const [previewPage, setPreviewPage] = useState<PageKey>('patient-information-form');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const clinicDisplayName = currentClinic?.legalBusinessName || currentClinic?.name || 'Angelo Dental Clinic';
  const activeVisibilityKey = pageVisibilityKeys[previewPage];
  const activeVisibilityLabel = visibilityRows.find(({ key }) => key === activeVisibilityKey)?.label
    ?? previewTabLabels[previewPage];

  const enabledPages = useMemo(
    () => pageLabels.filter(({ key }) => settings.pagesToExport[key]).length,
    [settings.pagesToExport]
  );

  const updateSettings = (
    updater: (current: ModifyPdfSettings) => ModifyPdfSettings
  ) => {
    setSettingsState((current) => current.locked ? current : updater(current));
    setSaveMessage('');
  };

  const updateField = <K extends keyof ModifyPdfSettings>(key: K, value: ModifyPdfSettings[K]) => {
    updateSettings((current) => ({ ...current, [key]: value }));
  };

  const updatePagesToExport = (key: PageKey, value: boolean) => {
    updateSettings((current) => ({
      ...current,
      pagesToExport: { ...current.pagesToExport, [key]: value }
    }));
  };

  const updateModuleVisibility = (
    moduleKey: ModuleVisibilityKey,
    field: 'showName' | 'showSignature',
    value: boolean
  ) => {
    updateSettings((current) => ({
      ...current,
      visibilityByModule: {
        ...current.visibilityByModule,
        [moduleKey]: {
          ...current.visibilityByModule[moduleKey],
          [field]: value
        }
      }
    }));
  };

  const moveHeaderItem = (index: number, direction: -1 | 1) => {
    updateSettings((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.headerLayoutOrder.length) return current;
      const order = [...current.headerLayoutOrder];
      const [item] = order.splice(index, 1);
      order.splice(nextIndex, 0, item);
      return { ...current, headerLayoutOrder: order };
    });
  };

  const movePatientSection = (index: number, direction: -1 | 1) => {
    updateSettings((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.patientFormSections.length) return current;
      const sections = [...current.patientFormSections];
      const [item] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, item);
      return { ...current, patientFormSections: sections };
    });
  };

  const togglePatientSectionVisibility = (sectionId: string) => {
    updateSettings((current) => ({
      ...current,
      patientFormSections: current.patientFormSections.map((section) =>
        section.id === sectionId ? { ...section, visible: !section.visible } : section
      )
    }));
  };

  const updateMarginField = (
    bucket: 'leftImageMargins' | 'middleImageMargins' | 'rightImageMargins',
    side: 'top' | 'bottom' | 'left' | 'right',
    value: number
  ) => {
    updateSettings((current) => ({
      ...current,
      [bucket]: {
        ...current[bucket],
        [side]: value
      }
    }));
  };

  const updateImageField = async (
    key: 'leftImageName' | 'middleImageName' | 'rightImageName' | 'signatureImageData',
    file?: File
  ) => {
    if (!file) return;

    setIsProcessingImage(true);
    setSaveMessage('Preparing image for reliable browser storage...');
    try {
      const imageData = await optimizeUploadedImage(
        file,
        key === 'signatureImageData' ? 480 : 800
      );
      if (key === 'signatureImageData') {
        updateSettings((current) => ({
          ...current,
          signatureImageData: imageData,
          signatureSource: file.name
        }));
      } else {
        updateField(key, imageData);
      }
      setSaveMessage('Image prepared. Select Save Configuration to publish the changes.');
    } catch (error) {
      setSaveMessage(error instanceof Error
        ? error.message
        : 'The selected image could not be prepared.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const saveConfiguration = (nextSettings = settings) => {
    if (isProcessingImage) {
      setSaveMessage('Please wait while the selected image is being prepared.');
      return false;
    }

    const didSave = saveModifyPdfSettings(nextSettings);
    if (didSave) setSettingsState(loadModifyPdfSettings());
    setSaveMessage(didSave
      ? 'Configuration saved and synchronized with patient documents.'
      : 'Configuration could not be saved. Browser storage may be full.');
    window.setTimeout(() => setSaveMessage(''), didSave ? 3200 : 6000);
    return didSave;
  };

  const toggleTemplateLock = () => {
    const nextSettings = { ...settings, locked: !settings.locked };
    setSettingsState(nextSettings);
    setSaveMessage('');
    if (nextSettings.locked) saveConfiguration(nextSettings);
  };

  const printPreviewPage = () => {
    if (enabledPages === 0) return;
    document.body.classList.add('pdf-designer-printing-multiple');
    const cleanup = () => document.body.classList.remove('pdf-designer-printing-multiple');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const downloadPreviewPage = async () => {
    const printForms = Array.from(
      document.querySelectorAll<HTMLElement>('.pdf-designer__export-page [data-pdf-print-root]')
    );
    if (printForms.length === 0 || isDownloading) return;

    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const printablePages = printForms.flatMap((printForm) => getPrintablePages(printForm));

      for (let index = 0; index < printablePages.length; index += 1) {
        const canvas = await capturePrintableDocument(printablePages[index], html2canvas);
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }
      pdf.save('clinic-selected-forms.pdf');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="pdf-designer pdf-designer--settings">
      <div className="patient-record__card pdf-designer__header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">PDF Designer</p>
          <h3>Modify PDF</h3>
          <span>Template settings workspace for clinic printable forms and records.</span>
        </div>
        <div className="pdf-designer__clinic-meta">
          <strong>{clinicDisplayName}</strong>
          <span>{currentClinic?.name || 'Main Branch'}</span>
        </div>
      </div>

      <div className="pdf-designer__settings-shell">
        <div className="pdf-designer__settings-column">
          <section className="patient-record__card pdf-settings-card pdf-settings-card--lock">
            <div className="pdf-settings-card__header">
              <div>
                <h4><FileLock2 size={18} /> {settings.locked ? 'Template is Locked' : 'Template Editing Enabled'}</h4>
                <p>
                  {settings.locked
                    ? 'Click Modify PDF to unlock and customize the template settings.'
                    : 'Draft changes appear here immediately. Save to synchronize patient documents.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isProcessingImage}
                onClick={toggleTemplateLock}
              >
                <PencilLine size={16} />
                {settings.locked ? 'Modify PDF' : 'Lock Template'}
              </button>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card pdf-settings-scope">
            <div className="pdf-settings-block__header">
              <span className="pdf-settings-scope__eyebrow">Editing settings for</span>
              <h4>{previewTabLabels[previewPage]}</h4>
              <p>Only controls relevant to this printable form are shown below.</p>
            </div>
            <nav className="pdf-settings-scope__tabs" aria-label="Document settings">
              {pageLabels.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  className={`pdf-settings-scope__tab ${previewPage === key ? 'is-active' : ''}`}
                  aria-pressed={previewPage === key}
                  onClick={() => setPreviewPage(key)}
                >
                  {previewTabLabels[key]}
                </button>
              ))}
            </nav>
          </section>

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Pages to Print / Export</h4>
            </div>
            <div className="pdf-settings-checkbox-row">
              {pageLabels.map(({ key, label }) => (
                <label key={key} className="pdf-settings-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.pagesToExport[key]}
                    disabled={settings.locked}
                    onChange={(event) => updatePagesToExport(key, event.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="pdf-settings-help">
              Checked items will be combined into a single document when you click the Print or Download PDF buttons. Each form will print on a separate page.
            </p>
            <small className="pdf-settings-meta">{enabledPages} pages selected for export.</small>
          </section>

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Header Layout Order</h4>
              <p>Click arrows to reorder how elements appear left-to-right in the header.</p>
            </div>
            <div className="pdf-settings-sort-list">
              {settings.headerLayoutOrder.map((itemKey, index) => (
                <div key={itemKey} className="pdf-settings-sort-item">
                  <span className="pdf-settings-sort-item__drag"><GripVertical size={14} /></span>
                  <div className="pdf-settings-sort-item__actions">
                    <button type="button" disabled={settings.locked || index === 0} onClick={() => moveHeaderItem(index, -1)}>
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={settings.locked || index === settings.headerLayoutOrder.length - 1}
                      onClick={() => moveHeaderItem(index, 1)}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <span>{headerLayoutLabels[itemKey]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Header & Branding</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field">
                <span>Clinic Name</span>
                <input value={settings.clinicName} disabled={settings.locked} onChange={(event) => updateField('clinicName', event.target.value)} />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show Clinic Name</span>
                <input type="checkbox" checked={settings.showClinicName} disabled={settings.locked} onChange={(event) => updateField('showClinicName', event.target.checked)} />
              </label>

              <label className="pdf-settings-field">
                <span>Address</span>
                <input value={settings.address} disabled={settings.locked} onChange={(event) => updateField('address', event.target.value)} />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show Address</span>
                <input type="checkbox" checked={settings.showAddress} disabled={settings.locked} onChange={(event) => updateField('showAddress', event.target.checked)} />
              </label>

              <label className="pdf-settings-field">
                <span>Contact</span>
                <input value={settings.contact} disabled={settings.locked} onChange={(event) => updateField('contact', event.target.value)} />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show Contact</span>
                <input type="checkbox" checked={settings.showContact} disabled={settings.locked} onChange={(event) => updateField('showContact', event.target.checked)} />
              </label>

              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Header Bottom Margin (px)</span>
                <input
                  type="number"
                  value={settings.headerBottomMargin}
                  disabled={settings.locked}
                  onChange={(event) => updateField('headerBottomMargin', Number(event.target.value) || 0)}
                />
              </label>
            </div>
          </section>

          {previewPage === 'patient-information-form' && (
          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Record Title Badge (Middle Contents Spacing)</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field">
                <span>Badge Text</span>
                <input value={settings.badgeText} disabled={settings.locked} onChange={(event) => updateField('badgeText', event.target.value)} />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show Badge</span>
                <input type="checkbox" checked={settings.showBadge} disabled={settings.locked} onChange={(event) => updateField('showBadge', event.target.checked)} />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Margin Top (px)</span>
                <input type="number" value={settings.badgeMarginTop} disabled={settings.locked} onChange={(event) => updateField('badgeMarginTop', Number(event.target.value) || 0)} />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Margin Bottom (px)</span>
                <input type="number" value={settings.badgeMarginBottom} disabled={settings.locked} onChange={(event) => updateField('badgeMarginBottom', Number(event.target.value) || 0)} />
              </label>
            </div>
          </section>
          )}

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Left Image (Circle Format)</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={settings.locked}
                  onChange={(event) => updateImageField('leftImageName', event.target.files?.[0])}
                />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show</span>
                <input type="checkbox" checked={settings.showLeftImage} disabled={settings.locked} onChange={(event) => updateField('showLeftImage', event.target.checked)} />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show Outline</span>
                <input type="checkbox" checked={settings.showLeftImageOutline} disabled={settings.locked} onChange={(event) => updateField('showLeftImageOutline', event.target.checked)} />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Size (px)</span>
                <input type="number" value={settings.leftImageSize} disabled={settings.locked} onChange={(event) => updateField('leftImageSize', Number(event.target.value) || 0)} />
              </label>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--margins">
              <label className="pdf-settings-field pdf-settings-field--small"><span>Top</span><input type="number" value={settings.leftImageMargins.top} disabled={settings.locked} onChange={(event) => updateMarginField('leftImageMargins', 'top', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Bottom</span><input type="number" value={settings.leftImageMargins.bottom} disabled={settings.locked} onChange={(event) => updateMarginField('leftImageMargins', 'bottom', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Left</span><input type="number" value={settings.leftImageMargins.left} disabled={settings.locked} onChange={(event) => updateMarginField('leftImageMargins', 'left', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Right</span><input type="number" value={settings.leftImageMargins.right} disabled={settings.locked} onChange={(event) => updateMarginField('leftImageMargins', 'right', Number(event.target.value) || 0)} /></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Middle Image (Brand Name Logo)</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={settings.locked}
                  onChange={(event) => updateImageField('middleImageName', event.target.files?.[0])}
                />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show</span>
                <input type="checkbox" checked={settings.showMiddleImage} disabled={settings.locked} onChange={(event) => updateField('showMiddleImage', event.target.checked)} />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Size (px)</span>
                <input type="number" value={settings.middleImageSize} disabled={settings.locked} onChange={(event) => updateField('middleImageSize', Number(event.target.value) || 0)} />
              </label>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--margins">
              <label className="pdf-settings-field pdf-settings-field--small"><span>Top</span><input type="number" value={settings.middleImageMargins.top} disabled={settings.locked} onChange={(event) => updateMarginField('middleImageMargins', 'top', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Bottom</span><input type="number" value={settings.middleImageMargins.bottom} disabled={settings.locked} onChange={(event) => updateMarginField('middleImageMargins', 'bottom', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Left</span><input type="number" value={settings.middleImageMargins.left} disabled={settings.locked} onChange={(event) => updateMarginField('middleImageMargins', 'left', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Right</span><input type="number" value={settings.middleImageMargins.right} disabled={settings.locked} onChange={(event) => updateMarginField('middleImageMargins', 'right', Number(event.target.value) || 0)} /></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Right Image (2x2 Photo Settings)</h4>
              <p>You can set a default image here. Note: If a patient uploads their own 2x2 photo in the Form tab, it will automatically override this placeholder.</p>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field">
                <span>Upload Default</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={settings.locked}
                  onChange={(event) => updateImageField('rightImageName', event.target.files?.[0])}
                />
              </label>
              <label className="pdf-settings-toggle-field">
                <span>Show in Print</span>
                <input type="checkbox" checked={settings.showRightImage} disabled={settings.locked} onChange={(event) => updateField('showRightImage', event.target.checked)} />
              </label>
              <label className="pdf-settings-field">
                <span>Image Fit</span>
                <select value={settings.imageFit} disabled={settings.locked} onChange={(event) => updateField('imageFit', event.target.value)}>
                  <option>Cover (Crop to fit)</option>
                  <option>Contain</option>
                  <option>Stretch</option>
                </select>
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Position X (0-100)</span>
                <input type="number" value={settings.cropPositionX} disabled={settings.locked} onChange={(event) => updateField('cropPositionX', Number(event.target.value) || 0)} />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small">
                <span>Position Y (0-100)</span>
                <input type="number" value={settings.cropPositionY} disabled={settings.locked} onChange={(event) => updateField('cropPositionY', Number(event.target.value) || 0)} />
              </label>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--margins">
              <label className="pdf-settings-field pdf-settings-field--small"><span>Top</span><input type="number" value={settings.rightImageMargins.top} disabled={settings.locked} onChange={(event) => updateMarginField('rightImageMargins', 'top', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Bottom</span><input type="number" value={settings.rightImageMargins.bottom} disabled={settings.locked} onChange={(event) => updateMarginField('rightImageMargins', 'bottom', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Left</span><input type="number" value={settings.rightImageMargins.left} disabled={settings.locked} onChange={(event) => updateMarginField('rightImageMargins', 'left', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Right</span><input type="number" value={settings.rightImageMargins.right} disabled={settings.locked} onChange={(event) => updateMarginField('rightImageMargins', 'right', Number(event.target.value) || 0)} /></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card pdf-settings-card--dentist">
            <div className="pdf-settings-block__header">
              <h4><Stethoscope size={16} /> Dentist Profile & Signature</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <div className="pdf-settings-inline-note">Default Dentist</div>
              <div className="pdf-settings-inline-note pdf-settings-inline-note--accent">Add doctors first in System Settings.</div>
              <label className="pdf-settings-field"><span>Dentist Name</span><input value={settings.dentistName} disabled={settings.locked} onChange={(event) => updateField('dentistName', event.target.value)} /></label>
              <label className="pdf-settings-field"><span>Dentist Title / Role</span><input value={settings.dentistTitle} disabled={settings.locked} onChange={(event) => updateField('dentistTitle', event.target.value)} /></label>
              <label className="pdf-settings-field"><span>License Number</span><input value={settings.dentistLicense} disabled={settings.locked} onChange={(event) => updateField('dentistLicense', event.target.value)} placeholder="Optional dentist license number" /></label>
              <label className="pdf-settings-field"><span>Current Signature Source</span><input value={settings.signatureSource} readOnly /></label>
              <label className="pdf-settings-field">
                <span>Upload Signature</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={settings.locked}
                  onChange={(event) => updateImageField('signatureImageData', event.target.files?.[0])}
                />
              </label>
              <label className="pdf-settings-field pdf-settings-field--small"><span>Signature Size (px)</span><input type="number" value={settings.signatureSize} disabled={settings.locked} onChange={(event) => updateField('signatureSize', Number(event.target.value) || 0)} /></label>
              <label className="pdf-settings-field"><span>Placement Strategy</span><select value={settings.placementStrategy} disabled={settings.locked} onChange={(event) => updateField('placementStrategy', event.target.value)}><option>Right Align</option><option>Center</option><option>Left Align</option></select></label>
            </div>
            <div className="pdf-settings-subtitle">Visibility Settings per Module</div>
            <div className="pdf-settings-visibility-list">
              <div className="pdf-settings-visibility-row">
                <strong>{activeVisibilityLabel}</strong>
                <label><span>Show Name</span><input type="checkbox" checked={settings.visibilityByModule[activeVisibilityKey].showName} disabled={settings.locked} onChange={(event) => updateModuleVisibility(activeVisibilityKey, 'showName', event.target.checked)} /></label>
                <label><span>Show Signature</span><input type="checkbox" checked={settings.visibilityByModule[activeVisibilityKey].showSignature} disabled={settings.locked} onChange={(event) => updateModuleVisibility(activeVisibilityKey, 'showSignature', event.target.checked)} /></label>
              </div>
            </div>
          </section>

          {previewPage === 'patient-information-form' && (
          <section className="patient-record__card pdf-settings-card pdf-settings-card--sections">
            <div className="pdf-settings-block__header">
              <h4>Patient Form Sections</h4>
            </div>
            <div className="pdf-settings-sort-list">
              {settings.patientFormSections.map((section, index) => (
                <div key={section.id} className="pdf-settings-sort-item">
                  <span className="pdf-settings-sort-item__drag"><GripVertical size={14} /></span>
                  <div className="pdf-settings-sort-item__actions">
                    <button type="button" disabled={settings.locked || index === 0} onClick={() => movePatientSection(index, -1)}><ArrowUp size={14} /></button>
                    <button type="button" disabled={settings.locked || index === settings.patientFormSections.length - 1} onClick={() => movePatientSection(index, 1)}><ArrowDown size={14} /></button>
                    <button type="button" disabled={settings.locked} onClick={() => togglePatientSectionVisibility(section.id)}>
                      {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                  <span>{section.label}</span>
                </div>
              ))}
            </div>
          </section>
          )}

          {previewPage === 'dental-chart-form' && (
          <section className="patient-record__card pdf-settings-card pdf-settings-card--chart">
            <div className="pdf-settings-block__header">
              <h4>Dental Chart Settings</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field"><span>Chart Main Title</span><input value={settings.chartMainTitle} disabled={settings.locked} onChange={(event) => updateField('chartMainTitle', event.target.value)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Chart Title</span><input type="checkbox" checked={settings.showChartTitle} disabled={settings.locked} onChange={(event) => updateField('showChartTitle', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Legend</span><input type="checkbox" checked={settings.showLegend} disabled={settings.locked} onChange={(event) => updateField('showLegend', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Findings</span><input type="checkbox" checked={settings.showFindings} disabled={settings.locked} onChange={(event) => updateField('showFindings', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Recommendations</span><input type="checkbox" checked={settings.showRecommendations} disabled={settings.locked} onChange={(event) => updateField('showRecommendations', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Footer (Sign-off)</span><input type="checkbox" checked={settings.showFooter} disabled={settings.locked} onChange={(event) => updateField('showFooter', event.target.checked)} /></label>
            </div>
          </section>
          )}

          {previewPage === 'treatment-record' && (
          <section className="patient-record__card pdf-settings-card pdf-settings-card--treatment">
            <div className="pdf-settings-block__header">
              <h4>Treatment Record Settings</h4>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field"><span>Table Title</span><input value={settings.treatmentTableTitle} disabled={settings.locked} onChange={(event) => updateField('treatmentTableTitle', event.target.value)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Title</span><input type="checkbox" checked={settings.showTreatmentTitle} disabled={settings.locked} onChange={(event) => updateField('showTreatmentTitle', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Dentist Column</span><input type="checkbox" checked={settings.showDentistColumn} disabled={settings.locked} onChange={(event) => updateField('showDentistColumn', event.target.checked)} /></label>
              <label className="pdf-settings-toggle-field"><span>Show Balance Column</span><input type="checkbox" checked={settings.showBalanceColumn} disabled={settings.locked} onChange={(event) => updateField('showBalanceColumn', event.target.checked)} /></label>
              <label className="pdf-settings-field"><span>Row Height Density</span><select value={settings.rowHeightDensity} disabled={settings.locked} onChange={(event) => updateField('rowHeightDensity', event.target.value)}><option>Compact (Fits More)</option><option>Comfortable</option><option>Relaxed</option></select></label>
            </div>
          </section>
          )}

          {previewPage === 'certificate-form' && (
          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Certificate Form Settings</h4>
              <p>Configure the title and opening line used by the printable dental certificate.</p>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field"><span>Certificate Title</span><input value={settings.certificateTitle} disabled={settings.locked} onChange={(event) => updateField('certificateTitle', event.target.value)} /></label>
              <label className="pdf-settings-field"><span>Opening Line</span><input value={settings.certificateIntro} disabled={settings.locked} onChange={(event) => updateField('certificateIntro', event.target.value)} /></label>
            </div>
          </section>
          )}

          {previewPage === 'consent-form' && (
          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Consent Form Settings</h4>
              <p>Configure the heading used by the printable oral surgery consent form.</p>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field"><span>Consent Form Title</span><input value={settings.consentTitle} disabled={settings.locked} onChange={(event) => updateField('consentTitle', event.target.value)} /></label>
            </div>
          </section>
          )}

          {previewPage === 'contract-form' && (
          <section className="patient-record__card pdf-settings-card">
            <div className="pdf-settings-block__header">
              <h4>Contract Form Settings</h4>
              <p>Configure the title used by the printable orthodontic treatment contract.</p>
            </div>
            <div className="pdf-settings-form-grid">
              <label className="pdf-settings-field"><span>Contract Form Title</span><input value={settings.contractTitle} disabled={settings.locked} onChange={(event) => updateField('contractTitle', event.target.value)} /></label>
            </div>
          </section>
          )}

          <section className="patient-record__card pdf-settings-card pdf-settings-card--neutral">
            <div className="pdf-settings-block__header">
              <h4>Typography</h4>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--compact">
              <label className="pdf-settings-field"><span>Font Size</span><select value={settings.fontSize} disabled={settings.locked} onChange={(event) => updateField('fontSize', event.target.value)}><option>Small</option><option>Medium</option><option>Large</option></select></label>
              <label className="pdf-settings-field"><span>Label Size</span><select value={settings.labelSize} disabled={settings.locked} onChange={(event) => updateField('labelSize', event.target.value)}><option>Small</option><option>Medium</option><option>Large</option></select></label>
              <label className="pdf-settings-field"><span>Line Spacing</span><select value={settings.lineSpacing} disabled={settings.locked} onChange={(event) => updateField('lineSpacing', event.target.value)}><option>Compact</option><option>Normal</option><option>Relaxed</option></select></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card pdf-settings-card--neutral">
            <div className="pdf-settings-block__header">
              <h4>Print Style</h4>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--compact">
              <label className="pdf-settings-field"><span>Border Style</span><select value={settings.borderStyle} disabled={settings.locked} onChange={(event) => updateField('borderStyle', event.target.value)}><option>Solid Black</option><option>Soft Gray</option><option>None</option></select></label>
              <label className="pdf-settings-field"><span>Underline Style</span><select value={settings.underlineStyle} disabled={settings.locked} onChange={(event) => updateField('underlineStyle', event.target.value)}><option>Solid</option><option>Dotted</option><option>None</option></select></label>
              <label className="pdf-settings-field"><span>Section Separator</span><select value={settings.sectionSeparator} disabled={settings.locked} onChange={(event) => updateField('sectionSeparator', event.target.value)}><option>None</option><option>Line</option><option>Soft Space</option></select></label>
              <label className="pdf-settings-field"><span>Overflow Behavior</span><select value={settings.overflowBehavior} disabled={settings.locked} onChange={(event) => updateField('overflowBehavior', event.target.value)}><option>Truncate</option><option>Wrap</option><option>Auto Expand</option></select></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-card pdf-settings-card--neutral">
            <div className="pdf-settings-block__header">
              <h4>Layout</h4>
            </div>
            <div className="pdf-settings-form-grid pdf-settings-form-grid--compact">
              <label className="pdf-settings-field"><span>Spacing Density</span><select value={settings.spacingDensity} disabled={settings.locked} onChange={(event) => updateField('spacingDensity', event.target.value)}><option>Compact</option><option>Balanced</option><option>Spacious</option></select></label>
            </div>
          </section>

          <section className="patient-record__card pdf-settings-save">
            <div>
              <strong>Configuration storage</strong>
              <span>
                {saveMessage || (settings.locked
                  ? 'The saved configuration is locked and synchronized with patient documents.'
                  : 'Save the current design to publish it to every patient document.')}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={settings.locked || isProcessingImage}
              onClick={() => saveConfiguration()}
            >
              {isProcessingImage ? 'Preparing Image...' : 'Save Configuration'}
            </button>
          </section>
        </div>

        <aside className="pdf-designer__preview-column">
          <section className="patient-record__card pdf-settings-card pdf-settings-preview">
            <div className="pdf-settings-preview__heading">
              <div className="pdf-settings-block__header">
                <h4>PDF Format Preview</h4>
                <p>Switch pages below to review how the exported document will look.</p>
              </div>
              <div className="pdf-settings-preview__actions">
                <button type="button" className="btn btn-secondary" disabled={enabledPages === 0} onClick={printPreviewPage}>
                  <Printer size={15} />
                  Print
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isDownloading || enabledPages === 0}
                  onClick={downloadPreviewPage}
                >
                  <Download size={15} />
                  {isDownloading ? 'Preparing...' : 'Download PDF'}
                </button>
              </div>
            </div>

            <div className="pdf-settings-preview__frame">
              <div className="pdf-settings-preview__tabs">
                {pageLabels.map(({ key }) => (
                  <button
                    key={key}
                    type="button"
                    className={`pdf-settings-preview__tab ${previewPage === key ? 'is-active' : ''}`}
                    onClick={() => setPreviewPage(key)}
                  >
                    {previewTabLabels[key]}
                  </button>
                ))}
              </div>

              <div className="pdf-settings-preview__sheet-wrap">
                <ConfiguredDocumentPage pageKey={previewPage} settings={settings} currentClinic={currentClinic} />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="pdf-designer__export-pages" aria-hidden="true">
        {pageLabels
          .filter(({ key }) => settings.pagesToExport[key])
          .map(({ key }) => (
            <div key={key} className="pdf-designer__export-page" data-export-page={key}>
              <ConfiguredDocumentPage pageKey={key} settings={settings} currentClinic={currentClinic} />
            </div>
          ))}
      </div>
    </section>
  );
}

function ConfiguredDocumentPage({
  pageKey,
  settings,
  currentClinic
}: {
  pageKey: PageKey;
  settings: ModifyPdfSettings;
  currentClinic?: any;
}) {
  let document: ReactNode;
  if (pageKey === 'patient-information-form') {
    document = <PatientFormPreview settings={settings} />;
  } else if (pageKey === 'dental-chart-form') {
    document = <DentalChartPreview settings={settings} currentClinic={currentClinic} />;
  } else if (pageKey === 'treatment-record') {
    document = <TreatmentRecordPreview settings={settings} />;
  } else if (pageKey === 'certificate-form') {
    const visibility = settings.visibilityByModule['certificate-form'];
    document = (
      <CertificatePrintForm
        headerSettings={createDocumentHeaderSettings(settings)}
        title={settings.certificateTitle}
        intro={settings.certificateIntro}
        dentistName={visibility.showName ? settings.dentistName : ''}
        dentistTitle={visibility.showName ? settings.dentistTitle : ''}
        dentistLicense={settings.dentistLicense}
        signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
        signatureSize={settings.signatureSize}
        signaturePlacement={settings.placementStrategy}
      />
    );
  } else if (pageKey === 'contract-form') {
    document = (
      <ContractPrintForm
        headerSettings={createDocumentHeaderSettings(settings)}
        title={settings.contractTitle}
        dentistName={settings.dentistName}
        dentistRole={settings.dentistTitle}
        treatmentPackage="Package description / fee"
        balanceTerms="Balance payment terms"
        downPaymentTerms={[
          'Down payment term line 1',
          'Down payment term line 2',
          'Down payment term line 3',
          'Down payment term line 4',
          'Down payment term line 5'
        ]}
      />
    );
  } else {
    const visibility = settings.visibilityByModule['consent-form'];
    document = (
      <ConsentPrintForm
        headerSettings={createDocumentHeaderSettings(settings)}
        title={settings.consentTitle}
        dentistName={visibility.showName ? settings.dentistName : ''}
        signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
        signatureSize={settings.signatureSize}
        signaturePlacement={settings.placementStrategy}
      />
    );
  }

  return <DocumentTheme settings={settings}>{document}</DocumentTheme>;
}

function PatientFormPreview({ settings }: { settings: ModifyPdfSettings }) {
  const visibility = settings.visibilityByModule['patient-information-record'];
  return (
    <PatientRecordPrintForm
      clinicName={settings.clinicName}
      address={settings.address}
      contact={settings.contact}
      badgeText={settings.badgeText}
      showClinicName={settings.showClinicName}
      showAddress={settings.showAddress}
      showContact={settings.showContact}
      showBadge={settings.showBadge}
      showLeftImage={settings.showLeftImage}
      showLeftImageOutline={settings.showLeftImageOutline}
      showRightImage={settings.showRightImage}
      headerSettings={createDocumentHeaderSettings(settings)}
      badgeMarginTop={settings.badgeMarginTop}
      badgeMarginBottom={settings.badgeMarginBottom}
      dentistName={visibility.showName ? settings.dentistName : ''}
      signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
      signatureSize={settings.signatureSize}
      signaturePlacement={settings.placementStrategy}
      sectionOrder={settings.patientFormSections.map((section) => section.id)}
      visibleSectionIds={new Set(
        settings.patientFormSections
          .filter((section) => section.visible)
          .map((section) => section.id)
      )}
    />
  );
}

function DentalChartPreview({ settings, currentClinic }: { settings: ModifyPdfSettings; currentClinic?: any }) {
  const visibility = settings.visibilityByModule['dental-chart'];
  const clinicId = currentClinic?.id || 'CLN-000013';
  const notation = useMemo(() => {
    try {
      return branchSettingsStore.getSettings(clinicId).clinicalDefaults.toothNumberingSystem || 'FDI';
    } catch {
      return 'FDI';
    }
  }, [clinicId]);

  return (
    <DentalChartPrintForm
      clinicName={settings.clinicName}
      address={settings.address}
      contact={settings.contact}
      chartTitle={settings.chartMainTitle}
      showTitle={settings.showChartTitle}
      showClinicName={settings.showClinicName}
      showAddress={settings.showAddress}
      showContact={settings.showContact}
      showLeftImage={settings.showLeftImage}
      showLeftImageOutline={settings.showLeftImageOutline}
      showRightImage={settings.showRightImage}
      headerSettings={createDocumentHeaderSettings(settings)}
      showLegend={settings.showLegend}
      showFindings={settings.showFindings}
      showRecommendations={settings.showRecommendations}
      showFooter={settings.showFooter}
      dentistName={visibility.showName ? settings.dentistName : ''}
      signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
      signatureSize={settings.signatureSize}
      signaturePlacement={settings.placementStrategy}
      notation={notation}
    />
  );
}

function TreatmentRecordPreview({ settings }: { settings: ModifyPdfSettings }) {
  const visibility = settings.visibilityByModule['treatment-record'];
  return (
    <TreatmentRecordPrintForm
      clinicName={settings.clinicName}
      address={settings.address}
      contact={settings.contact}
      title={settings.treatmentTableTitle}
      dentistTitle={visibility.showName ? settings.dentistTitle : ''}
      dentistName={visibility.showName ? settings.dentistName : ''}
      showClinicName={settings.showClinicName}
      showAddress={settings.showAddress}
      showContact={settings.showContact}
      showLeftImage={settings.showLeftImage}
      showLeftImageOutline={settings.showLeftImageOutline}
      showRightImage={settings.showRightImage}
      headerSettings={createDocumentHeaderSettings(settings)}
      showTitle={settings.showTreatmentTitle}
      showDentistColumn={settings.showDentistColumn}
      showBalanceColumn={settings.showBalanceColumn}
      rowHeightDensity={settings.rowHeightDensity}
      signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
      signatureSize={settings.signatureSize}
      signaturePlacement={settings.placementStrategy}
    />
  );
}

function DocumentTheme({
  settings,
  children
}: {
  settings: ModifyPdfSettings;
  children: ReactNode;
}) {
  const presentation = getDocumentThemePresentation(settings);
  return <div className={presentation.className} style={presentation.style}>{children}</div>;
}
