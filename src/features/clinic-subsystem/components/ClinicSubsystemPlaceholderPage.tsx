interface Props {
  title: string;
  description: string;
  returnLabel: string;
  onReturn: () => void;
}

export function ClinicSubsystemPlaceholderPage({ title, description, returnLabel, onReturn }: Props) {
  return (
    <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <h2>{title}</h2>
      <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '520px' }}>
        {description}
      </p>
      <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onReturn}>
        {returnLabel}
      </button>
    </div>
  );
}
