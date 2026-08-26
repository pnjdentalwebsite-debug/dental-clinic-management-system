interface Props {
  code: string;
  name: string;
  description: string;
  meaning?: string;
  color: string;
  badgeLabel?: string;
}

export function MasterFilePreviewCard({
  code,
  name,
  description,
  meaning,
  color,
  badgeLabel = 'Live Preview'
}: Props) {
  return (
    <section className="master-file-record-modal__identity-card" aria-label="Live preview">
      <div className="master-file-record-modal__identity-main">
        <div className="master-file-record-modal__preview-dot master-file-record-modal__preview-dot--large" style={{ backgroundColor: color }} />
        <div className="master-file-record-modal__identity-copy">
          <div className="master-file-record-modal__identity-row">
            <strong>{code}</strong>
            <span className="master-file-record-modal__identity-divider">|</span>
            <span>{name}</span>
          </div>
          <p>{description}</p>
          {meaning && meaning !== name ? (
            <small>{meaning}</small>
          ) : null}
        </div>
      </div>
      <span className="master-file-record-modal__identity-badge">{badgeLabel}</span>
    </section>
  );
}
