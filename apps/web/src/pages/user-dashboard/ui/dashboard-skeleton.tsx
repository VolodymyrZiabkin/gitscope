import { ActivitySkeleton } from '@/widgets/contribution-activity';
import { Skeleton } from '@/shared/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6" aria-busy aria-label="Loading profile">
      <div className="flex flex-col gap-5 sm:flex-row">
        <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-7 w-52" />
      <ActivitySkeleton />
    </div>
  );
}
