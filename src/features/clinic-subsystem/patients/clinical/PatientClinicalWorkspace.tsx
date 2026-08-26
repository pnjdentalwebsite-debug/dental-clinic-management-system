import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  PencilLine,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import type { PatientPreviewItem } from '../components/patientTypes';
import { DentalChart } from './dental-chart/DentalChart';
import { PatientClinicalTabs } from './PatientClinicalTabs';
import { buildPatientClinicalSummary, patientClinicalTabs } from './patientClinical.mock';
import type { ClinicalModuleStatus, PatientClinicalTabId } from './patientClinicalTypes';
import { PatientFormsWorkspace } from './certificates/PatientFormsWorkspace';
import { ProgressNotes } from './progress-notes/ProgressNotes';
import { Prescriptions } from './prescriptions/Prescriptions';
import { BillsPayments } from './bills-payments/BillsPayments';
import { UploadXrays } from './upload-xrays/UploadXrays';
import { DentalRecalls } from './dental-recalls/DentalRecalls';
import { AppointmentsModule } from './appointments/AppointmentsModule';
import { ScratchpadNotes } from './scratchpad-notes/ScratchpadNotes';
import { FollowupLists } from './followup-lists/FollowupLists';
import { Modal } from '../../../../components/overlays/Modal';
import { ConfirmationDialog } from '../../../../components/overlays/ConfirmationDialog';
import {
  loadDentalChartRecords,
  saveDentalChartRecords,
  createEmptyDentalChartRecord
} from './dental-chart/dentalChartStore';
import type { DentalChartRecord } from './dental-chart/dentalChartTypes';

interface Props {
  patient: PatientPreviewItem;
  activeTab?: PatientClinicalTabId;
  onTabChange?: (tab: PatientClinicalTabId) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const moduleStatusClassMap: Record<ClinicalModuleStatus['tone'], string> = {
  neutral: 'patient-clinical-status-card--neutral',
  attention: 'patient-clinical-status-card--attention',
  ready: 'patient-clinical-status-card--ready'
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'No Date';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(`${dateString}T00:00:00`));
  } catch {
    return dateString;
  }
};

const formatRecordTimestamp = (isoString: string) => {
  if (!isoString) return { date: 'No Date', time: '' };
  try {
    const date = new Date(isoString);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
    return { date: dateStr, time: timeStr };
  } catch {
    return { date: isoString, time: '' };
  }
};

export function PatientClinicalWorkspace({ patient, activeTab, onTabChange, showToast }: Props) {
  const [internalActiveTab, setInternalActiveTab] = useState<PatientClinicalTabId>('overview');
  const [dentalCharts, setDentalCharts] = useState<DentalChartRecord[]>(() =>
    loadDentalChartRecords(patient.id, patient.clinicId)
  );
  const [draftChart, setDraftChart] = useState<DentalChartRecord | null>(null);
  const [modalMode, setModalMode] = useState<'new' | 'edit' | 'view'>('view');
  const [searchValue, setSearchValue] = useState('');
  const [confirmDeleteChartId, setConfirmDeleteChartId] = useState<string | null>(null);
  
  const clinicalSummary = useMemo(() => buildPatientClinicalSummary(patient), [patient]);
  const currentActiveTab = activeTab ?? internalActiveTab;
  const handleTabChange = onTabChange ?? setInternalActiveTab;
  const activeTabConfig = patientClinicalTabs.find((tab) => tab.id === currentActiveTab);

  useEffect(() => {
    setDentalCharts(loadDentalChartRecords(patient.id, patient.clinicId));
  }, [patient.id, patient.clinicId]);

  const handleAddChart = () => {
    const newChart = createEmptyDentalChartRecord(patient.id);
    newChart.id = `CHART-${Date.now()}`;
    newChart.checkedDate = new Date().toISOString().split('T')[0];
    newChart.checkedBy = 'Dr. Maria Jessica Tanarte';
    setDraftChart(newChart);
    setModalMode('new');
  };

  const handleEditChart = (chart: DentalChartRecord) => {
    setDraftChart({ ...chart });
    setModalMode('edit');
  };

  const handleViewChart = (chart: DentalChartRecord) => {
    setDraftChart({ ...chart });
    setModalMode('view');
  };

  const handleDeleteChart = (chartId: string) => {
    setConfirmDeleteChartId(chartId);
  };

  const confirmDeleteChart = () => {
    if (!confirmDeleteChartId) return;
    const nextCharts = dentalCharts.filter((c) => c.id !== confirmDeleteChartId);
    setDentalCharts(nextCharts);
    saveDentalChartRecords(patient.id, nextCharts, patient.clinicId);
    setConfirmDeleteChartId(null);
    showToast?.('Dental chart record deleted.', 'success');
  };

  const handleSaveModal = () => {
    if (!draftChart) return;
    draftChart.updatedAt = new Date().toISOString();
    
    let nextCharts: DentalChartRecord[];
    if (modalMode === 'new') {
      nextCharts = [draftChart, ...dentalCharts];
    } else {
      nextCharts = dentalCharts.map((c) => (c.id === draftChart.id ? draftChart : c));
    }
    
    setDentalCharts(nextCharts);
    saveDentalChartRecords(patient.id, nextCharts, patient.clinicId);
    setDraftChart(null);
  };

  const filteredRecords = useMemo(() => {
    const search = searchValue.toLowerCase().trim();
    if (!search) return dentalCharts;
    return dentalCharts.filter((record) =>
      record.findings.toLowerCase().includes(search) ||
      record.remarks.toLowerCase().includes(search) ||
      record.checkedDate.toLowerCase().includes(search) ||
      record.checkedBy.toLowerCase().includes(search)
    );
  }, [dentalCharts, searchValue]);

  // Use the latest/first dental chart for certifications panel fallback
  const currentDentalChart = dentalCharts[0] || createEmptyDentalChartRecord(patient.id);

  return (
    <section className="patient-clinical-workspace" aria-label="Patient clinical workspace">
      <PatientClinicalTabs tabs={patientClinicalTabs} activeTab={currentActiveTab} onTabChange={handleTabChange} />

      <div className="patient-clinical-workspace__panel" role="tabpanel">
        {currentActiveTab === 'overview' ? (
          <PatientClinicalOverview summary={clinicalSummary} />
        ) : currentActiveTab === 'dental-chart' ? (
          <div className="dental-chart-history-container">
            <header className="dental-chart-history-header">
              <div className="dental-chart-history-title-group">
                <h3>Charting History, Update List, New Recall / Consult</h3>
                <p>Track patients' clinical status updates, extraoral findings, and dental screening history.</p>
              </div>
              <div className="dental-chart-history-actions">
                <button type="button" className="dental-chart-btn dental-chart-btn-outline">
                  <Filter size={14} />
                  Filter
                </button>
                <div className="dental-chart-search-wrapper">
                  <Search size={14} className="dental-chart-search-icon" />
                  <input
                    type="text"
                    placeholder="Search recall, exam, or summary..."
                    className="dental-chart-search-input"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
                <button type="button" className="dental-chart-btn dental-chart-btn-primary" onClick={handleAddChart}>
                  <Plus size={14} />
                  New Dental Chart
                </button>
              </div>
            </header>

            <div className="dental-chart-table-wrapper">
              {filteredRecords.length > 0 ? (
                <table className="dental-chart-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Recall Date</th>
                      <th style={{ width: '38%' }}>Extra Oral Examination</th>
                      <th style={{ width: '28%' }}>Recall Summary</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => {
                      const { time } = formatRecordTimestamp(record.updatedAt);
                      const isLatest = index === 0;
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="dental-chart-date-cell">
                              <div className="dental-chart-date-text">
                                <span className="dental-chart-date-val">{formatDate(record.checkedDate)}</span>
                                <span className="dental-chart-time-val">{time || '10:30 AM'}</span>
                              </div>
                              {isLatest && <span className="dental-chart-badge-latest">Latest</span>}
                            </div>
                          </td>
                          <td>{record.findings || 'No observations'}</td>
                          <td>{record.remarks || 'No remarks'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="dental-chart-action-buttons">
                              <button
                                type="button"
                                className="dental-chart-action-btn"
                                onClick={() => handleViewChart(record)}
                                title="View Dental Chart"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="dental-chart-action-btn"
                                onClick={() => handleEditChart(record)}
                                title="Edit Dental Chart"
                              >
                                <PencilLine size={14} />
                              </button>
                              <button
                                type="button"
                                className="dental-chart-action-btn btn-delete"
                                onClick={() => record.id && handleDeleteChart(record.id)}
                                title="Delete Record"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <EmptyMessage>No dental chart records found matching filters.</EmptyMessage>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Showing 1 to {filteredRecords.length} of {filteredRecords.length} records</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button type="button" className="dental-chart-action-btn" disabled style={{ opacity: 0.5 }}><ChevronLeft size={14} /></button>
                <button type="button" className="dental-chart-action-btn" style={{ background: '#1d4ed8', color: '#fff', border: 0 }}>1</button>
                <button type="button" className="dental-chart-action-btn" disabled style={{ opacity: 0.5 }}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        ) : currentActiveTab === 'progress-notes' ? (
          <ProgressNotes patient={patient} showToast={showToast} />
        ) : currentActiveTab === 'certificates' ? (
          <PatientFormsWorkspace
            patient={patient}
            dentalChart={currentDentalChart}
            dentalCharts={dentalCharts}
          />
        ) : currentActiveTab === 'prescriptions' ? (
          <Prescriptions patient={patient} />
        ) : currentActiveTab === 'bills-payments' ? (
          <BillsPayments patient={patient} />
        ) : currentActiveTab === 'upload-xrays' ? (
          <UploadXrays patient={patient} />
        ) : currentActiveTab === 'dental-recalls' ? (
          <DentalRecalls patient={patient} />
        ) : currentActiveTab === 'appointments' ? (
          <AppointmentsModule patient={patient} />
        ) : currentActiveTab === 'scratchpad-notes' ? (
          <ScratchpadNotes patient={patient} />
        ) : currentActiveTab === 'followup-lists' ? (
          <FollowupLists patient={patient} />
        ) : (
          <FutureModulePlaceholder
            title={activeTabConfig?.label || 'Clinical Module'}
            description={activeTabConfig?.description}
          />
        )}
      </div>

      {draftChart && (
        <Modal
          open={true}
          title={modalMode === 'new' ? 'New Dental Chart' : modalMode === 'edit' ? 'Edit Dental Chart' : 'View Dental Chart'}
          description="Complete the patient progress notes, treatments, teeth, remarks, and signature."
          width="xl"
          onClose={() => setDraftChart(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDraftChart(null)}
              >
                Cancel
              </button>
              {modalMode !== 'view' && (
                <button
                  type="button"
                  className="btn btn-primary dental-modal-footer-save"
                  onClick={handleSaveModal}
                >
                  Save Dental Chart
                </button>
              )}
            </>
          }
        >
          <div className="dental-modal-editor-container">
            <DentalChart
              chart={draftChart}
              onChartChange={(value) => {
                if (typeof value === 'function') {
                  setDraftChart((current) => value(current || createEmptyDentalChartRecord(patient.id)) as DentalChartRecord);
                } else {
                  setDraftChart(value);
                }
              }}
              readOnly={modalMode === 'view'}
            />
          </div>
        </Modal>
      )}

      <ConfirmationDialog
        open={Boolean(confirmDeleteChartId)}
        title="Delete Dental Chart"
        description="This dental chart entry will be removed from the patient's chart history. This action cannot be undone."
        confirmLabel="Delete Record"
        cancelLabel="Keep Record"
        destructive
        onCancel={() => {
          setConfirmDeleteChartId(null);
          showToast?.('Dental chart deletion cancelled.', 'info');
        }}
        onConfirm={confirmDeleteChart}
      />
    </section>
  );
}

function PatientClinicalOverview({ summary }: { summary: ReturnType<typeof buildPatientClinicalSummary> }) {
  const { patient } = summary;

  return (
    <div className="patient-clinical-overview">
      <WorkspaceCard title="Patient Summary">
        <dl className="patient-record__dl patient-clinical-summary-dl">
          <div><dt>Patient Name</dt><dd>{patient.name}</dd></div>
          <div><dt>Patient ID</dt><dd>{patient.id}</dd></div>
          <div><dt>Status</dt><dd>{patient.status}</dd></div>
          <div><dt>Contact</dt><dd>{patient.contact}</dd></div>
          <div><dt>Address</dt><dd>{patient.address}</dd></div>
          <div><dt>Birth Date</dt><dd>{patient.birthDate}</dd></div>
          <div><dt>Sex</dt><dd>{patient.sex}</dd></div>
          <div><dt>Balance</dt><dd>{patient.balance}</dd></div>
        </dl>
      </WorkspaceCard>

      <WorkspaceCard title="Clinical Summary">
        <div className="patient-clinical-status-grid">
          <ClinicalStatusCard item={summary.chartStatus} />
          <ClinicalStatusCard item={summary.treatmentStatus} />
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="Recent Activity">
        {summary.recentActivity.length > 0 ? (
          <ul className="patient-clinical-activity">
            {summary.recentActivity.map((entry) => <li key={entry}>{entry}</li>)}
          </ul>
        ) : (
          <EmptyMessage>No clinical activity recorded.</EmptyMessage>
        )}
      </WorkspaceCard>

      <WorkspaceCard title="Appointments Summary">
        <div className="patient-record__history">
          <div>
            <strong>Previous Appointments</strong>
            {patient.previousAppointments.length > 0 ? (
              <ul>
                {patient.previousAppointments.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            ) : (
              <EmptyMessage>No previous appointments.</EmptyMessage>
            )}
          </div>
          <div>
            <strong>Upcoming Appointments</strong>
            {patient.upcomingAppointments.length > 0 ? (
              <ul>
                {patient.upcomingAppointments.map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
            ) : (
              <EmptyMessage>No upcoming appointments.</EmptyMessage>
            )}
          </div>
        </div>
      </WorkspaceCard>
    </div>
  );
}

function WorkspaceCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="patient-record__card patient-clinical-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ClinicalStatusCard({ item }: { item: ClinicalModuleStatus }) {
  return (
    <article className={`patient-clinical-status-card ${moduleStatusClassMap[item.tone]}`}>
      <span>{item.title}</span>
      <strong>{item.statusLabel}</strong>
      <p>{item.description}</p>
    </article>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <p className="patient-clinical-empty">{children}</p>;
}

function FutureModulePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <section className="patient-record__card patient-clinical-card patient-clinical-future">
      <div className="patient-clinical-future__header">
        <p className="patient-clinical-workspace__eyebrow">Patient Module</p>
        <h3>{title}</h3>
        <p>{description || 'This workspace section is reserved for the next clinic implementation phase.'}</p>
      </div>

      <div className="patient-clinical-future__grid">
        <article className="patient-clinical-future__info-card">
          <span>Module Scope</span>
          <strong>{title}</strong>
          <p>We reserved this tab so the patient record can grow without crowding the main workspace.</p>
        </article>

        <article className="patient-clinical-future__info-card">
          <span>Current Status</span>
          <strong>Ready for next phase</strong>
          <p>The navigation is already wired and prepared for real data, forms, and patient history tools.</p>
        </article>
      </div>

      <EmptyMessage>
        No records are shown here yet. This tab is now available in navigation and ready for the next feature pass.
      </EmptyMessage>
    </section>
  );
}
