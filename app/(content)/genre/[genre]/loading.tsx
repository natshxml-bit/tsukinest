export default function GenreLoading() {
  return (
    <div className="min-h-screen bg-slate-950 pt-20 px-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex gap-2 mb-6">
          <div className="flex-1 h-11 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-11 h-11 rounded-xl bg-white/5 animate-pulse" />
          <div className="w-20 h-11 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
