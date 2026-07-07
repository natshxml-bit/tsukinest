"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Clock, ChevronLeft, ChevronRight, TrendingUp, ImageIcon } from "lucide-react";

import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { API_BASE_URL } from "@/constants/api";
import SmartImage from "@/components/ui/SmartImage";
import { SkeletonCardGrid } from "@/components/ui/SkeletonCard";
import { formatMangaType } from "@/utils/manga";
import type { MangaItem } from "@/types/manga";

function MangaCard({ item, accentStyle }: { item: MangaItem; accentStyle: { bg: string; text: string } }) {
  return (
    <Link href={`/manga/${item.slug}`} className="block h-full active:scale-95 transition-transform duration-150 transform-gpu">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2 border border-white/[0.04] transform-gpu">
          <SmartImage
            src={item.thumb || "/no-image.png"}
            alt={item.title}
            title={item.title}
            fill
            loading="lazy"
            decoding="async"
            className="object-cover transition-transform duration-500 hover:scale-105 will-change-transform"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            <div className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white/90 uppercase max-w-[60%] truncate">
              {formatMangaType(item.type)}
            </div>
            {item.rating && item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 shrink-0">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white/90">{item.rating}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 min-w-0">
              <Clock className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
              <span className="text-[10px] font-medium text-white/90 truncate">{item.latest_chapter || "Ch. ?"}</span>
            </div>
          </div>
        </div>
        <h4 className="text-xs font-medium text-neutral-300 leading-snug line-clamp-2 mt-1">
          {item.title}
        </h4>
      </div>
    </Link>
  );
}

export default function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { style: accentStyle } = useAccent();
  const router = useRouter();
  const params = use(searchParams);
  const currentPage = Number(params.page) || 1;

  const [comics, setComics] = useState<MangaItem[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError(false);

    fetch(`${API_BASE_URL}/popular?page=${currentPage}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data?.results) {
          setComics(json.data.results);
          setHasNext(json.data.pagination ? json.data.pagination.has_next : json.data.results.length >= 10);
        } else {
          setComics([]);
          setHasNext(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-28 font-sans selection:bg-white/10 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05] transform-gpu">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg)}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight">Populer</h1>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 pt-5 max-w-md mx-auto">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Top Harian</h2>
            <p className="text-[11px] text-neutral-500 font-medium">Komik paling banyak dibaca</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-neutral-300">
            Hal. {currentPage}
          </div>
        </div>

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#141414] rounded-2xl border border-white/5 mt-4">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🚨</span>
            </div>
            <h3 className="text-base font-bold text-neutral-200 mb-1">Koneksi Terputus</h3>
            <p className="text-sm text-neutral-500 mb-5">Gagal memuat data dari server.</p>
            <button
              onClick={() => window.location.reload()}
              className={cn("px-5 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95", accentStyle.bg)}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => <SkeletonCardGrid key={i} />)
            ) : comics.length > 0 ? (
              comics.map((item, i) => (
                <MangaCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />
              ))
            ) : (
              <div className="col-span-2 md:col-span-3 flex flex-col items-center py-20 text-neutral-500">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada komik populer.</p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && comics.length > 0 && (
          <div className="flex justify-between items-center mt-10 mb-6 bg-[#141414] p-2 rounded-2xl border border-white/[0.05]">
            <Link
              href={currentPage > 1 ? `/popular?page=${currentPage - 1}` : "#"}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                currentPage > 1
                  ? "bg-white/5 text-neutral-300 hover:bg-white/10 active:scale-95 border border-white/[0.05]"
                  : "text-neutral-600 opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Link>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Halaman</span>
              <span className={cn("text-sm font-extrabold", accentStyle.text)}>{currentPage}</span>
            </div>
            <Link
              href={hasNext ? `/popular?page=${currentPage + 1}` : "#"}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                hasNext
                  ? cn(accentStyle.bg, "text-white active:scale-95")
                  : "bg-white/5 text-neutral-600 opacity-50 cursor-not-allowed border border-white/[0.05]"
              )}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
