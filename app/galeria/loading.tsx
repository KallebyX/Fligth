export default function GalleryLoading() {
  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      <ul className="space-y-6">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="overflow-hidden rounded-3xl border-2 border-cloud-deep bg-white dark:border-ink-light/60 dark:bg-ink-mid"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3 p-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-2.5 w-1/4" />
              </div>
            </div>
            <div className="skeleton aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-7 w-20 rounded-full" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
