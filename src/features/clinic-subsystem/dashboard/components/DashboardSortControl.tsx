import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface Props {
  sortMode: string;
  onChange: (value: string) => void;
  options: SortOption[];
  label?: string;
}

export function DashboardSortControl({ sortMode, onChange, options, label = 'Sort entries' }: Props) {
  const [open, setOpen] = useState(false);

  const currentOption = useMemo(() => options.find((option) => option.value === sortMode) ?? options[0], [options, sortMode]);

  return (
    <div className="dashboard-sort-control">
      <button
        type="button"
        className="dashboard-sort-control__trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ArrowUpDown size={14} />
        <span>Sort</span>
        <strong>{currentOption?.label}</strong>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="dashboard-sort-control__menu" role="menu" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`dashboard-sort-control__option ${sortMode === option.value ? 'is-active' : ''}`}
              aria-pressed={sortMode === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
