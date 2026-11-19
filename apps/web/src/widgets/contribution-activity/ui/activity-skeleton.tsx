import { Skeleton } from '@/shared/ui/skeleton';

/** Mirrors the loaded layout so nothing jumps when data arrives. */
export function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[170px] rounded-xl" />
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Skeleton className="h-[290px] rounded-xl" />
        <Skeleton className="h-[290px] rounded-xl" />
      </div>
    </div>
  );
}
