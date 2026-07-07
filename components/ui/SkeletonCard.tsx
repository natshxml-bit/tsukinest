export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[132px] space-y-2">
      <div className="aspect-[2/3] rounded-xl bg-[#1c1c1c] animate-pulse" />
      <div className="h-3 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
    </div>
  );
}

export function SkeletonCardGrid() {
  return (
    <div className="flex flex-col h-full">
      <div className="aspect-[2/3] w-full rounded-xl bg-[#1c1c1c] animate-pulse border border-white/[0.04]" />
      <div className="h-3 rounded-md bg-[#1c1c1c] w-3/4 animate-pulse mt-2.5" />
      <div className="h-2 rounded-md bg-[#1c1c1c] w-1/2 animate-pulse mt-1.5" />
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="flex gap-3 p-2 -mx-2">
      <div className="w-16 h-[88px] rounded-lg bg-[#1c1c1c] flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-[#1c1c1c] w-1/2 animate-pulse" />
      </div>
    </div>
  );
}
