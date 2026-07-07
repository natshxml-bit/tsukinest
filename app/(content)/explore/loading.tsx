export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 px-4 pb-28">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
