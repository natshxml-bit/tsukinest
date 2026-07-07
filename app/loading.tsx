export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-white/40 rounded-full animate-spin" />
        <p className="text-neutral-500 text-sm font-medium">Memuat...</p>
      </div>
    </div>
  );
}
