interface Props {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function SettingsInput({ label, value, placeholder, onChange }: Props) {
  return (
    <label className="settings-field">
      <span className="settings-field__label">{label}</span>
      <input
        className="form-input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
