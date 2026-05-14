import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </main>
  );
}
