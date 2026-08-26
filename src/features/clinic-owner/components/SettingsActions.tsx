interface Props {
  onSave: () => void;
  onCancel: () => void;
}

export function SettingsActions({ onSave, onCancel }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      marginTop: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <button
        type="button"
        className="btn btn-outline"
        onClick={onCancel}
        style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSave}
        style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
      >
        Save Changes
      </button>
    </div>
  );
}
