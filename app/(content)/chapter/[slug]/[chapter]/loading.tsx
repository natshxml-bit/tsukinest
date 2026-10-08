// app/(content)/chapter/[slug]/[chapter]/loading.tsx
export default function ChapterLoading() {
  return (
    <div className="min-h-full w-full bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
      <p className="text-sm text-gray-500 font-medium tracking-wide">Memuat chapter...</p>
    </div>
  );
}
