export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-6 pb-24">
      <div className="h-3 w-14 bg-white/5 rounded animate-pulse mb-2" />
      <div className="h-6 w-40 bg-white/5 rounded-lg animate-pulse mb-6" />

      <div className="flex gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 h-24 rounded-2xl bg-[#1c1c1c] animate-pulse border border-white/[0.05]" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-[#1c1c1c] animate-pulse border border-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}