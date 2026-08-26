import { Eye, ExternalLink } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { ReportDrilldownRow, ReportTableColumn } from '../types';

interface Props {
  title: string;
  columns: ReportTableColumn[];
  rows: ReportDrilldownRow[];
  onNavigate: (route: string) => void;
}

export function ReportTable({ title, columns, rows, onNavigate }: Props) {
  return (
    <section className="dashboard-panel">
      <h2>{title}</h2>
      {rows.length === 0 ? <div className="empty-state">No rows match the current analytics filters.</div> : (
        <div className="table-container">
          <table className="data-table">
            <caption className="sr-only">{title}</caption>
            <thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  {columns.map(column => <td key={column.key} style={{ textAlign: column.align || 'left' }}>{row.cells[column.key]}</td>)}
                  <td>
                    <RowActionMenu
                      ariaLabel={`Actions for ${row.id}`}
                      items={[
                        { id: 'view', label: 'View Related Record', icon: Eye, disabled: !row.actionRoute, onSelect: () => row.actionRoute && onNavigate(row.actionRoute) },
                        { id: 'secondary', label: 'Open Secondary Record', icon: ExternalLink, disabled: !row.secondaryRoute, onSelect: () => row.secondaryRoute && onNavigate(row.secondaryRoute) }
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
