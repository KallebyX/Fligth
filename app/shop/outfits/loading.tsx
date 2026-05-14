import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="card-pop space-y-3 p-5">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
