import { Skeleton } from "@/components/ui/skeleton.jsx";

export default function TodaySkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-36 rounded-md" />
      </div>

      {/* Progress & Streak Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Skeleton className="h-32 md:col-span-7 lg:col-span-8 rounded-2xl" />
        <Skeleton className="h-32 md:col-span-5 lg:col-span-4 rounded-2xl" />
      </div>

      {/* Next Action Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>

      {/* Today's Routines, Today's Work & Quick Context Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Today's Routines Section Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>

          {/* Today's Work Section Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Column: Quick Context & Insight Skeleton */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
