import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';

interface TreatmentRecordPrintFormProps {
  clinicName: string;
  address: string;
  contact: string;
  title?: string;
  dentistTitle?: string;
  showClinicName?: boolean;
  showAddress?: boolean;
  showContact?: boolean;
  showLeftImage?: boolean;
  showLeftImageOutline?: boolean;
  showRightImage?: boolean;
  showTitle?: boolean;
  showDentistColumn?: boolean;
  showBalanceColumn?: boolean;
  rowHeightDensity?: string;
  headerSettings?: Partial<DocumentHeaderSettings>;
  dentistName?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
  rows?: PrintableTreatmentRow[];
}

const blankRows = Array.from({ length: 15 }, (_, index) => index);

export interface PrintableTreatmentRow {
  id: string;
  date: string;
  toothNumber: string;
  procedure: string;
  dentist: string;
  amountCharged: string;
  amountPaid?: string;
  balance?: string;
}

function formatTreatmentDate(value?: string) {
  if (!value) return '';

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatTreatmentAmount(value?: string) {
  if (!value) return '';
  const numeric = Number(value.toString().replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(numeric)) return value;
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDentistName(value?: string) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^dr\.?/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

function PrintCellValue({
  value,
  className = '',
  title
}: {
  value?: string;
  className?: string;
  title?: string;
}) {
  if (!value) return null;

  return (
    <span
      className={`treatment-record-print__cell-value ${className}`.trim()}
      title={title || value}
    >
      {value}
    </span>
  );
}

export function TreatmentRecordPrintForm({
  clinicName,
  address,
  contact,
  title = 'TREATMENT RECORD',
  dentistTitle = 'Attending Dentist',
  showClinicName = true,
  showAddress = true,
  showContact = true,
  showLeftImage = true,
  showLeftImageOutline = true,
  showRightImage = true,
  showTitle = true,
  showDentistColumn = true,
  showBalanceColumn = true,
  rowHeightDensity = 'Compact (Fits More)',
  headerSettings,
  dentistName = '',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align',
  rows = []
}: TreatmentRecordPrintFormProps) {
  const densityClass = rowHeightDensity.startsWith('Relaxed')
    ? 'is-relaxed'
    : rowHeightDensity.startsWith('Comfortable')
      ? 'is-comfortable'
      : 'is-compact';

  return (
    <article
      className={`treatment-record-print ${densityClass}`}
      data-pdf-print-root="treatment-record"
    >
      <ConfigurableDocumentHeader
        settings={headerSettings ?? {
          clinicName,
          address,
          contact,
          showClinicName,
          showAddress,
          showContact,
          showLeftImage,
          showLeftImageOutline,
          showRightImage
        }}
      />

      {showTitle && <h1>{title}</h1>}

      <table className="treatment-record-print__table">
        <colgroup>
          <col className="treatment-record-print__col-date" />
          <col className="treatment-record-print__col-tooth" />
          <col className="treatment-record-print__col-procedure" />
          {showDentistColumn && <col className="treatment-record-print__col-dentist" />}
          <col className="treatment-record-print__col-amount" />
          <col className="treatment-record-print__col-amount" />
          {showBalanceColumn && <col className="treatment-record-print__col-amount" />}
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Tooth<br />No./s</th>
            <th>Procedure</th>
            {showDentistColumn && <th>Dentist/s</th>}
            <th>Amount Charged</th>
            <th>Amount Paid</th>
            {showBalanceColumn && <th>Balance</th>}
          </tr>
        </thead>
        <tbody>
          {blankRows.map((rowIndex) => {
            const row = rows[rowIndex];
            return (
            <tr key={row?.id || rowIndex} data-testid="treatment-record-row">
              <td>
                <PrintCellValue value={formatTreatmentDate(row?.date)} className="treatment-record-print__cell-value--date" />
              </td>
              <td>
                <PrintCellValue value={row?.toothNumber} className="treatment-record-print__cell-value--tooth" />
              </td>
              <td>
                <PrintCellValue value={row?.procedure} className="treatment-record-print__cell-value--procedure" />
              </td>
              {showDentistColumn && (
                <td>
                  <PrintCellValue value={formatDentistName(row?.dentist)} className="treatment-record-print__cell-value--dentist" />
                </td>
              )}
              <td>
                <PrintCellValue value={formatTreatmentAmount(row?.amountCharged)} className="treatment-record-print__cell-value--amount" />
              </td>
              <td>
                <PrintCellValue value={formatTreatmentAmount(row?.amountPaid)} className="treatment-record-print__cell-value--amount" />
              </td>
              {showBalanceColumn && (
                <td>
                  <PrintCellValue value={formatTreatmentAmount(row?.balance)} className="treatment-record-print__cell-value--amount" />
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="treatment-record-print__footer">
        <div style={{ justifyItems: signaturePlacement === 'Center' ? 'center' : signaturePlacement === 'Left Align' ? 'start' : 'end' }}>
          {signatureImageData && (
            <img
              className="document-dentist-signature"
              src={signatureImageData}
              alt="Dentist signature"
              style={{ width: `${signatureSize}px` }}
            />
          )}
          <span />
          {dentistName && <small className="treatment-record-print__footer-value">{formatDentistName(dentistName)}</small>}
          <strong>{dentistTitle || 'Attending Dentist'}</strong>
        </div>
      </footer>
    </article>
  );
}
