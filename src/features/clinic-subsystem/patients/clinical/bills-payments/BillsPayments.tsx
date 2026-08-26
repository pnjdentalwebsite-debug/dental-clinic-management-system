import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  AlertCircle,
  Copy,
  CreditCard,
  Download,
  Image as ImageIcon,
  MoreVertical,
  PencilLine,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Wallet
} from 'lucide-react';
import { DatePicker } from '../../../../../components/overlays/DatePicker';
import { Modal } from '../../../../../components/overlays/Modal';
import { ConfirmationDialog } from '../../../../../components/overlays/ConfirmationDialog';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { loadProgressNotes } from '../progress-notes/progressNoteStore';
import {
  BILL_PAYMENTS_UPDATED_EVENT,
  createBillServiceLine,
  deriveBillStatus,
  formatBillCurrency,
  formatCompactBillCurrency,
  getBillPaymentsStorageKey,
  loadBillPaymentRecords,
  saveBillPaymentRecords,
  type BillPaymentEntry,
  type BillPaymentProof,
  type BillPaymentRecord,
  type BillPaymentServiceLine
} from './billPaymentStore';

type BillModalMode = 'create' | 'edit' | 'pay' | 'proof';

interface BillDraft {
  entryDate: string;
  invoiceNumber: string;
  description: string;
  associate: string;
  billRemarks: string;
  billDiscount: string;
  services: BillPaymentServiceLine[];
}

interface PaymentDraft {
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  remarks: string;
  receivedBy: string;
  amount: string;
  proof: BillPaymentProof | null;
}

interface BillConfirmationState {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const PAYMENT_METHOD_OPTIONS = ['Cash', 'GCash', 'Online', 'BPI', 'BDO'];
const PAGE_SIZE = 5;

export function BillsPayments({ patient }: { patient: PatientPreviewItem }) {
  const storageKey = getBillPaymentsStorageKey(patient.id);
  const [records, setRecords] = useState<BillPaymentRecord[]>(() => loadBillPaymentRecords(patient));
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState<BillModalMode | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [billDraft, setBillDraft] = useState<BillDraft>(() => createBillDraft(patient));
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(() => createPaymentDraft(patient));
  const [previewProof, setPreviewProof] = useState<BillPaymentProof | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<{
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
  } | null>(null);
  const [confirmState, setConfirmState] = useState<BillConfirmationState | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setRecords(loadBillPaymentRecords(patient));
    };

    handleSync();
    window.addEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [patient]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const linkedProgressNotes = useMemo(() => loadProgressNotes(patient), [patient]);
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [
        record.invoiceNumber,
        record.description,
        record.paymentMethod,
        record.patientName,
        record.associate,
        record.billRemarks,
        record.statusLabel
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [records, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const paginatedRecords = filteredRecords.slice(
    (currentPageSafe - 1) * PAGE_SIZE,
    currentPageSafe * PAGE_SIZE
  );

  const activeRecord = activeRecordId
    ? records.find((record) => record.id === activeRecordId) || null
    : null;
  const displayServices = useMemo(
    () => (activeRecord ? resolveDisplayServices(activeRecord, records, linkedProgressNotes) : []),
    [activeRecord, records, linkedProgressNotes]
  );

  const draftTotals = useMemo(() => calculateBillTotals(billDraft.services, billDraft.billDiscount), [billDraft]);
  const savedPaidAmount = activeRecord?.paidAmount || 0;
  const livePaymentAmount = Math.max(Number(paymentDraft.amount || 0), 0);
  const remainingBalanceBeforePayment = activeRecord
    ? activeRecord.balanceAmount
    : draftTotals.payableAmount;
  const projectedPaidAmount =
    modalMode === 'pay' ? savedPaidAmount + livePaymentAmount : savedPaidAmount;
  const projectedBalance = Math.max(remainingBalanceBeforePayment - livePaymentAmount, 0);
  const projectedChange = Math.max(livePaymentAmount - remainingBalanceBeforePayment, 0);

  const handleRefresh = () => {
    setSearch('');
    setCurrentPage(1);
    setRecords(loadBillPaymentRecords(patient));
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRecordId(null);
    setPreviewProof(null);
    setBillDraft(createBillDraft(patient));
    setPaymentDraft(createPaymentDraft(patient));
    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
  };

  const openCreateModal = () => {
    setActiveRecordId(null);
    setBillDraft(createBillDraft(patient));
    setPaymentDraft(createPaymentDraft(patient));
    setModalMode('create');
    setActiveMenuId(null);
  };

  const openEditModal = (record: BillPaymentRecord) => {
    setActiveRecordId(record.id);
    setBillDraft(recordToDraft(record));
    setPaymentDraft(createPaymentDraft(patient, record));
    setModalMode('edit');
    setActiveMenuId(null);
  };

  const openPayModal = (record: BillPaymentRecord) => {
    setActiveRecordId(record.id);
    setBillDraft(recordToDraft(record, resolveDisplayServices(record, records, linkedProgressNotes)));
    setPaymentDraft(createPaymentDraft(patient, record));
    setModalMode('pay');
    setActiveMenuId(null);
  };

  const handleDuplicate = (record: BillPaymentRecord) => {
    const duplicated = normalizeRecordForSave({
      ...record,
      id: `BILL-${Date.now()}`,
      invoiceNumber: `${record.invoiceNumber}-COPY`,
      paymentMethod: 'Pending collection',
      paidAmount: 0,
      payments: []
    });

    setRecords((current) => [duplicated, ...current]);
    setActiveMenuId(null);
  };

  const handleDelete = (recordId: string) => {
    setConfirmState({
      title: 'Delete Billing Record',
      description: 'This billing record will be removed from Bills & Payments. This action cannot be undone.',
      confirmLabel: 'Delete Record',
      cancelLabel: 'Keep Record',
      destructive: true,
      onCancel: () => {
        setActiveMenuId(null);
        setAlertFeedback({
          title: 'Deletion Cancelled',
          message: 'The billing record was kept unchanged.',
          type: 'info'
        });
      },
      onConfirm: () => {
        const nextRecords = records.filter((record) => record.id !== recordId);
        setRecords(nextRecords);
        saveBillPaymentRecords(patient.id, nextRecords, patient.clinicId);
        setActiveMenuId(null);
        setConfirmState(null);
        setAlertFeedback({
          title: 'Billing Record Deleted',
          message: 'The selected billing record has been removed.',
          type: 'success'
        });
      }
    });
  };

  const handleExport = () => {
    const header = ['Date', 'Invoice', 'Billing Details', 'Summary', 'Status'];
    const rows = records.map((record) =>
      [
        formatDate(record.entryDate),
        record.invoiceNumber,
        record.description.replace(/"/g, '""'),
        `Payable ${formatBillCurrency(record.payableAmount)} | Paid ${formatBillCurrency(record.paidAmount)} | Balance ${formatBillCurrency(record.balanceAmount)}`,
        record.statusLabel
      ]
        .map((value) => `"${value}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${patient.id}-bills-payments.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateBillDraft = <K extends keyof BillDraft>(field: K, value: BillDraft[K]) => {
    setBillDraft((current) => ({ ...current, [field]: value }));
  };

  const updatePaymentDraft = <K extends keyof PaymentDraft>(field: K, value: PaymentDraft[K]) => {
    setPaymentDraft((current) => ({ ...current, [field]: value }));
  };

  const addServiceRow = () => {
    updateBillDraft('services', [...billDraft.services, createBillServiceLine()]);
  };

  const updateServiceRow = <K extends keyof BillPaymentServiceLine>(
    id: string,
    field: K,
    value: BillPaymentServiceLine[K]
  ) => {
    updateBillDraft(
      'services',
      billDraft.services.map((service) => {
        if (service.id !== id) return service;

        const nextService = { ...service, [field]: value };
        const quantity = Math.max(Number(nextService.quantity || 1), 1);
        const baseAmount = Math.max(Number(nextService.baseAmount || 0), 0);
        const discount = Math.max(Number(nextService.discount || 0), 0);

        return {
          ...nextService,
          quantity,
          baseAmount,
          discount,
          lineTotal: Math.max(quantity * baseAmount - discount, 0)
        };
      })
    );
  };

  const removeServiceRow = (id: string) => {
    updateBillDraft(
      'services',
      billDraft.services.length > 1
        ? billDraft.services.filter((service) => service.id !== id)
        : billDraft.services
    );
  };

  const handleProofUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      updatePaymentDraft('proof', null);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    updatePaymentDraft('proof', {
      fileName: file.name,
      dataUrl
    });
  };

  const handleSaveBill = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const services = billDraft.services
      .map((service) => createBillServiceLine(service))
      .filter((service) => service.service.trim());

    if (services.length === 0) {
      setAlertFeedback({
        title: 'Missing Service',
        message: 'Add at least one service or procedure before saving the bill.',
        type: 'error'
      });
      return;
    }

    const summary = calculateBillTotals(services, billDraft.billDiscount);
    const existingPayments =
      activeRecord && modalMode === 'edit' ? activeRecord.payments : [];
    const paidAmount = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentMethod =
      activeRecord?.paymentMethod && activeRecord.paymentMethod !== 'Pending collection'
        ? activeRecord.paymentMethod
        : paidAmount > 0
          ? existingPayments[existingPayments.length - 1]?.paymentMethod || 'Cash'
          : 'Pending collection';

    const nextRecord = normalizeRecordForSave({
      id: activeRecord?.id || `BILL-${Date.now()}`,
      entryDate: billDraft.entryDate,
      invoiceNumber: billDraft.invoiceNumber.trim() || `INV-${Date.now()}`,
      description:
        billDraft.description.trim() || services.map((service) => service.service).join(', '),
      paymentMethod,
      balance: formatCompactBillCurrency(Math.max(summary.payableAmount - paidAmount, 0)),
      source: activeRecord?.source || 'manual',
      sourceId: activeRecord?.sourceId,
      sourceRowId: activeRecord?.sourceRowId,
      patientName: patient.name,
      toothReference: services.map((service) => service.tooth).filter(Boolean).join(', '),
      associate: billDraft.associate.trim(),
      billRemarks: billDraft.billRemarks.trim(),
      totalCost: summary.totalCost,
      billDiscount: summary.billDiscount,
      payableAmount: summary.payableAmount,
      paidAmount,
      balanceAmount: Math.max(summary.payableAmount - paidAmount, 0),
      services,
      payments: existingPayments,
      ...deriveBillStatus(summary.payableAmount, paidAmount)
    });

    const nextRecords = activeRecord
      ? records.map((record) => (record.id === activeRecord.id ? nextRecord : record))
      : [nextRecord, ...records];

    setRecords(nextRecords);
    saveBillPaymentRecords(patient.id, nextRecords, patient.clinicId);
    closeModal();
    setAlertFeedback({
      title: 'Bill Saved',
      message: activeRecord ? 'Billing record updated successfully.' : 'Billing record created successfully.',
      type: 'success'
    });
  };

  const handleSavePayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeRecord) return;

    if (activeRecord.balanceAmount <= 0) {
      setAlertFeedback({
        title: 'Already Paid',
        message: 'This bill has already been fully paid.',
        type: 'info'
      });
      return;
    }

    const paymentAmount = Math.max(Number(paymentDraft.amount || 0), 0);
    if (paymentAmount <= 0) {
      setAlertFeedback({
        title: 'Invalid Payment',
        message: 'Please enter a valid payment amount greater than ₱0.00.',
        type: 'error'
      });
      return;
    }

    const changeAmount = Math.max(paymentAmount - activeRecord.balanceAmount, 0);

    const nextPayment: BillPaymentEntry = {
      id: `PAY-${Date.now()}`,
      paymentDate: paymentDraft.paymentDate,
      paymentMethod: paymentDraft.paymentMethod,
      referenceNumber: paymentDraft.referenceNumber.trim(),
      remarks: paymentDraft.remarks.trim(),
      receivedBy: paymentDraft.receivedBy.trim(),
      amount: paymentAmount,
      proof: paymentDraft.proof
    };

    const nextPayments = [...activeRecord.payments, nextPayment];
    const nextPaidAmount = nextPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const nextBalanceAmount = Math.max(activeRecord.payableAmount - nextPaidAmount, 0);

    const nextRecord = normalizeRecordForSave({
      ...activeRecord,
      paymentMethod: paymentDraft.paymentMethod,
      paidAmount: nextPaidAmount,
      balanceAmount: nextBalanceAmount,
      payments: nextPayments,
      balance: formatCompactBillCurrency(nextBalanceAmount),
      ...deriveBillStatus(activeRecord.payableAmount, nextPaidAmount)
    });

    const nextRecords = records.map((record) => (record.id === activeRecord.id ? nextRecord : record));
    setRecords(nextRecords);
    saveBillPaymentRecords(patient.id, nextRecords, patient.clinicId);
    closeModal();
    setAlertFeedback({
      title: 'Payment Recorded',
      message: changeAmount > 0
        ? `Payment of ${formatBillCurrency(paymentAmount)} recorded successfully. Change: ${formatBillCurrency(changeAmount)}.`
        : 'Bill payment recorded successfully.',
      type: 'success'
    });
  };

  return (
    <section className="progress-notes-module patient-module-workspace" aria-label="Bills and payments">
      <div className="patient-record__card progress-notes-toolbar">
        <div className="progress-notes-toolbar__title">
          <Wallet size={18} />
          <strong>Bills & Payments</strong>
        </div>

        <label className="progress-notes-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            placeholder="Search invoice, payment method, billing notes..."
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </label>

        <div className="progress-notes-toolbar__actions">
          <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="progress-notes-button progress-notes-button--ghost" type="button" onClick={handleExport}>
            <Download size={16} />
            Export Report
          </button>
          <button className="progress-notes-button progress-notes-button--primary" type="button" onClick={openCreateModal}>
            <Plus size={16} />
            New Billing Entry
          </button>
        </div>
      </div>

      <div className="patient-record__card progress-notes-table patient-module-table bills-payments-table">
        <div
          className="progress-notes-table__head patient-module-table__head"
          role="row"
          style={{ gridTemplateColumns: 'minmax(170px, 1fr) minmax(260px, 1.8fr) minmax(210px, 1.2fr) minmax(180px, 1fr) minmax(120px, 0.8fr) minmax(52px, 52px)' }}
        >
          <span>Date</span>
          <span>Billing Details</span>
          <span>Services & Procedures</span>
          <span>Billing Summary</span>
          <span>Status</span>
          <span aria-label="Actions" />
        </div>

        {filteredRecords.length > 0 ? (
          paginatedRecords.map((record) => (
            <article
              className="progress-notes-table__row patient-module-table__row"
              key={record.id}
              style={{ gridTemplateColumns: 'minmax(170px, 1fr) minmax(260px, 1.8fr) minmax(210px, 1.2fr) minmax(180px, 1fr) minmax(120px, 0.8fr) minmax(52px, 52px)' }}
            >
              <div className="patient-module-table__cell">
                <strong>{formatDate(record.entryDate)}</strong>
                <span>{record.invoiceNumber}</span>
              </div>

              <div className="patient-module-table__cell">
                <strong>{record.description}</strong>
                <span>{record.associate || record.billRemarks || 'No billing notes yet'}</span>
              </div>

              <div className="patient-module-table__cell">
                <strong>{record.services[0]?.service || 'No service captured'}</strong>
                <span className="patient-module-truncate" title={record.services.map((service) => service.service).join(', ')}>
                  {record.services.length > 1
                    ? `${record.services.length} linked services`
                    : buildServiceMeta(record.services[0])}
                </span>
              </div>

              <div className="patient-module-table__cell">
                <strong>{formatBillCurrency(record.payableAmount)}</strong>
                <span>
                  Paid {formatBillCurrency(record.paidAmount)} | Balance {formatBillCurrency(record.balanceAmount)}
                </span>
              </div>

              <div className="patient-module-table__cell">
                <span className={`patient-module-status patient-module-status--${record.statusTone}`}>
                  {record.statusLabel}
                </span>
              </div>

              <div className="progress-notes-actions">
                <button
                  className="progress-notes-icon-button"
                  type="button"
                  aria-label="Open options for Bills & Payments"
                  onClick={() => setActiveMenuId((current) => (current === record.id ? null : record.id))}
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenuId === record.id ? (
                  <div className="progress-notes-menu" role="menu">
                    <div className="progress-notes-menu__header">
                      <strong>Record Options</strong>
                      <span>{record.invoiceNumber}</span>
                    </div>
                    {record.statusLabel !== 'Paid' ? (
                      <button type="button" onClick={() => openPayModal(record)}>
                        <CreditCard size={16} />
                        Pay Bill
                      </button>
                    ) : null}
                    <button type="button" onClick={() => openEditModal(record)}>
                      <PencilLine size={16} />
                      Edit Record
                    </button>
                    <button type="button" onClick={() => handleDuplicate(record)}>
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setActiveMenuId(null);
                      }}
                    >
                      <Printer size={16} />
                      Print
                    </button>
                    <button className="progress-notes-menu__danger" type="button" onClick={() => handleDelete(record.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="progress-notes-empty">
            <Wallet size={36} />
            <strong>No billing entries yet</strong>
            <p>Log treatment balances, settled invoices, and payment references for this patient.</p>
          </div>
        )}
      </div>

      {filteredRecords.length > 0 ? (
        <footer className="patient-module-pagination">
          <span>
            Showing {(currentPageSafe - 1) * PAGE_SIZE + 1} to {Math.min(currentPageSafe * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="patient-module-pagination__controls" aria-label="Billing pagination">
            <button type="button" disabled={currentPageSafe <= 1} onClick={() => setCurrentPage(currentPageSafe - 1)}>
              {'<'}
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
              {'>'}
            </button>
          </div>
        </footer>
      ) : null}

      {modalMode === 'create' || modalMode === 'edit' ? (
        <Modal
          open={true}
          title={modalMode === 'create' ? 'New Billing Entry' : 'Update Bill'}
          description="Track patient charges, linked services, discounts, and collection details in one billing workspace."
          width="xl"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="progress-notes-button progress-notes-button--ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" form="bill-record-form" className="progress-notes-button progress-notes-button--primary">
                Save Bill
              </button>
            </>
          }
        >
          <form id="bill-record-form" className="bill-modal-shell" onSubmit={handleSaveBill}>
            <section className="bill-modal-top-grid">
              <label className="progress-note-field">
                <span>Patient</span>
                <input value={patient.name} readOnly />
              </label>
              <label className="progress-note-field">
                <span>Associate</span>
                <input
                  value={billDraft.associate}
                  onChange={(event) => updateBillDraft('associate', event.target.value)}
                  placeholder="Assigned dentist or staff"
                />
              </label>
              <label className="progress-note-field">
                <span>Bill Date</span>
                <DatePicker
                  value={billDraft.entryDate}
                  onChange={(value) => updateBillDraft('entryDate', value)}
                />
              </label>
              <label className="progress-note-field">
                <span>Invoice / OR Number</span>
                <input
                  value={billDraft.invoiceNumber}
                  onChange={(event) => updateBillDraft('invoiceNumber', event.target.value)}
                  placeholder="e.g. PN-629819-1"
                />
              </label>
            </section>

            <section className="bill-modal-card">
              <div className="bill-modal-card__header">
                <div className="bill-modal-card__title">
                  <ReceiptText size={18} />
                  <strong>Services & Procedures</strong>
                </div>
                <button type="button" className="progress-notes-button progress-notes-button--ghost" onClick={addServiceRow}>
                  <Plus size={15} />
                  Add service
                </button>
              </div>

              <div className="bill-services-list">
                <div className="bill-services-head">
                  <span>Service / Procedure</span>
                  <span>Remarks / Detail</span>
                  <span>Qty</span>
                  <span>Base Amount</span>
                  <span>Discount</span>
                  <span>Line Total</span>
                  <span />
                </div>

                {billDraft.services.map((service) => (
                  <div className="bill-services-row" key={service.id}>
                    <input
                      value={service.service}
                      onChange={(event) => updateServiceRow(service.id, 'service', event.target.value)}
                      placeholder="Service / procedure"
                    />
                    <input
                      value={service.remarks}
                      onChange={(event) => updateServiceRow(service.id, 'remarks', event.target.value)}
                      placeholder="Remarks / detail"
                    />
                    <input
                      type="number"
                      min="1"
                      value={service.quantity}
                      onChange={(event) => updateServiceRow(service.id, 'quantity', Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.baseAmount}
                      onChange={(event) => updateServiceRow(service.id, 'baseAmount', Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.discount}
                      onChange={(event) => updateServiceRow(service.id, 'discount', Number(event.target.value))}
                    />
                    <strong>{formatBillCurrency(service.lineTotal)}</strong>
                    <button
                      type="button"
                      className="bill-services-row__delete"
                      onClick={() => removeServiceRow(service.id)}
                      disabled={billDraft.services.length <= 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bill-modal-bottom-grid">
              <label className="progress-note-field">
                <span>Bill Remarks</span>
                <textarea
                  rows={5}
                  value={billDraft.billRemarks}
                  onChange={(event) => updateBillDraft('billRemarks', event.target.value)}
                  placeholder="Progress note, notes for collection, billing references..."
                />
              </label>

              <div className="bill-summary-card">
                <div className="bill-summary-card__header">
                  <ReceiptText size={16} />
                  <strong>Billing Summary</strong>
                </div>
                <dl>
                  <div>
                    <dt>Total cost</dt>
                    <dd>{formatBillCurrency(draftTotals.totalCost)}</dd>
                  </div>
                  <div>
                    <dt>Bill discount</dt>
                    <dd>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={billDraft.billDiscount}
                        onChange={(event) => updateBillDraft('billDiscount', event.target.value)}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Payable</dt>
                    <dd>{formatBillCurrency(draftTotals.payableAmount)}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{formatBillCurrency(activeRecord?.paidAmount || 0)}</dd>
                  </div>
                  <div className="is-total">
                    <dt>Balance</dt>
                    <dd>{formatBillCurrency(Math.max(draftTotals.payableAmount - (activeRecord?.paidAmount || 0), 0))}</dd>
                  </div>
                </dl>
              </div>
            </section>
          </form>
        </Modal>
      ) : null}

      {modalMode === 'pay' && activeRecord ? (
        <Modal
          open={true}
          title="Pay Bill"
          description="Record payment method, reference details, proof of payment, and live billing calculations for this unpaid bill."
          width="xl"
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="progress-notes-button progress-notes-button--ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" form="bill-payment-form" className="progress-notes-button progress-notes-button--primary">
                Save Payment
              </button>
            </>
          }
        >
          <form id="bill-payment-form" className="bill-modal-shell bill-modal-shell--pay" onSubmit={handleSavePayment}>
            <section className="bill-modal-top-grid">
              <label className="progress-note-field">
                <span>Patient</span>
                <input value={patient.name} readOnly />
              </label>
              <label className="progress-note-field">
                <span>Associate</span>
                <input value={activeRecord.associate || 'No associate yet'} readOnly />
              </label>
              <label className="progress-note-field">
                <span>Bill Date</span>
                <input value={formatDate(activeRecord.entryDate)} readOnly />
              </label>
              <label className="progress-note-field">
                <span>Invoice / OR Number</span>
                <input value={activeRecord.invoiceNumber} readOnly />
              </label>
            </section>

            <section className="bill-modal-card">
              <div className="bill-modal-card__header">
                <div className="bill-modal-card__title">
                  <ReceiptText size={18} />
                  <strong>Services & Procedures</strong>
                </div>
                <span className="bill-modal-card__meta">Linked from current progress note</span>
              </div>

              <div className="bill-services-list bill-services-list--readonly">
                <div className="bill-services-head">
                  <span>Service / Procedure</span>
                  <span>Remarks / Detail</span>
                  <span>Qty</span>
                  <span>Base Amount</span>
                  <span>Discount</span>
                  <span>Line Total</span>
                </div>

                {displayServices.map((service) => (
                  <div className="bill-services-row bill-services-row--readonly" key={service.id}>
                    <div>
                      <strong>{service.service}</strong>
                      <span>{buildServiceMeta(service)}</span>
                    </div>
                    <span>{service.remarks || activeRecord.billRemarks || 'No extra detail'}</span>
                    <span>{service.quantity}</span>
                    <span>{formatBillCurrency(service.baseAmount)}</span>
                    <span>{formatBillCurrency(service.discount)}</span>
                    <strong>{formatBillCurrency(service.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="bill-modal-pay-grid">
              <div className="bill-payment-panel">
                <div className="bill-payment-panel__section">
                  <div className="bill-modal-card__title">
                    <CreditCard size={18} />
                    <strong>Pay Bill</strong>
                  </div>
                  <div className="bill-payment-form-grid">
                    <label className="progress-note-field">
                      <span>Payment Date</span>
                      <DatePicker
                        value={paymentDraft.paymentDate}
                        onChange={(value) => updatePaymentDraft('paymentDate', value)}
                      />
                    </label>
                    <label className="progress-note-field">
                      <span>Payment Method</span>
                      <select
                        value={paymentDraft.paymentMethod}
                        onChange={(event) => updatePaymentDraft('paymentMethod', event.target.value)}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="progress-note-field">
                      <span>Reference Number</span>
                      <input
                        value={paymentDraft.referenceNumber}
                        onChange={(event) => updatePaymentDraft('referenceNumber', event.target.value)}
                        placeholder="GCash ref, bank ref, OR number"
                      />
                    </label>
                    <label className="progress-note-field">
                      <span>Received By</span>
                      <input
                        value={paymentDraft.receivedBy}
                        onChange={(event) => updatePaymentDraft('receivedBy', event.target.value)}
                        placeholder="Dentist / staff"
                      />
                    </label>
                    <label className="progress-note-field progress-note-field--span">
                      <span>Remarks</span>
                      <textarea
                        rows={3}
                        value={paymentDraft.remarks}
                        onChange={(event) => updatePaymentDraft('remarks', event.target.value)}
                        placeholder="Payment note, online transfer note, billing remarks..."
                      />
                    </label>
                    <label className="progress-note-field">
                      <span>Amount</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentDraft.amount}
                        onChange={(event) => updatePaymentDraft('amount', event.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                    <div className="progress-note-field progress-note-field--span">
                      <span>Upload Proof Image</span>
                      <label className="bill-proof-upload">
                        <input
                          ref={proofInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                        />
                        <div className="bill-proof-upload__surface">
                          <div className="bill-proof-upload__lead">
                            <UploadCloud size={18} />
                            <div>
                              <strong>Upload original reference image</strong>
                              <small>Attach GCash, BPI, BDO, or online payment proof for billing reference.</small>
                            </div>
                          </div>
                          <span className="bill-proof-upload__cta">Browse Image</span>
                        </div>
                      </label>
                      {paymentDraft.proof ? (
                        <div className="bill-proof-upload__preview">
                          <button type="button" onClick={() => { setPreviewProof(paymentDraft.proof); setModalMode('proof'); }}>
                            <ImageIcon size={16} />
                            View Proof
                          </button>
                          <span title={paymentDraft.proof.fileName}>{paymentDraft.proof.fileName}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="bill-payment-panel__section">
                  <div className="bill-modal-card__title">
                    <ReceiptText size={18} />
                    <strong>Payment History</strong>
                  </div>
                  <div className="bill-payment-history">
                    <div className="bill-payment-history__head">
                      <span>Payment Date</span>
                      <span>Method</span>
                      <span>Ref Number</span>
                      <span>Remarks</span>
                      <span>Received By</span>
                      <span>Amount</span>
                      <span>Proof</span>
                    </div>
                    {activeRecord.payments.length > 0 ? (
                      activeRecord.payments.map((payment) => (
                        <div className="bill-payment-history__row" key={payment.id}>
                          <span>{formatDate(payment.paymentDate)}</span>
                          <span>{payment.paymentMethod}</span>
                          <span className="patient-module-truncate" title={payment.referenceNumber || 'No reference'}>{payment.referenceNumber || '-'}</span>
                          <span className="patient-module-truncate" title={payment.remarks || 'No remarks'}>{payment.remarks || '-'}</span>
                          <span>{payment.receivedBy || '-'}</span>
                          <strong>{formatBillCurrency(payment.amount)}</strong>
                          <span>
                            {payment.proof ? (
                              <button
                                type="button"
                                className="bill-proof-chip"
                                onClick={() => {
                                  setPreviewProof(payment.proof || null);
                                  setModalMode('proof');
                                }}
                              >
                                View proof
                              </button>
                            ) : (
                              '-'
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bill-payment-history__empty">No payments recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <aside className="bill-summary-card bill-summary-card--sticky">
                <div className="bill-summary-card__header">
                  <ReceiptText size={16} />
                  <strong>Billing Summary</strong>
                </div>
                <dl>
                  <div>
                    <dt>Total cost</dt>
                    <dd>{formatBillCurrency(draftTotals.totalCost)}</dd>
                  </div>
                  <div>
                    <dt>Bill discount</dt>
                    <dd>{formatBillCurrency(draftTotals.billDiscount)}</dd>
                  </div>
                  <div>
                    <dt>Payable</dt>
                    <dd>{formatBillCurrency(draftTotals.payableAmount)}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{formatBillCurrency(projectedPaidAmount)}</dd>
                  </div>
                  <div className="is-total">
                    <dt>Balance</dt>
                    <dd>{formatBillCurrency(projectedBalance)}</dd>
                  </div>
                  {projectedChange > 0 ? (
                    <div className="is-change">
                      <dt>Change</dt>
                      <dd>{formatBillCurrency(projectedChange)}</dd>
                    </div>
                  ) : null}
                </dl>
              </aside>
            </section>
          </form>
        </Modal>
      ) : null}

      {modalMode === 'proof' && previewProof ? (
        <Modal
          open={true}
          title="Payment Proof"
          description={previewProof.fileName}
          width="lg"
          onClose={() => {
            setPreviewProof(null);
            setModalMode(activeRecord ? 'pay' : null);
          }}
          footer={
            <button
              type="button"
              className="progress-notes-button progress-notes-button--ghost"
              onClick={() => {
                setPreviewProof(null);
                setModalMode(activeRecord ? 'pay' : null);
              }}
            >
              Close
            </button>
          }
        >
          <div className="bill-proof-modal">
            <img src={previewProof.dataUrl} alt={previewProof.fileName} />
          </div>
        </Modal>
      ) : null}

      {alertFeedback ? (
        <Modal
          open={true}
          title={alertFeedback.title}
          width="sm"
          onClose={() => setAlertFeedback(null)}
          footer={
            <button
              type="button"
              className="progress-notes-button progress-notes-button--primary"
              onClick={() => setAlertFeedback(null)}
            >
              OK
            </button>
          }
        >
          <div className={`bill-feedback-alert bill-feedback-alert--${alertFeedback.type}`}>
            <AlertCircle size={22} />
            <p>{alertFeedback.message}</p>
          </div>
        </Modal>
      ) : null}

      {confirmState ? (
        <ConfirmationDialog
          open={true}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          destructive={confirmState.destructive}
          onCancel={() => {
            confirmState.onCancel?.();
            setConfirmState(null);
          }}
          onConfirm={confirmState.onConfirm}
        />
      ) : null}
    </section>
  );
}

function createBillDraft(_patient: PatientPreviewItem): BillDraft {
  return {
    entryDate: '2026-08-10',
    invoiceNumber: '',
    description: '',
    associate: '',
    billRemarks: '',
    billDiscount: '0',
    services: [createBillServiceLine()]
  };
}

function createPaymentDraft(patient: PatientPreviewItem, record?: BillPaymentRecord): PaymentDraft {
  return {
    paymentDate: '2026-08-10',
    paymentMethod: record?.paymentMethod && record.paymentMethod !== 'Pending collection'
      ? record.paymentMethod
      : 'Cash',
    referenceNumber: '',
    remarks: '',
    receivedBy: record?.associate || patient.name,
    amount: record ? String(record.balanceAmount || '') : '',
    proof: null
  };
}

function recordToDraft(record: BillPaymentRecord, servicesOverride?: BillPaymentServiceLine[]): BillDraft {
  return {
    entryDate: record.entryDate,
    invoiceNumber: record.invoiceNumber,
    description: record.description,
    associate: record.associate || '',
    billRemarks: record.billRemarks || '',
    billDiscount: String(record.billDiscount || 0),
    services: (servicesOverride || record.services).map((service) => createBillServiceLine(service))
  };
}

function calculateBillTotals(services: BillPaymentServiceLine[], billDiscountValue: string | number) {
  const totalCost = services.reduce((sum, service) => sum + Math.max(Number(service.lineTotal || 0), 0), 0);
  const billDiscount = Math.max(Number(billDiscountValue || 0), 0);
  const payableAmount = Math.max(totalCost - billDiscount, 0);

  return {
    totalCost,
    billDiscount,
    payableAmount
  };
}

function formatDate(value: string) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${value}T00:00:00`));
}

function resolveDisplayServices(
  record: BillPaymentRecord,
  records: BillPaymentRecord[],
  notes: ReturnType<typeof loadProgressNotes>
) {
  if (record.source === 'progress-note' && record.sourceId) {
    const linkedNote = notes.find((note) => note.id === record.sourceId);
    if (linkedNote?.services?.length) {
      return linkedNote.services
        .filter((service) => service.service.trim() && Number(service.cost || 0) > 0)
        .map((service) =>
          createBillServiceLine({
            id: service.id,
            service: service.service,
            tooth: service.tooth,
            quantity: 1,
            baseAmount: Number(service.cost || 0),
            lineTotal: Number(service.cost || 0),
            remarks: linkedNote.notes || ''
          })
        );
    }

    const linkedRecords = records.filter(
      (candidate) => candidate.source === 'progress-note' && candidate.sourceId === record.sourceId
    );
    if (linkedRecords.length > 1) {
      return linkedRecords.flatMap((candidate) => candidate.services.map((service) => createBillServiceLine(service)));
    }
  }

  return record.services.map((service) => createBillServiceLine(service));
}

function normalizeRecordForSave(record: BillPaymentRecord): BillPaymentRecord {
  return {
    ...record,
    balance: formatCompactBillCurrency(record.balanceAmount),
    ...deriveBillStatus(record.payableAmount, record.paidAmount)
  };
}

function buildServiceMeta(service?: BillPaymentServiceLine) {
  if (!service) return 'No service detail';
  if (service.tooth) return `Tooth ${service.tooth}`;
  return service.remarks || 'No extra detail';
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
