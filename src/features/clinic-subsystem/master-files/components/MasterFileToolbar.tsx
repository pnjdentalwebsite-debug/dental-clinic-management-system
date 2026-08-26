import { Plus, Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions?: Array<{ value: string; label: string }>;
  addLabel: string;
  onAdd: () => void;
}

export function MasterFileToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  searchPlaceholder = 'Search name, code, description',
  sortOptions = [
    { value: 'sortOrder', label: 'Sort Order' },
    { value: 'name', label: 'Name' },
    { value: 'code', label: 'Code' },
    { value: 'updatedAt', label: 'Updated' }
  ],
  addLabel,
  onAdd
}: Props) {
  return (
    <div className="master-file-toolbar patient-record__card">
      <label className="master-file-toolbar__search">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>

      <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="all">All</option>
      </select>

      <select value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <button type="button" className="btn btn-primary master-file-toolbar__add" onClick={onAdd}>
        <Plus size={16} />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}
