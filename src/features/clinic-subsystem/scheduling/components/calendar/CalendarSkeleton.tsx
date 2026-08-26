export function CalendarSkeleton() {
  return (
    <div className="calendar-skeleton">
      <div className="calendar-skeleton__grid">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="calendar-skeleton__cell" />
        ))}
      </div>
    </div>
  );
}
