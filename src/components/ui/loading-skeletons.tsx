import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: Props) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <Skeleton className="h-7 w-20 rounded" />
      <Skeleton className="h-3 w-32 rounded" />
    </div>
  );
}

export function KpiCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
      </div>
      <KpiCardsSkeleton />
      <div className="rounded-2xl border border-border bg-card p-6">
        <TableSkeleton />
      </div>
    </div>
  );
}
