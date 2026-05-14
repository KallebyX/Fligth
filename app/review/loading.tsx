import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container max-w-2xl space-y-5 py-6">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-[60vh] rounded-3xl" />
    </main>
  );
}
