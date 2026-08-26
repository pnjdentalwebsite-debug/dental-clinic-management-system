interface Props {
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function ClinicFormActions({ onSave, onCancel, isSaving = false }: Props) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.75rem',
      padding: '1.25rem var(--card-pad)',
      borderTop: '1px solid var(--border)',
      backgroundColor: 'var(--background)',
      position: 'sticky',
      bottom: 0,
      zIndex: 10,
      marginTop: '1.5rem',
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
    }}>
      <button
        type="button"
        className="btn btn-outline"
        onClick={onCancel}
        style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
        disabled={isSaving}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSave}
        style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
