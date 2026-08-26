import type { ExportDefinition, ReportDrilldownRow } from '../types';

const escapeCell = (value: string | number | undefined) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const makeSafeCsvFileName = (reportKey: string, date = new Date()) => {
  const stamp = date.toISOString().split('T')[0];
  return `${reportKey.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-report-${stamp}.csv`;
};

export const generateCsv = (definition: ExportDefinition) => {
  const headers = definition.columns.map(column => escapeCell(column.label)).join(',');
  const rows = definition.rows.map((row: ReportDrilldownRow) => definition.columns.map(column => escapeCell(row.cells[column.key])).join(','));
  return [headers, ...rows].join('\n');
};

export const downloadCsv = (definition: ExportDefinition) => {
  const csv = generateCsv(definition);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = definition.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
