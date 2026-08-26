export function WaitlistSkeleton() {
  return (
    <div className="waitlist-skeleton">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="waitlist-skeleton__card" />
      ))}
    </div>
  );
}
