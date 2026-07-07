export default function PopularLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-14 px-4 pb-28">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-end mb-4 mt-5">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-3 w-48 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
              <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
