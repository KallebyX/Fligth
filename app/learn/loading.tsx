import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container max-w-3xl py-6">
      <div className="card-pop mb-6 flex items-center gap-3 p-4 sm:p-5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-8">
            <Skeleton className="h-20 rounded-2xl" />
            <div className="flex flex-col items-center gap-10">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-20 w-20 rounded-full"
                  // offset like the serpentine path
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
