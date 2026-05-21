export default function SchoolsLoading() {
  return (
    <main className="container max-w-3xl space-y-6 py-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      {/* Filter chips skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-11 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-7 w-12 rounded-full" />
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <ul className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <li
            key={i}
            className="rounded-3xl border-2 border-cloud-deep bg-white p-4 dark:border-ink-light/60 dark:bg-ink-mid"
            aria-hidden="true"
          >
            <div className="flex items-start gap-3">
              <div className="skeleton h-14 w-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
