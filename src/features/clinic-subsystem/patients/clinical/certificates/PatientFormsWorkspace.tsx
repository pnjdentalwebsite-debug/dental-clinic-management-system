import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Activity,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  FileSignature,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import type { DentalChartRecord } from '../dental-chart/dentalChartTypes';
import type { ToothNotationSystem } from '../dental-chart/toothNotationHelper';
import {
  buildPatientDocumentIdentity,
  getPatientDocumentDate
} from '../../components/patientDocumentData';
import { PatientRecordPrintForm } from '../../../pdf-designer/PatientRecordPrintForm';
import { DentalChartPrintForm } from '../../../pdf-designer/DentalChartPrintForm';
import {
  TreatmentRecordPrintForm,
  type PrintableTreatmentRow
} from '../../../pdf-designer/TreatmentRecordPrintForm';
import { CertificatePrintForm } from '../../../pdf-designer/CertificatePrintForm';
import { ConsentPrintForm } from '../../../pdf-designer/ConsentPrintForm';
import { ContractPrintForm } from '../../../pdf-designer/ContractPrintForm';
import { capturePrintableDocument } from '../../../pdf-designer/capturePrintableDocument';
import { getPrintablePages } from '../../../pdf-designer/getPrintablePages';
import {
  createDocumentHeaderSettings,
  getDocumentThemePresentation,
  loadModifyPdfSettings,
  subscribeToModifyPdfSettings,
  type ModifyPdfPageKey,
  type ModifyPdfSettings
} from '../../../pdf-designer/modifyPdfSettings';
import {
  createDefaultContractLedgerRows,
  loadPatientContractForm,
  savePatientContractForm,
  type PatientContractFormData
} from './contractFormStore';

interface Props {
  patient: PatientPreviewItem;
  dentalChart: DentalChartRecord;
  dentalCharts: DentalChartRecord[];
}

const documentItems: Array<{
  key: ModifyPdfPageKey;
  label: string;
  source: string;
  icon: typeof FileText;
}> = [
  {
    key: 'patient-information-form',
    label: 'Patient Form',
    source: 'Patient profile and registration information',
    icon: FileText
  },
  {
    key: 'dental-chart-form',
    label: 'Dental Chart Form',
    source: 'Patient identity and dental chart workspace',
    icon: Activity
  },
  {
    key: 'treatment-record',
    label: 'Treatment Record Form',
    source: 'Patient treatment and appointment history',
    icon: ClipboardList
  },
  {
    key: 'certificate-form',
    label: 'Certificate Form',
    source: 'Patient identity and clinic certificate template',
    icon: BadgeCheck
  },
  {
    key: 'consent-form',
    label: 'Consent Form',
    source: 'Patient identity and medical profile',
    icon: ShieldCheck
  },
  {
    key: 'contract-form',
    label: 'Contract Form',
    source: 'Orthodontic treatment contract and ledger package',
    icon: FileSignature
  }
];

export function PatientFormsWorkspace({ patient, dentalChart, dentalCharts }: Props) {
  const [activeDocument, setActiveDocument] = useState<ModifyPdfPageKey>('patient-information-form');
  const [zoom, setZoom] = useState(1.15);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDentalChartId, setSelectedDentalChartId] = useState<string>(() => dentalCharts[0]?.id || '');
  const [notationOverride, setNotationOverride] = useState<ToothNotationSystem | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [settings, setSettings] = useState<ModifyPdfSettings>(loadModifyPdfSettings);
  const [contractForm, setContractForm] = useState<PatientContractFormData>(() =>
    loadPatientContractForm(patient, loadModifyPdfSettings())
  );
  const activeItem = documentItems.find((item) => item.key === activeDocument) || documentItems[0];
  const selectedDentalChart = useMemo(() => {
    if (!dentalCharts.length) return dentalChart;
    return dentalCharts.find((record) => record.id === selectedDentalChartId) || dentalCharts[0];
  }, [dentalChart, dentalCharts, selectedDentalChartId]);

  const effectiveNotation: ToothNotationSystem = notationOverride || selectedDentalChart?.toothNotation || 'FDI';

  useEffect(() => {
    const syncSettings = () => setSettings(loadModifyPdfSettings());
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncSettings();
    };
    const unsubscribe = subscribeToModifyPdfSettings(setSettings);

    window.addEventListener('focus', syncSettings);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', syncSettings);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setContractForm(loadPatientContractForm(patient, settings));
  }, [patient.id, patient.clinicId]);

  useEffect(() => {
    savePatientContractForm(patient.id, contractForm, patient.clinicId);
  }, [contractForm, patient.id, patient.clinicId]);

  useEffect(() => {
    if (!dentalCharts.length) {
      setSelectedDentalChartId('');
      return;
    }

    setSelectedDentalChartId((current) =>
      dentalCharts.some((record) => record.id === current) ? current : dentalCharts[0]?.id || ''
    );
  }, [dentalCharts]);

  const printDocument = () => {
    document.body.classList.add('pdf-designer-printing');
    const cleanup = () => document.body.classList.remove('pdf-designer-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const downloadDocument = async () => {
    const printable = previewRef.current?.querySelector<HTMLElement>('[data-pdf-print-root]');
    if (!printable || isDownloading) return;

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
      const printablePages = getPrintablePages(printable);

      for (let index = 0; index < printablePages.length; index += 1) {
        const canvas = await capturePrintableDocument(printablePages[index], html2canvas);
        if (index > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save(`${patient.id}-${activeDocument}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateZoom = (difference: number) => {
    setZoom((current) => Math.min(1.5, Math.max(0.55, Number((current + difference).toFixed(2)))));
  };

  const updateContractField = <K extends keyof PatientContractFormData>(
    key: K,
    value: PatientContractFormData[K]
  ) => {
    setContractForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateContractTerm = (index: number, value: string) => {
    setContractForm((current) => ({
      ...current,
      downPaymentTerms: current.downPaymentTerms.map((term, termIndex) =>
        termIndex === index ? value : term
      )
    }));
  };

  const updateContractLedgerRow = (
    rowId: string,
    key: 'date' | 'amountCharged' | 'amountPaid' | 'remarks' | 'signature',
    value: string
  ) => {
    setContractForm((current) => ({
      ...current,
      ledgerRows: current.ledgerRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [key]: value
            }
          : row
      )
    }));
  };

  const addContractRow = () => {
    setContractForm((current) => ({
      ...current,
      ledgerRows: [
        ...current.ledgerRows,
        {
          id: `contract-ledger-${Date.now()}`,
          date: '',
          amountCharged: '',
          amountPaid: '',
          remarks: '',
          signature: ''
        }
      ]
    }));
  };

  const resetContractRows = () => {
    setContractForm((current) => ({
      ...current,
      ledgerRows: createDefaultContractLedgerRows()
    }));
  };

  return (
    <section className="patient-forms-workspace" aria-label="Patient documents and forms">
      <aside className="patient-forms-workspace__sidebar">
        <header>
          <span>Documents &amp; Forms</span>
          <small>Patient ID: {patient.id}</small>
        </header>
        <nav aria-label="Patient printable forms">
          {documentItems.map(({ key, label, icon: Icon }) => (
            <div key={key} className="patient-forms-workspace__nav-item">
              <button
                type="button"
                className={activeDocument === key ? 'is-active' : ''}
                onClick={() => setActiveDocument(key)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </button>

              {key === 'dental-chart-form' && activeDocument === 'dental-chart-form' && (
                <DentalChartHistoryRail
                  dentalCharts={dentalCharts}
                  selectedDentalChartId={selectedDentalChartId}
                  onSelect={setSelectedDentalChartId}
                />
              )}
            </div>
          ))}
        </nav>
        <div className="patient-forms-workspace__source">
          <strong>Template source</strong>
          <span>Master File Directory / Modify PDF</span>
        </div>
      </aside>

      <div className="patient-forms-workspace__main">
        <header className="patient-forms-workspace__toolbar">
          <div>
            <span>Patient document</span>
            <h3>{activeItem.label}</h3>
            <p>{activeItem.source}. Available patient details are filled automatically.</p>
          </div>
          <div className="patient-forms-workspace__actions">
            {activeDocument === 'dental-chart-form' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <label
                  htmlFor="history-notation-select"
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  NOTATION:
                </label>
                <select
                  id="history-notation-select"
                  value={effectiveNotation}
                  onChange={(e) => setNotationOverride(e.target.value as ToothNotationSystem)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--primary)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="FDI">FDI (ISO-3950 Two-Digit 11–48 / 51–85)</option>
                  <option value="Universal">Universal (ADA) (1–32 / A–T)</option>
                  <option value="Palmer">Palmer Notation (1–8 / A–E with Quadrants)</option>
                </select>
              </div>
            )}
            <button type="button" className="btn btn-outline" onClick={printDocument}>
              <Printer size={16} aria-hidden="true" />
              Print
            </button>
            <button type="button" className="btn btn-primary" onClick={downloadDocument}>
              <Download size={16} aria-hidden="true" />
              {isDownloading ? 'Preparing...' : 'Download PDF'}
            </button>
          </div>
        </header>

        {activeDocument === 'contract-form' && (
          <ContractFormEditor
            form={contractForm}
            onFieldChange={updateContractField}
            onTermChange={updateContractTerm}
            onLedgerRowChange={updateContractLedgerRow}
            onAddRow={addContractRow}
            onResetRows={resetContractRows}
          />
        )}

        <div className="patient-forms-workspace__preview-heading">
          <div>
            <strong>Printable Preview</strong>
            <span>Template settings and selected patient data are combined below.</span>
          </div>
          <div className="patient-forms-workspace__zoom" aria-label="Preview zoom controls">
            <button type="button" aria-label="Zoom out" onClick={() => updateZoom(-0.08)}>
              <ZoomOut size={15} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}>
              <RotateCcw size={14} />
            </button>
            <button type="button" aria-label="Zoom in" onClick={() => updateZoom(0.08)}>
              <ZoomIn size={15} />
            </button>
          </div>
        </div>

        <div className="patient-forms-workspace__preview" ref={previewRef}>
          <div
            className="patient-forms-workspace__sheet"
            style={{ '--patient-document-zoom': zoom } as CSSProperties}
          >
            <PatientConfiguredDocument
              pageKey={activeDocument}
              patient={patient}
              settings={settings}
              dentalChart={selectedDentalChart}
              contractForm={contractForm}
              notation={effectiveNotation}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PatientConfiguredDocument({
  pageKey,
  patient,
  settings,
  dentalChart,
  contractForm,
  notation
}: {
  pageKey: ModifyPdfPageKey;
  patient: PatientPreviewItem;
  settings: ModifyPdfSettings;
  dentalChart: DentalChartRecord;
  contractForm: PatientContractFormData;
  notation?: ToothNotationSystem;
}) {
  const identity = buildPatientDocumentIdentity(patient);
  const headerSettings = createDocumentHeaderSettings(settings);
  const presentation = getDocumentThemePresentation(settings);
  const allergies = patient.allergies
    .split(/[,;/]/)
    .map((item) => item.trim())
    .filter((item) => item && !/^none/i.test(item));
  let document: ReactNode;

  if (pageKey === 'patient-information-form') {
    const visibility = settings.visibilityByModule['patient-information-record'];
    document = (
      <PatientRecordPrintForm
        patient={patient}
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
        headerSettings={headerSettings}
        badgeMarginTop={settings.badgeMarginTop}
        badgeMarginBottom={settings.badgeMarginBottom}
        dentistName={visibility.showName ? settings.dentistName : ''}
        signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
        signatureSize={settings.signatureSize}
        signaturePlacement={settings.placementStrategy}
        sectionOrder={settings.patientFormSections.map((section) => section.id)}
        visibleSectionIds={new Set(
          settings.patientFormSections.filter((section) => section.visible).map((section) => section.id)
        )}
      />
    );
  } else if (pageKey === 'dental-chart-form') {
    const visibility = settings.visibilityByModule['dental-chart'];
    document = (
      <DentalChartPrintForm
        patient={patient}
        dentalChart={dentalChart}
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
        headerSettings={headerSettings}
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
  } else if (pageKey === 'treatment-record') {
    const visibility = settings.visibilityByModule['treatment-record'];
    document = (
      <TreatmentRecordPrintForm
        rows={buildTreatmentRows(patient)}
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
        headerSettings={headerSettings}
        showTitle={settings.showTreatmentTitle}
        showDentistColumn={settings.showDentistColumn}
        showBalanceColumn={settings.showBalanceColumn}
        rowHeightDensity={settings.rowHeightDensity}
        signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
        signatureSize={settings.signatureSize}
        signaturePlacement={settings.placementStrategy}
      />
    );
  } else if (pageKey === 'certificate-form') {
    const visibility = settings.visibilityByModule['certificate-form'];
    document = (
      <CertificatePrintForm
        headerSettings={headerSettings}
        title={settings.certificateTitle}
        intro={settings.certificateIntro}
        patientName={identity.fullName}
        patientAge={identity.age}
        issueDate={getPatientDocumentDate()}
        clinicName={settings.clinicName}
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
        headerSettings={headerSettings}
        title={settings.contractTitle}
        patientName={contractForm.patientName}
        patientAge={contractForm.age}
        patientAddress={contractForm.address}
        patientContact={contractForm.contact}
        patientBirthDate={contractForm.birthDate}
        acknowledgementPrintedName={contractForm.acknowledgementPrintedName}
        acknowledgementAddressAt={contractForm.acknowledgementAddressAt}
        acknowledgementAge={contractForm.acknowledgementAge}
        dentistName={contractForm.dentistName}
        dentistRole={contractForm.dentistRole}
        treatmentPackage={contractForm.treatmentPackage}
        balanceTerms={contractForm.balanceTerms}
        downPaymentTerms={contractForm.downPaymentTerms}
        ledgerRows={contractForm.ledgerRows}
      />
    );
  } else {
    const visibility = settings.visibilityByModule['consent-form'];
    document = (
      <ConsentPrintForm
        headerSettings={headerSettings}
        title={settings.consentTitle}
        patientName={identity.fullName}
        birthDate={identity.birthDateIso}
        patientAge={identity.age}
        patientStatus={patient.civilStatus || ''}
        selectedMedicalConditions={patient.medicalConditions}
        selectedAllergies={allergies}
        dentistName={visibility.showName ? settings.dentistName : ''}
        signatureImageData={visibility.showSignature ? settings.signatureImageData : ''}
        signatureSize={settings.signatureSize}
        signaturePlacement={settings.placementStrategy}
      />
    );
  }

  return <div className={presentation.className} style={presentation.style}>{document}</div>;
}

function ContractFormEditor({
  form,
  onFieldChange,
  onTermChange,
  onLedgerRowChange,
  onAddRow,
  onResetRows
}: {
  form: PatientContractFormData;
  onFieldChange: <K extends keyof PatientContractFormData>(key: K, value: PatientContractFormData[K]) => void;
  onTermChange: (index: number, value: string) => void;
  onLedgerRowChange: (
    rowId: string,
    key: 'date' | 'amountCharged' | 'amountPaid' | 'remarks' | 'signature',
    value: string
  ) => void;
  onAddRow: () => void;
  onResetRows: () => void;
}) {
  return (
    <section className="patient-record__card patient-contract-editor">
      <div className="patient-contract-editor__header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Contract Form Source</p>
          <h4>Orthodontic Contract Fields</h4>
          <span>Patient details are filled locally and reflected immediately in the printable preview.</span>
        </div>
        <button type="button" className="btn btn-outline" onClick={onResetRows}>
          Reset Rows
        </button>
      </div>

      <div className="patient-contract-editor__grid">
        <FormSection title="Auto-filled Patient Details">
          <Field label="Patient Name">
            <input value={form.patientName} onChange={(event) => onFieldChange('patientName', event.target.value)} />
          </Field>
          <Field label="Age">
            <input value={form.age} onChange={(event) => onFieldChange('age', event.target.value)} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(event) => onFieldChange('address', event.target.value)} />
          </Field>
          <Field label="Tel./Mobile No.">
            <input value={form.contact} onChange={(event) => onFieldChange('contact', event.target.value)} />
          </Field>
          <Field label="Date of Birth" wide>
            <input type="date" value={form.birthDate} onChange={(event) => onFieldChange('birthDate', event.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Page 3 Acknowledgement">
          <Field label="Printed Name">
            <input value={form.acknowledgementPrintedName} onChange={(event) => onFieldChange('acknowledgementPrintedName', event.target.value)} />
          </Field>
          <Field label="Address at">
            <input value={form.acknowledgementAddressAt} onChange={(event) => onFieldChange('acknowledgementAddressAt', event.target.value)} />
          </Field>
          <Field label="Age">
            <input value={form.acknowledgementAge} onChange={(event) => onFieldChange('acknowledgementAge', event.target.value)} />
          </Field>
          <Field label="Dentist Name">
            <input value={form.dentistName} onChange={(event) => onFieldChange('dentistName', event.target.value)} />
          </Field>
          <Field label="Dentist Role" wide>
            <input value={form.dentistRole} onChange={(event) => onFieldChange('dentistRole', event.target.value)} />
          </Field>
        </FormSection>
      </div>

      <FormSection title="Orthodontic Treatment Package" action={(
        <button type="button" className="btn btn-primary" onClick={onAddRow}>
          <Plus size={14} />
          Add Row
        </button>
      )}>
        <div className="patient-contract-editor__grid patient-contract-editor__grid--single">
          <Field label="Treatment Package">
            <textarea value={form.treatmentPackage} onChange={(event) => onFieldChange('treatmentPackage', event.target.value)} rows={4} />
          </Field>
          <Field label="Balance Terms">
            <textarea value={form.balanceTerms} onChange={(event) => onFieldChange('balanceTerms', event.target.value)} rows={4} />
          </Field>
        </div>
        <div className="patient-contract-editor__down-payments">
          <strong>Down Payment Terms</strong>
          {form.downPaymentTerms.map((term, index) => (
            <input
              key={`payment-term-${index}`}
              value={term}
              placeholder={`Down payment term line ${index + 1}`}
              onChange={(event) => onTermChange(index, event.target.value)}
            />
          ))}
        </div>
        <div className="patient-contract-editor__ledger">
          <div className="patient-contract-editor__ledger-head">
            <span>Date</span>
            <span>Amount Charged</span>
            <span>Amount Paid</span>
            <span>Remarks</span>
            <span>Signature</span>
          </div>
          {form.ledgerRows.map((row) => (
            <div key={row.id} className="patient-contract-editor__ledger-row">
              <input type="date" value={row.date} onChange={(event) => onLedgerRowChange(row.id, 'date', event.target.value)} />
              <input value={row.amountCharged} placeholder="0.00" onChange={(event) => onLedgerRowChange(row.id, 'amountCharged', event.target.value)} />
              <input value={row.amountPaid} placeholder="0.00" onChange={(event) => onLedgerRowChange(row.id, 'amountPaid', event.target.value)} />
              <input value={row.remarks} onChange={(event) => onLedgerRowChange(row.id, 'remarks', event.target.value)} />
              <input value={row.signature} onChange={(event) => onLedgerRowChange(row.id, 'signature', event.target.value)} />
            </div>
          ))}
        </div>
      </FormSection>
    </section>
  );
}

function FormSection({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="patient-contract-editor__section">
      <header>
        <div>
          <strong>{title}</strong>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  wide = false,
  children
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`patient-contract-editor__field ${wide ? 'is-wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function buildTreatmentRows(patient: PatientPreviewItem): PrintableTreatmentRow[] {
  return patient.previousAppointments.map((appointment, index) => {
    const [date = '', ...descriptionParts] = appointment.split(' - ');
    return {
      id: `${patient.id}-history-${index}`,
      date,
      toothNumber: '',
      procedure: descriptionParts.join(' - '),
      dentist: '',
      amountCharged: '',
      amountPaid: '',
      balance: ''
    };
  });
}

function DentalChartHistoryRail({
  dentalCharts,
  selectedDentalChartId,
  onSelect
}: {
  dentalCharts: DentalChartRecord[];
  selectedDentalChartId: string;
  onSelect: (chartId: string) => void;
}) {
  const pageSize = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(dentalCharts.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);
  const pageStart = (normalizedPage - 1) * pageSize;
  const visibleCharts = dentalCharts.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, Math.max(1, Math.ceil(dentalCharts.length / pageSize))));
  }, [dentalCharts.length]);

  return (
    <div className="patient-forms-history-rail">
      <strong className="patient-forms-history-rail__label">Chart History</strong>
      {dentalCharts.length > 0 ? (
        <>
          <div className="patient-forms-history-rail__list">
            {visibleCharts.map((record) => {
            const isSelected = record.id === selectedDentalChartId;
            const summary = record.remarks || record.findings || 'No summary';

            return (
              <button
                key={record.id || `${record.patientId}-${record.updatedAt}`}
                type="button"
                className={`patient-forms-history-rail__item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelect(record.id || '')}
              >
                <div className="patient-forms-history-rail__item-head">
                  <span>{formatHistoryDate(record.checkedDate)}</span>
                  <span className="patient-forms-history-rail__badge">
                    {record.toothNotation || 'FDI'}
                  </span>
                  {isSelected && <Check size={13} aria-hidden="true" />}
                </div>
                <small title={summary}>{summary}</small>
              </button>
            );
            })}
          </div>
          <div className="patient-forms-history-rail__pagination">
            <button
              type="button"
              className="patient-forms-history-rail__page-btn"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={normalizedPage === 1}
              aria-label="Previous history page"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="patient-forms-history-rail__page-indicator">
              {normalizedPage}/{totalPages}
            </span>
            <button
              type="button"
              className="patient-forms-history-rail__page-btn"
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              disabled={normalizedPage === totalPages}
              aria-label="Next history page"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </>
      ) : (
        <span className="patient-forms-history-rail__empty">No chart history yet.</span>
      )}
    </div>
  );
}

function formatHistoryDate(dateString: string) {
  if (!dateString) return 'No date';
  const [year = '', month = '', day = ''] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${year}-${month}-${day}`;
}
