interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggle({ label, checked, onChange }: Props) {
  return (
    <label className="settings-toggle">
      <span>{label}</span>
      <button
        type="button"
        className={`settings-toggle__switch ${checked ? 'is-active' : ''}`}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="settings-toggle__thumb" />
      </button>
    </label>
  );
}
