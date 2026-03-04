export default function SkeletonCard() {
  return (
    <div className="flex gap-3 p-4 bg-charcoal rounded-card">
      <div className="skeleton w-20 h-28 flex-shrink-0 rounded-btn" />
      <div className="flex-1 flex flex-col gap-2 py-1">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="mt-auto skeleton h-8 w-28" />
      </div>
    </div>
  );
}
