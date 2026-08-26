interface Props {
  label: string;
  value: string;
  note?: string;
}

export function AnalyticsMetric({ label, value, note }: Props) {
  return (
    <div className="analytics-metric">
      <span className="analytics-metric__label">{label}</span>
      <strong className="analytics-metric__value">{value}</strong>
      {note && <span className="analytics-metric__note">{note}</span>}
    </div>
  );
}
