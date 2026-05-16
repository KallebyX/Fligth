export default function SettingsLoading() {
  return (
    <main className="container max-w-2xl space-y-6 py-6">
      <div className="space-y-2">
        <div className="skeleton h-9 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div
            className="card-pop space-y-3 p-4"
            aria-hidden="true"
          >
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-9 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </main>
  );
}
