import { LayoutGrid, Search, Table2, Plus } from 'lucide-react';
import { DatePicker } from '../../../../components/overlays/DatePicker';

export type UnifiedPatientFilterKey =
  | 'none'
  | 'recall-date'
  | 'balance'
  | 'status'
  | 'tags'
  | 'first-visit'
  | 'patient-type'
  | 'needs-attention'
  | 'recent-visit'
  | 'balance-due';

export interface UnifiedPatientFilterOption {
  value: string;
  label: string;
}

interface EventDateSummary {
  totalPatients: number;
  totalAppointments: number;
  totalRecalls: number;
  bothCount: number;
}

interface Props {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  selectedFilter: UnifiedPatientFilterKey;
  selectedFilterValue: string;
  filterValueLabel: string;
  filterOptions: UnifiedPatientFilterOption[];
  activeFilterCount: number;
  selectedEventDate: string;
  selectedEventDateSummary: EventDateSummary | null;
  onFilterChange: (value: UnifiedPatientFilterKey) => void;
  onFilterValueChange: (value: string) => void;
  onEventDateChange: (value: string) => void;
  onClearFilters: () => void;
  onAddPatient: () => void;
}

export function PatientToolbar({
  searchValue,
  onSearchValueChange,
  viewMode,
  onViewModeChange,
  selectedFilter,
  selectedFilterValue,
  filterValueLabel,
  filterOptions,
  activeFilterCount,
  selectedEventDate,
  selectedEventDateSummary,
  onFilterChange,
  onFilterValueChange,
  onEventDateChange,
  onClearFilters,
  onAddPatient
}: Props) {
  return (
    <section className="clinic-dashboard-panel patient-toolbar" aria-label="Patient tools">
      <div className="patient-toolbar__top-row">
        <div className="patient-toolbar__search">
          <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search patient by name, ID, or contact..."
              aria-label="Search patients"
            />
          </div>

        <div className="patient-toolbar__actions">
          <div className="patient-toolbar__date-map">
            <label className="patient-toolbar__date-map-label">
              <span>Select Specific Date:</span>
              <DatePicker
                value={selectedEventDate}
                onChange={onEventDateChange}
                placeholder="Select Specific Date"
              />
            </label>

            {selectedEventDateSummary ? (
              <div className="patient-toolbar__date-map-summary">
                <span className="patient-toolbar__summary-pill patient-toolbar__summary-pill--total">
                  {selectedEventDateSummary.totalPatients} patient{selectedEventDateSummary.totalPatients === 1 ? '' : 's'}
                </span>
                <span className="patient-toolbar__summary-pill patient-toolbar__summary-pill--appointment">
                  {selectedEventDateSummary.totalAppointments} appointment{selectedEventDateSummary.totalAppointments === 1 ? '' : 's'}
                </span>
                <span className="patient-toolbar__summary-pill patient-toolbar__summary-pill--recall">
                  {selectedEventDateSummary.totalRecalls} recall{selectedEventDateSummary.totalRecalls === 1 ? '' : 's'}
                </span>
                {selectedEventDateSummary.bothCount > 0 ? (
                  <span className="patient-toolbar__summary-pill patient-toolbar__summary-pill--both">
                    {selectedEventDateSummary.bothCount} both
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="patient-view-toggle" role="group" aria-label="Patient view mode">
            <button
              type="button"
              className={`patient-view-toggle__button ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('table')}
            >
              <Table2 size={16} aria-hidden="true" />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`patient-view-toggle__button ${viewMode === 'grid' ? 'is-active' : ''}`}
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid size={16} aria-hidden="true" />
              <span>Grid</span>
            </button>
          </div>

          <button type="button" className="btn btn-primary patient-toolbar__add" onClick={onAddPatient}>
            <Plus size={16} aria-hidden="true" />
            Add New Patient
          </button>
        </div>
      </div>

      <div className="patient-toolbar__filters">
        <div className="patient-filter-group">
          <label>
            <span>Filter By</span>
            <select value={selectedFilter} onChange={(event) => onFilterChange(event.target.value as UnifiedPatientFilterKey)}>
              <option value="none">All Patients</option>
              <option value="recall-date">Recall Date</option>
              <option value="balance">Balance</option>
              <option value="status">Status</option>
              <option value="tags">Tags</option>
              <option value="first-visit">First Visit</option>
              <option value="patient-type">Patient Type</option>
              <option value="needs-attention">Needs Attention</option>
              <option value="recent-visit">Recent Visit</option>
              <option value="balance-due">Balance Due</option>
            </select>
          </label>
          {selectedFilter !== 'none' ? (
            <label>
              <span>{filterValueLabel}</span>
              <select value={selectedFilterValue} onChange={(event) => onFilterValueChange(event.target.value)}>
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="patient-toolbar__filter-meta">
          <span className="patient-toolbar__active-count">Filters ({activeFilterCount})</span>
          <button type="button" className="patient-toolbar__clear" onClick={onClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
    </section>
  );
}
