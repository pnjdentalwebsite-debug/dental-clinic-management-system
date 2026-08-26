interface Props {
  moduleTitle: string;
  currentDateLabel: string;
}

export function AnalyticsHeader({ moduleTitle, currentDateLabel }: Props) {
  return (
    <header className="analytics-header">
      <div className="analytics-header__copy">
        <p className="analytics-header__eyebrow">Analytics &amp; Reports</p>
        <h2>{moduleTitle}</h2>
      </div>
      <div className="analytics-header__date">
        <span>Current context</span>
        <strong>{currentDateLabel}</strong>
      </div>
    </header>
  );
}
