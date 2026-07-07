export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-14 px-4 pb-28">
      <div className="max-w-md mx-auto mt-6 space-y-4">
        <div className="h-7 w-40 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
