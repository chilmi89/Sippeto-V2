export default function TenantLoading() {
  return (
    <div className="w-full flex flex-col gap-6 py-2 px-4 sm:px-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
        <div className="max-w-xl space-y-3">
          <div className="w-32 h-3 bg-zinc-200 rounded-full animate-pulse" />
          <div className="w-64 h-6 bg-zinc-200 rounded-lg animate-pulse" />
          <div className="w-48 h-3 bg-zinc-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm h-[280px] sm:h-[340px] flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="w-20 h-2.5 bg-zinc-100 rounded-full animate-pulse" />
                <div className="w-32 h-5 bg-zinc-100 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="flex-1 bg-zinc-50 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
