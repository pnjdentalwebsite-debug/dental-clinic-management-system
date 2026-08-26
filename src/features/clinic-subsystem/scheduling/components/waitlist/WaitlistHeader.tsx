interface Props {
  moduleTitle: string;
  currentDateLabel: string;
}

export function WaitlistHeader({ moduleTitle, currentDateLabel }: Props) {
  return (
    <div className="waitlist-header">
      <div className="waitlist-header__copy">
        <p className="waitlist-header__eyebrow">Daily Waitlist</p>
        <h2>{moduleTitle}</h2>
      </div>
      <div className="waitlist-header__date">
        <span>Current date</span>
        <strong>{currentDateLabel}</strong>
      </div>
    </div>
  );
}
