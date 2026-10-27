interface SkeletonProps {
  className?: string;
}

export function SkeletonText({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function SkeletonCard({ className = 'h-32 w-full' }: SkeletonProps) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg">
          <div className="skeleton rounded-full w-10 h-10 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="skeleton rounded h-4 w-3/4" />
            <div className="skeleton rounded h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
