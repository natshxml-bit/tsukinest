export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-28 animate-pulse">
      <div className="h-40 bg-white/5" />
      <div className="max-w-md mx-auto px-4 -mt-12 space-y-4">
        <div className="w-20 h-20 rounded-full bg-white/10" />
        <div className="h-6 w-40 bg-white/5 rounded-xl" />
        <div className="h-4 w-32 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    </div>
  );
}
