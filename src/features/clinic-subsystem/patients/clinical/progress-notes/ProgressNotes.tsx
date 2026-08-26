import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  MoreVertical,
  PencilLine,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { DatePicker } from '../../../../../components/overlays/DatePicker';
import { ConfirmationDialog } from '../../../../../components/overlays/ConfirmationDialog';
import { masterFileDirectoryService } from '../../../master-files/masterFileDirectoryService';
import {
  countAppointmentsForProgressNote,
  removeAppointmentsForProgressNote,
  syncAppointmentsFromProgressNote
} from '../appointments/appointmentStore';
import {
  countBillPaymentsForProgressNote,
  removeBillPaymentsForProgressNote,
  syncBillPaymentsFromProgressNote
} from '../bills-payments/billPaymentStore';
import {
  countDentalRecallsForProgressNote,
  removeDentalRecallsForProgressNote,
  syncDentalRecallsFromProgressNote
} from '../dental-recalls/dentalRecallStore';
import { countCalendarRecallsForProgressNote } from '../../../scheduling/scheduleStorage';
import {
  loadProgressNotes,
  saveProgressNotes,
  type ProgressNoteRecord,
  type ProgressNoteServiceRow,
  type ProgressNoteStatus
} from './progressNoteStore';

type ServiceRow = ProgressNoteServiceRow;

interface ClinicalServiceOption {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultPrice: number;
  treatmentCategory: string;
}

type ProgressNote = ProgressNoteRecord;

interface ProgressNoteFormState {
  patientName: string;
  visitDate: string;
  visitTime: string;
  recallDate: string;
  recallTime: string;
  recallReason: string;
  title: string;
  dentist: string;
  notes: string;
  services: ServiceRow[];
  discount: string;
  dateSigned?: string;
}

interface Props {
  patient: PatientPreviewItem;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface ProgressNoteConfirmState {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const createEmptyForm = (patient: PatientPreviewItem): ProgressNoteFormState => ({
  patientName: patient.name,
  visitDate: '2026-08-01',
  visitTime: '15:47',
  recallDate: '',
  recallTime: '',
  recallReason: '',
  title: '',
  dentist: '',
  notes: '',
  services: [],
  discount: '0',
  dateSigned: ''
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));

const formatTime = (time: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(`2026-08-01T${time || '00:00'}:00`));

const getTotalCost = (services: ServiceRow[]) => services.reduce((total, service) => total + Number(service.cost || 0), 0);

const getValidServices = (services: ServiceRow[]) =>
  services.filter((service) => service.service.trim() && Number(service.cost || 0) > 0);

const getIncompleteServices = (services: ServiceRow[]) =>
  services.filter((service) => service.service.trim() || service.tooth.trim() || Number(service.cost || 0) > 0)
    .filter((service) => !(service.service.trim() && Number(service.cost || 0) > 0));

const noteToForm = (note: ProgressNote): ProgressNoteFormState => ({
  patientName: note.patientName,
  visitDate: note.visitDate,
  visitTime: note.visitTime,
  recallDate: note.recallDate,
  recallTime: note.recallTime,
  recallReason: note.recallReason,
  title: note.title,
  dentist: note.dentist,
  notes: note.notes,
  services: note.services,
  discount: String(note.discount),
  dateSigned: ''
});

export function ProgressNotes({ patient, showToast }: Props) {
  const [notes, setNotes] = useState<ProgressNote[]>(() => loadProgressNotes(patient));
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProgressNoteFormState>(() => createEmptyForm(patient));
  const [currentPage, setCurrentPage] = useState(1);
  const [formSnapshot, setFormSnapshot] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<ProgressNoteConfirmState | null>(null);
  const pageSize = 5;
  const clinicalServiceOptions = useMemo<ClinicalServiceOption[]>(
    () =>
      masterFileDirectoryService.getActiveTagRecords('clinical-services').map((record) => ({
        id: record.id,
        code: record.code,
        name: record.name,
        description: record.description && record.description !== '-' ? record.description : '',
        defaultPrice: Number(record.defaultPrice) || 0,
        treatmentCategory: record.treatmentCategory || ''
      })),
    []
  );
  const recallReasonOptions = useMemo(() => {
    const records = masterFileDirectoryService.getActiveTagRecords('recall-reasons');
    const names = records.map((record) => record.name).filter(Boolean);

    if (formState.recallReason && !names.includes(formState.recallReason)) {
      return [formState.recallReason, ...names];
    }

    return names;
  }, [formState.recallReason]);

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return notes;
    }

    return notes.filter((note) =>
      [note.title, note.notes, note.patientName, note.recallReason, note.dentist].join(' ').toLowerCase().includes(term)
    );
  }, [notes, search]);
  const pageCount = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const paginatedNotes = filteredNotes.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  const persistNotesState = (nextNotes: ProgressNote[]) => {
    saveProgressNotes(patient.id, nextNotes, patient.clinicId);
    setNotes(nextNotes);
  };

  useEffect(() => {
    setNotes(loadProgressNotes(patient));
  }, [patient.id]);

  const serializeFormState = (state: ProgressNoteFormState) => JSON.stringify({
    ...state,
    services: state.services.map((service) => ({
      id: service.id,
      service: service.service.trim(),
      tooth: service.tooth.trim(),
      cost: Number(service.cost || 0)
    })),
    discount: String(state.discount || '0').trim(),
    notes: state.notes.trim(),
    title: state.title.trim(),
    dentist: state.dentist.trim(),
    recallReason: state.recallReason.trim()
  });

  const hasUnsavedChanges = isModalOpen && serializeFormState(formState) !== formSnapshot;

  const isPastRecallDate = (recallDate: string) => {
    if (!recallDate) return false;
    const selectedDate = new Date(`${recallDate}T00:00:00`);
    const today = new Date('2026-08-10T00:00:00');
    return !Number.isNaN(selectedDate.getTime()) && selectedDate < today;
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const openConfirmation = (config: ProgressNoteConfirmState) => {
    setConfirmState(config);
  };

  const closeConfirmation = () => {
    setConfirmState(null);
  };

  const openNewModal = () => {
    setEditingNoteId(null);
    const emptyForm = createEmptyForm(patient);
    setFormState(emptyForm);
    setFormSnapshot(serializeFormState(emptyForm));
    setIsModalOpen(true);
  };

  const openEditModal = (note: ProgressNote) => {
    setEditingNoteId(note.id);
    const nextForm = noteToForm(note);
    setFormState(nextForm);
    setFormSnapshot(serializeFormState(nextForm));
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDuplicate = (note: ProgressNote) => {
    const nextNotes = [
      ...notes,
      {
        ...note,
        id: `NOTE-${Date.now()}`,
        title: `${note.title} Copy`,
        status: 'Draft' as const
      }
    ];
    persistNotesState(nextNotes);
    showToast?.('Draft copy created. Review and save it to create new linked billing or recall records.', 'success');
    setActiveMenuId(null);
  };

  const handleDelete = (note: ProgressNote) => {
    const linkedBillCount = countBillPaymentsForProgressNote(patient, note.id);
    const linkedAppointmentCount = countAppointmentsForProgressNote(patient, note.id);
    const linkedDentalRecallCount = countDentalRecallsForProgressNote(patient, note.id);
    const linkedCalendarCount = countCalendarRecallsForProgressNote(note.id, patient.clinicId);

    openConfirmation({
      title: 'Delete Progress Note',
      description: `Delete "${note.title}" dated ${formatDate(note.visitDate)}?${linkedBillCount > 0 ? ` ${linkedBillCount} linked billing entr${linkedBillCount === 1 ? 'y' : 'ies'} will be removed.` : ''}${linkedAppointmentCount > 0 ? ` ${linkedAppointmentCount} linked recall appointment entr${linkedAppointmentCount === 1 ? 'y' : 'ies'} will be removed.` : ''}${linkedDentalRecallCount > 0 ? ` ${linkedDentalRecallCount} linked dental recall entr${linkedDentalRecallCount === 1 ? 'y' : 'ies'} will be removed.` : ''}${linkedCalendarCount > 0 ? ` ${linkedCalendarCount} linked calendar recall entr${linkedCalendarCount === 1 ? 'y' : 'ies'} will be removed.` : ''} This action cannot be undone.`,
      confirmLabel: 'Delete Note',
      cancelLabel: 'Keep Note',
      destructive: true,
      onConfirm: () => {
        closeConfirmation();
        const removedBillCount = removeBillPaymentsForProgressNote(patient, note.id);
        const removedAppointmentResult = removeAppointmentsForProgressNote(patient, note.id);
        const removedDentalRecallCount = removeDentalRecallsForProgressNote(patient, note.id);
        persistNotesState(notes.filter((entry) => entry.id !== note.id));

        const successParts = [
          'Progress note deleted.',
          removedBillCount > 0 ? `${removedBillCount} linked billing entr${removedBillCount === 1 ? 'y' : 'ies'} removed.` : '',
          removedAppointmentResult.appointmentRemovedCount > 0
            ? `${removedAppointmentResult.appointmentRemovedCount} linked recall appointment entr${removedAppointmentResult.appointmentRemovedCount === 1 ? 'y' : 'ies'} removed.`
            : '',
          removedAppointmentResult.calendarRemovedCount > 0
            ? `${removedAppointmentResult.calendarRemovedCount} linked calendar recall entr${removedAppointmentResult.calendarRemovedCount === 1 ? 'y' : 'ies'} removed.`
            : '',
          removedDentalRecallCount > 0
            ? `${removedDentalRecallCount} linked dental recall entr${removedDentalRecallCount === 1 ? 'y' : 'ies'} removed.`
            : ''
        ].filter(Boolean);

        showToast?.(successParts.join(' '), 'success');
        setActiveMenuId(null);
      },
      onCancel: () => {
        closeConfirmation();
        showToast?.('Progress note deletion cancelled.', 'info');
        setActiveMenuId(null);
      }
    });
  };

  const handlePrint = () => {
    window.print();
    setActiveMenuId(null);
  };

  const handleExport = () => {
    const rows = notes.map((note) =>
      [formatDate(note.visitDate), note.title, note.notes || 'No notes documented.', formatCurrency(getTotalCost(note.services) - note.discount), note.status].join(',')
    );
    const csv = ['Date,Progress Note,Remarks,Net Cost,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${patient.id}-progress-notes.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateField = <K extends keyof ProgressNoteFormState>(field: K, value: ProgressNoteFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const addServiceRow = () => {
    setFormState((current) => ({
      ...current,
      services: [...current.services, { id: `service-${Date.now()}`, service: '', tooth: '', cost: 0 }]
    }));
  };

  const updateServiceRow = <K extends keyof ServiceRow>(id: string, field: K, value: ServiceRow[K]) => {
    setFormState((current) => ({
      ...current,
      services: current.services.map((service) => (service.id === id ? { ...service, [field]: value } : service))
    }));
  };

  const removeServiceRow = (id: string) => {
    setFormState((current) => ({
      ...current,
      services: current.services.filter((service) => service.id !== id)
    }));
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    if (!hasUnsavedChanges) {
      setIsModalOpen(false);
      setEditingNoteId(null);
      return;
    }

    openConfirmation({
      title: 'Discard Progress Note Changes',
      description: 'Any unsaved progress in this note will be lost.',
      confirmLabel: 'Discard Changes',
      cancelLabel: 'Keep Editing',
      destructive: true,
      onConfirm: () => {
        closeConfirmation();
        showToast?.('Unsaved progress note changes were discarded.', 'info');
        setIsModalOpen(false);
        setEditingNoteId(null);
      },
      onCancel: () => {
        closeConfirmation();
      }
    });
  };

  const persistProgressNote = async (
    status: ProgressNoteStatus,
    options?: {
      acceptPastRecallDate?: boolean;
      acceptMissingRecallReason?: boolean;
      acceptMissingRecallDate?: boolean;
      acceptRecallTimeWithoutDate?: boolean;
      acceptIncompleteServices?: boolean;
      acceptClinicalOnlySave?: boolean;
    }
  ) => {
    const hasRecallDate = Boolean(formState.recallDate);
    const hasRecallReason = Boolean(formState.recallReason.trim());
    const hasRecallTime = Boolean(formState.recallTime.trim());
    const hasLinkedRecallReady = hasRecallDate && hasRecallReason;
    const validServices = getValidServices(formState.services);
    const incompleteServices = getIncompleteServices(formState.services);

    if (!formState.visitDate) {
      showToast?.('Visit date is required before saving the progress note.', 'error');
      return;
    }

    if (status === 'Saved' && isPastRecallDate(formState.recallDate) && !options?.acceptPastRecallDate) {
      openConfirmation({
        title: 'Past Recall Date',
        description: 'Recall date is already in the past. Continue anyway?',
        confirmLabel: 'Save Anyway',
        cancelLabel: 'Review Date',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptPastRecallDate: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    if (status === 'Saved' && hasRecallDate && !hasRecallReason && !options?.acceptMissingRecallReason) {
      openConfirmation({
        title: 'Missing Recall Reason',
        description: 'Recall date is set but recall reason is empty. Save this progress note without creating a linked appointment, dental recall, and calendar recall?',
        confirmLabel: 'Save Without Recall Link',
        cancelLabel: 'Complete Recall Reason',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptMissingRecallReason: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    if (status === 'Saved' && hasRecallReason && !hasRecallDate && !options?.acceptMissingRecallDate) {
      openConfirmation({
        title: 'Missing Recall Date',
        description: 'Recall reason is set but recall date is empty. Save this progress note without creating a linked appointment, dental recall, and calendar recall?',
        confirmLabel: 'Save Without Recall Link',
        cancelLabel: 'Complete Recall Date',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptMissingRecallDate: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    if (status === 'Saved' && hasRecallTime && !hasRecallDate && !options?.acceptRecallTimeWithoutDate) {
      openConfirmation({
        title: 'Recall Time Needs a Date',
        description: 'Recall time is set but recall date is empty. Save this progress note without creating a linked appointment, dental recall, and calendar recall?',
        confirmLabel: 'Save Without Recall Link',
        cancelLabel: 'Complete Recall Date',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptRecallTimeWithoutDate: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    if (status === 'Saved' && incompleteServices.length > 0 && !options?.acceptIncompleteServices) {
      openConfirmation({
        title: 'Incomplete Service Rows',
        description: 'Some service rows are incomplete and will not be included in Bills & Payments. Continue saving this progress note?',
        confirmLabel: 'Save Progress Note',
        cancelLabel: 'Review Service Rows',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptIncompleteServices: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    if (status === 'Saved' && validServices.length === 0 && !hasLinkedRecallReady && !options?.acceptClinicalOnlySave) {
      openConfirmation({
        title: 'Save as Clinical Note Only',
        description: 'This progress note has no billable service rows and no complete recall link. It will save without creating linked Bills, Appointment, Dental Recall, or Calendar records.',
        confirmLabel: 'Save Note Only',
        cancelLabel: 'Review Note',
        onConfirm: () => {
          closeConfirmation();
          void persistProgressNote(status, { ...options, acceptClinicalOnlySave: true });
        },
        onCancel: closeConfirmation
      });
      return;
    }

    setIsSaving(true);

    try {
      const nextNote: ProgressNote = {
        id: editingNoteId ?? `NOTE-${Date.now()}`,
        patientName: formState.patientName,
        visitDate: formState.visitDate,
        visitTime: formState.visitTime,
        recallDate: formState.recallDate,
        recallTime: formState.recallTime,
        recallReason: formState.recallReason,
        title: formState.title || 'Clinical Progress Note',
        dentist: formState.dentist,
        notes: formState.notes,
        attachments: [],
        services: formState.services,
        discount: Number(formState.discount || 0),
        status
      };

      const nextNotes = editingNoteId
        ? notes.map((note) => (note.id === editingNoteId ? nextNote : note))
        : [nextNote, ...notes];

      persistNotesState(nextNotes);

      let syncedBillCount = 0;
      let createdBillCount = 0;
      let updatedBillCount = 0;
      let removedBillCount = 0;
      let billSyncFailed = false;
      let appointmentSyncFailed = false;
      let dentalRecallSyncFailed = false;
      let appointmentSynced = false;
      let appointmentRemoved = false;
      let dentalRecallSynced = false;
      let dentalRecallRemoved = false;
      let calendarSynced = false;
      let calendarRemoved = false;

      if (status === 'Saved') {
        try {
          const billResult = syncBillPaymentsFromProgressNote(patient, nextNote);
          syncedBillCount = billResult.syncedCount;
          createdBillCount = billResult.createdCount;
          updatedBillCount = billResult.updatedCount;
          removedBillCount = billResult.removedCount;
        } catch {
          billSyncFailed = true;
        }

        try {
          const appointmentResult = syncAppointmentsFromProgressNote(patient, nextNote);
          appointmentSynced = appointmentResult.synced;
          appointmentRemoved = appointmentResult.removed;
          calendarSynced = appointmentResult.calendarSynced;
          calendarRemoved = appointmentResult.calendarRemoved;
        } catch {
          appointmentSyncFailed = true;
        }

        try {
          const dentalRecallResult = syncDentalRecallsFromProgressNote(patient, nextNote);
          dentalRecallSynced = dentalRecallResult.synced;
          dentalRecallRemoved = dentalRecallResult.removed;
        } catch {
          dentalRecallSyncFailed = true;
        }
      }

      const successMessage = status === 'Draft'
        ? 'Draft saved successfully. No billing, appointment, dental recall, or calendar sync was created yet.'
        : editingNoteId
          ? syncedBillCount > 0 || appointmentSynced || appointmentRemoved || dentalRecallSynced || dentalRecallRemoved || calendarSynced || calendarRemoved || validServices.length === 0
            ? `Progress note updated successfully.${syncedBillCount > 0 ? ` ${syncedBillCount} billing entr${syncedBillCount === 1 ? 'y' : 'ies'} synced.` : validServices.length === 0 ? ' No billable service rows were synced.' : ''}${updatedBillCount > 0 ? ` ${updatedBillCount} billing entr${updatedBillCount === 1 ? 'y was' : 'ies were'} updated.` : ''}${createdBillCount > 0 ? ` ${createdBillCount} new billing entr${createdBillCount === 1 ? 'y was' : 'ies were'} created.` : ''}${removedBillCount > 0 ? ` ${removedBillCount} linked billing entr${removedBillCount === 1 ? 'y was' : 'ies were'} removed.` : ''}${appointmentSynced ? ' Recall appointment synced.' : ''}${dentalRecallSynced ? ' Dental recall synced.' : ''}${calendarSynced ? ' Calendar recall synced.' : ''}${appointmentRemoved ? ' Linked recall appointment removed.' : ''}${dentalRecallRemoved ? ' Linked dental recall removed.' : ''}${calendarRemoved ? ' Calendar recall removed.' : ''}`
            : 'Progress note updated successfully.'
          : syncedBillCount > 0 || appointmentSynced || dentalRecallSynced || calendarSynced || validServices.length === 0
            ? `Progress note saved successfully.${syncedBillCount > 0 ? ` ${syncedBillCount} billing entr${syncedBillCount === 1 ? 'y' : 'ies'} synced.` : validServices.length === 0 ? ' No billable service rows were synced.' : ''}${appointmentSynced ? ' Recall appointment synced.' : ''}${dentalRecallSynced ? ' Dental recall synced.' : ''}${calendarSynced ? ' Calendar recall synced.' : ''}`
            : 'Progress note saved successfully.';
      showToast?.(successMessage, 'success');
      if (billSyncFailed) {
        showToast?.('Progress note saved, but billing sync failed.', 'info');
      }
      if (appointmentSyncFailed) {
        showToast?.('Progress note saved, but appointment/calendar sync failed.', 'info');
      }
      if (dentalRecallSyncFailed) {
        showToast?.('Progress note saved, but dental recall sync failed.', 'info');
      }

      setFormSnapshot(serializeFormState(noteToForm(nextNote)));
      setIsModalOpen(false);
      setEditingNoteId(null);
    } catch {
      showToast?.('Unable to save the progress note right now. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveProgressNote = async (event: FormEvent<HTMLFormElement> | undefined, status: ProgressNoteStatus) => {
    event?.preventDefault();
    if (isSaving) return;
    await persistProgressNote(status);
  };

  return (
    <section className="progress-notes-module" aria-label="Clinical progress notes">
      <div className="patient-record__card progress-notes-toolbar">
        <div className="progress-notes-toolbar__title">
          <FileText size={18} />
          <strong>Clinical Progress Notes</strong>
        </div>

        <label className="progress-notes-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            placeholder="Search Treatment Plans..."
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
          <button className="progress-notes-button progress-notes-button--primary" type="button" onClick={openNewModal}>
            <Plus size={16} />
            New Progress Note
          </button>
        </div>
      </div>

      <div className="patient-record__card progress-notes-table">
        <div className="progress-notes-table__head" role="row">
          <span>Date</span>
          <span>Progress Note & Clinical Remarks</span>
          <span>Attachments</span>
          <span>Net Treatment Cost</span>
          <span>Status</span>
          <span aria-label="Actions" />
        </div>

        {filteredNotes.length > 0 ? (
          paginatedNotes.map((note) => {
            const netCost = Math.max(getTotalCost(note.services) - note.discount, 0);
            return (
              <article className="progress-notes-table__row" key={note.id}>
                <div>
                  <strong>{formatDate(note.visitDate)}</strong>
                  <span>{formatTime(note.visitTime)}</span>
                </div>
                <div>
                  <strong>{note.title}</strong>
                  <span>{note.notes || 'No notes documented.'}</span>
                </div>
                <div>
                  <span>{note.attachments.length > 0 ? `${note.attachments.length} files` : 'None'}</span>
                </div>
                <div>
                  <strong>{formatCurrency(netCost)}</strong>
                </div>
                <div>
                  <span className={`progress-notes-status progress-notes-status--${note.status.toLowerCase()}`}>
                    {note.status}
                  </span>
                </div>
                <div className="progress-notes-actions">
                  <button
                    className="progress-notes-icon-button"
                    type="button"
                    aria-label={`Open options for ${note.title}`}
                    onClick={() => setActiveMenuId((current) => (current === note.id ? null : note.id))}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenuId === note.id ? (
                    <ProgressNoteOptionsMenu
                      note={note}
                      onEdit={() => openEditModal(note)}
                      onDuplicate={() => handleDuplicate(note)}
                      onPrint={handlePrint}
                      onDelete={() => handleDelete(note)}
                    />
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="progress-notes-empty">
            <FileText size={36} />
            <strong>No progress notes logged yet</strong>
            <p>Click '+ New Progress Note' above to register clinical visits and billing plans.</p>
          </div>
        )}
      </div>

      {filteredNotes.length > 0 ? (
        <footer className="patient-module-pagination">
          <span>
            Showing {(currentPageSafe - 1) * pageSize + 1} to {Math.min(currentPageSafe * pageSize, filteredNotes.length)} of {filteredNotes.length} records
          </span>
          <div className="patient-module-pagination__controls" aria-label="Progress notes pagination">
            <button type="button" disabled={currentPageSafe <= 1} onClick={() => setCurrentPage(currentPageSafe - 1)}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={page === currentPageSafe ? 'is-active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button type="button" disabled={currentPageSafe >= pageCount} onClick={() => setCurrentPage(currentPageSafe + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      ) : null}

        {isModalOpen ? (
          <ProgressNoteModal
            formState={formState}
            editing={Boolean(editingNoteId)}
            clinicalServiceOptions={clinicalServiceOptions}
            recallReasonOptions={recallReasonOptions}
            onFieldChange={updateField}
            onAddService={addServiceRow}
            onServiceChange={updateServiceRow}
            onRemoveService={removeServiceRow}
            onClose={handleCloseModal}
            onSubmit={saveProgressNote}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
          />
        ) : null}
      <ConfirmationDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || 'Confirm action'}
        description={confirmState?.description || ''}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        destructive={confirmState?.destructive}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => {
          const cancel = confirmState?.onCancel;
          if (cancel) {
            cancel();
          } else {
            closeConfirmation();
          }
        }}
      />
    </section>
  );
}

function ProgressNoteOptionsMenu({
  note,
  onEdit,
  onDuplicate,
  onPrint,
  onDelete
}: {
  note: ProgressNote;
  onEdit: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="progress-notes-menu" role="menu">
      <div className="progress-notes-menu__header">
        <strong>Note Options</strong>
        <span>{formatDate(note.visitDate)}</span>
      </div>
      <button type="button" onClick={onEdit}>
        <PencilLine size={16} />
        Edit Note
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

function ProgressNoteModal({
  formState,
  editing,
  clinicalServiceOptions,
  recallReasonOptions,
  onFieldChange,
  onAddService,
  onServiceChange,
  onRemoveService,
  onClose,
  onSubmit,
  hasUnsavedChanges,
  isSaving
}: {
  formState: ProgressNoteFormState;
  editing: boolean;
  clinicalServiceOptions: ClinicalServiceOption[];
  recallReasonOptions: string[];
  onFieldChange: <K extends keyof ProgressNoteFormState>(field: K, value: ProgressNoteFormState[K]) => void;
  onAddService: () => void;
  onServiceChange: <K extends keyof ServiceRow>(id: string, field: K, value: ServiceRow[K]) => void;
  onRemoveService: (id: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement> | undefined, status: ProgressNoteStatus) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}) {
  const totalCost = getTotalCost(formState.services);
  const discount = Number(formState.discount || 0);
  const netCost = Math.max(totalCost - discount, 0);
  const [activeSuggestionRowId, setActiveSuggestionRowId] = useState<string | null>(null);

  const getServiceSuggestions = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return clinicalServiceOptions.slice(0, 6);
    }

    return clinicalServiceOptions.filter((service) =>
      [service.name, service.code, service.description, service.treatmentCategory].join(' ').toLowerCase().includes(trimmed.toLowerCase())
    ).slice(0, 6);
  };

  const handleSelectService = (rowId: string, option: ClinicalServiceOption) => {
    onServiceChange(rowId, 'service', option.name);
    onServiceChange(rowId, 'cost', option.defaultPrice);
    setActiveSuggestionRowId(null);
  };

  return (
    <div className="progress-note-modal-overlay" role="presentation">
      <form className="progress-note-modal" onSubmit={(event) => onSubmit(event, 'Saved')}>
        <header className="progress-note-modal__header">
          <div className="progress-note-modal__header-left">
            <h2>{editing ? 'Edit Clinical Progress Note & Treatment Plan' : 'New Clinical Progress Note & Treatment Plan'}</h2>
            <p>Complete the patient progress notes, treatments, teeth, remarks, and signature.</p>
            {hasUnsavedChanges ? <small className="progress-note-modal__dirty-state">Unsaved changes</small> : null}
          </div>
          <div className="progress-note-modal__header-right" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Cute tooth illustration from the reference mockup */}
            <svg className="modal-header-tooth-illustration" viewBox="0 0 100 100" width="70" height="70" style={{ marginRight: '16px', flexShrink: 0 }}>
              {/* Sparkles */}
              <path d="M15,20 L17,22 L15,24 L13,22 Z" fill="#60a5fa" opacity="0.8" />
              <path d="M85,15 L87,17 L85,19 L83,17 Z" fill="#60a5fa" opacity="0.8" />
              <path d="M88,50 L90,52 L88,54 L86,52 Z" fill="#60a5fa" opacity="0.8" />
              
              {/* Tooth shape */}
              <path 
                d="M45,25 C30,25 25,32 25,45 C25,58 32,68 38,72 C41,74 43,68 45,66 C47,68 49,74 52,72 C58,68 65,58 65,45 C65,32 60,25 45,25 Z" 
                fill="#ffffff" 
                stroke="#1d4ed8" 
                strokeWidth="2.5" 
              />
              <path d="M35,35 C38,32 42,32 45,35" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              
              {/* Clipboard icon */}
              <rect x="58" y="42" width="22" height="28" rx="2" fill="#ffffff" stroke="#475569" strokeWidth="2" />
              <path d="M64,42 L64,39 C64,38 65,37 66,37 L72,37 C73,37 74,38 74,39 L74,42" fill="none" stroke="#475569" strokeWidth="2" />
              <line x1="63" y1="48" x2="75" y2="48" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="63" y1="54" x2="75" y2="54" stroke="#cbd5e1" strokeWidth="2" />
            </svg>
            <button className="progress-note-modal__close-btn" type="button" aria-label="Close progress note modal" onClick={onClose} disabled={isSaving}>
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="progress-note-modal__body">
          {/* Section 1: Visit & Recall Information */}
          <div className="progress-note-section-card">
            <h3 className="section-title-with-badge">
              <span className="section-badge">1</span>
              Visit & Recall Information
            </h3>
            <div className="progress-note-form-grid progress-note-form-grid--three">
              <Field label={<span><User size={12} className="label-icon" /> Patient Name</span>}>
                <input value={formState.patientName} readOnly className="readonly-input" />
              </Field>
              
              <Field label={<span><Calendar size={12} className="label-icon" /> Visit Date</span>}>
                <DatePicker
                  value={formState.visitDate}
                  onChange={(val) => onFieldChange('visitDate', val)}
                />
                <small className="field-formatted-hint">{formatDate(formState.visitDate)} - {formatTime(formState.visitTime)}</small>
              </Field>

              <Field label={<span><Clock size={12} className="label-icon" /> Visit Time</span>}>
                <div className="input-with-icon-wrapper">
                  <input
                    type="time"
                    value={formState.visitTime}
                    onChange={(event) => onFieldChange('visitTime', event.target.value)}
                  />
                </div>
              </Field>

              <Field label={<span><Calendar size={12} className="label-icon" /> Recall Date</span>}>
                <DatePicker
                  value={formState.recallDate}
                  onChange={(val) => onFieldChange('recallDate', val)}
                />
                {formState.recallDate && (
                  <small className="field-formatted-hint">{formatDate(formState.recallDate)} - {formatTime(formState.recallTime || '12:00')}</small>
                )}
              </Field>

              <Field label={<span><FileText size={12} className="label-icon" /> Recall Reason</span>}>
                <select value={formState.recallReason} onChange={(event) => onFieldChange('recallReason', event.target.value)}>
                  <option value="">-- Select --</option>
                  {recallReasonOptions.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </Field>

              <Field label={<span><Clock size={12} className="label-icon" /> Recall Time</span>}>
                <div className="input-with-icon-wrapper">
                  <input
                    type="time"
                    value={formState.recallTime}
                    onChange={(event) => onFieldChange('recallTime', event.target.value)}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Section 2: Service / Treatment Details */}
          <div className="progress-note-section-card">
            <div className="section-header-row">
              <h3 className="section-title-with-badge">
                <span className="section-badge">2</span>
                Service / Treatment Details
              </h3>
              <button className="add-service-row-btn" type="button" onClick={onAddService}>
                <Plus size={14} />
                Add Service Row
              </button>
            </div>

            <div className="service-details-layout">
              {/* Left Column: Service Rows */}
              <div className="service-rows-container">
                {formState.services.length > 0 ? (
                  <div className="service-rows-list">
                    <div className="service-rows-header">
                      <span>Service / Procedure</span>
                      <span>Tooth No./s</span>
                      <span>Cost</span>
                      <span style={{ width: '36px' }}></span>
                    </div>
                    {formState.services.map((service) => (
                      <div className="service-row-item" key={service.id}>
                        <div className="service-procedure-field">
                          <input
                            value={service.service}
                            placeholder="Enter treatment / procedure"
                            onFocus={() => setActiveSuggestionRowId(service.id)}
                            onBlur={() => window.setTimeout(() => setActiveSuggestionRowId((current) => (current === service.id ? null : current)), 120)}
                            onChange={(event) => {
                              onServiceChange(service.id, 'service', event.target.value);
                              setActiveSuggestionRowId(service.id);
                            }}
                          />
                          {activeSuggestionRowId === service.id ? (
                            <div className="service-procedure-suggestions" role="listbox" aria-label="Clinical service suggestions">
                              {getServiceSuggestions(service.service).length > 0 ? (
                                getServiceSuggestions(service.service).map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className="service-procedure-suggestion"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      handleSelectService(service.id, option);
                                    }}
                                  >
                                    <div className="service-procedure-suggestion__main">
                                      <strong>{option.name}</strong>
                                      {option.description ? <span>{option.description}</span> : null}
                                      <small>{formatCurrency(option.defaultPrice)}</small>
                                    </div>
                                    <span className="service-procedure-suggestion__code">{option.code}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="service-procedure-suggestions__empty">
                                  No matching clinical services.
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                        <input
                          value={service.tooth}
                          placeholder="e.g. 46"
                          onChange={(event) => onServiceChange(service.id, 'tooth', event.target.value)}
                        />
                        <div className="cost-input-wrapper">
                          <span className="cost-currency-symbol">₱</span>
                          <input
                            type="number"
                            min="0"
                            value={service.cost || ''}
                            placeholder="0.00"
                            onChange={(event) => onServiceChange(service.id, 'cost', Number(event.target.value))}
                          />
                        </div>
                        <button className="service-row-delete-btn" type="button" aria-label="Remove service" onClick={() => onRemoveService(service.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="service-rows-empty-state">
                    No services added yet. Click '+ Add Service Row' to append treatments.
                  </div>
                )}
              </div>

              {/* Right Column: Accumulation summary */}
              <div className="service-summary-card">
                <div className="summary-item">
                  <span className="summary-label">Total Cost</span>
                  <span className="summary-value">{formatCurrency(totalCost)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Discount Amount</span>
                  <div className="summary-input-box-wrapper">
                    <span className="summary-currency-prefix">₱</span>
                    <input
                      type="number"
                      min="0"
                      value={formState.discount}
                      onChange={(event) => onFieldChange('discount', event.target.value)}
                    />
                  </div>
                </div>
                <div className="summary-item summary-item--net">
                  <span className="summary-label">Net Cost</span>
                  <span className="summary-value">{formatCurrency(netCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row for Section 3 & 4 (side by side) */}
          <div className="sections-side-by-side-row">
            {/* Section 3: Remarks Notes */}
            <div className="progress-note-section-card">
              <h3 className="section-title-with-badge">
                <span className="section-badge">3</span>
                Remarks Notes (Type '/' for Templates)
              </h3>
              <textarea
                className="remarks-textarea"
                value={formState.notes}
                placeholder="Type any detailed clinical comments, surgical reactions, or general treatment observations..."
                onChange={(event) => onFieldChange('notes', event.target.value)}
              />
            </div>

            {/* Section 4: Upload Clinical Attachments */}
            <div className="progress-note-section-card">
              <h3 className="section-title-with-badge">
                <span className="section-badge">4</span>
                Upload Clinical Attachments
              </h3>
              <div className="clinical-upload-dropzone">
                <Upload size={24} className="upload-icon" />
                <strong>Drag & drop files here, or click to browse</strong>
                <span>Supports JPG, PNG, PDF, DOC (Max 15MB)</span>
              </div>
            </div>
          </div>

          {/* Section 5: Signature */}
          <div className="progress-note-section-card">
            <h3 className="section-title-with-badge">
              <span className="section-badge">5</span>
              Patient or Legal Guardian Signature
            </h3>
            
            <div className="signature-section-row">
              {/* Write/Draw Signature */}
              <div className="signature-pad-box">
                <div className="signature-placeholder-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Write / Draw Signature</span>
                  <button type="button" className="signature-clear-link">Clear</button>
                </div>
              </div>

              {/* OR divider */}
              <div className="signature-or-divider">
                <span className="divider-line"></span>
                <span className="divider-text">or</span>
                <span className="divider-line"></span>
              </div>

              {/* Upload image */}
              <button type="button" className="browse-signature-image-btn">
                <Upload size={14} style={{ marginRight: '6px' }} />
                Browse Signature Image
              </button>

              {/* Date Signed */}
              <div className="date-signed-field-container">
                <Field label={<span><Calendar size={12} className="label-icon" /> Date Signed (Optional)</span>}>
                  <DatePicker
                    value={formState.dateSigned || ''}
                    onChange={(val) => onFieldChange('dateSigned', val)}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <footer className="progress-note-modal__footer">
          <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="progress-notes-button progress-notes-button--ghost progress-notes-button--draft" type="button" onClick={() => onSubmit(undefined, 'Draft')} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button className="progress-notes-button progress-notes-button--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Progress Note'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="progress-note-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
