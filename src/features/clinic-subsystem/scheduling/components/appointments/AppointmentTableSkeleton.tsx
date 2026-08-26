export function AppointmentTableSkeleton() {
  return (
    <div className="appointment-table-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="appointment-table-skeleton__row" />
      ))}
    </div>
  );
}
