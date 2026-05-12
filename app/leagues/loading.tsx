import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container max-w-2xl space-y-5 py-6">
      <Skeleton className="h-44 rounded-3xl" />
      <div className="card-pop space-y-3 p-5">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="card-pop space-y-2 p-5">
        <Skeleton className="h-6 w-44" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
