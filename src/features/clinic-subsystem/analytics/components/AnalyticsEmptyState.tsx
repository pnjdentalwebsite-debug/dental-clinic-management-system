interface Props {
  title: string;
  description: string;
}

export function AnalyticsEmptyState({ title, description }: Props) {
  return (
    <div className="analytics-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
