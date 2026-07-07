// app/(content)/manga/[slug]/loading.tsx
export default function MangaDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero skeleton */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[#141414] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      {/* Content skeleton */}
      <div className="px-4 -mt-32 relative z-10 max-w-4xl mx-auto space-y-4">
        <div className="flex gap-5">
          <div className="w-36 aspect-[3/4] rounded-2xl bg-[#141414] animate-pulse shrink-0" />
          <div className="flex-1 space-y-3 pt-16">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-[#141414] rounded-full animate-pulse" />
              <div className="h-5 w-20 bg-[#141414] rounded-full animate-pulse" />
            </div>
            <div className="h-8 bg-[#141414] rounded-lg w-3/4 animate-pulse" />
            <div className="h-4 bg-[#141414] rounded-lg w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="h-12 bg-[#141414] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-[#141414] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-28 bg-[#141414] rounded-2xl animate-pulse" />
        <div className="h-64 bg-[#141414] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
