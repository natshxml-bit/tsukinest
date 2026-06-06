"use client";

import {
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Grid3X3,
  LayoutList,
  SlidersHorizontal,
  Star,
  Clock,
  Flame,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { type MangaItem, getGenre } from "@/lib/api";
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return url;
}

function transformItem(item: any): MangaItem {
  return {
    title: item.title || "Untitled",
    slug: item.slug || "",
    thumb: cleanThumb(item.thumb),
    type: item.type?.split(/\s+/)[0] || "MANHWA",
    latest_chapter: item.chapter || item.latest_chapter || "Ch. ?",
    rating: item.rating ? String(item.rating) : "0",
    link: item.link || "",
    is_colored: item.badges?.includes("color") || false,
    is_hot: item.badges?.includes("hot") || false,
    synopsis: item.synopsis || "",
    genres: item.genres || [],
  };
}

// ═══════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════

function GenreHeader({ genre, onBack, accentStyle }: { genre: string; onBack: () => void; accentStyle: any }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 border-b border-white/[0.04]">
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">
            <span className={accentStyle.text}>{genre}</span>
          </h1>
          <p className="text-[11px] text-slate-500">Genre</p>
        </div>

        <div className="w-10" />
      </div>
    </header>
  );
}

const MangaCard = memo(function MangaCard({ item, accent, accentStyle }: { item: MangaItem; accent: string; accentStyle: any }) {
  const thumb = cleanThumb(item.thumb);

  return (
    <Link
      href={`/detail/${item.slug}`}
      className="group block active:scale-[0.98] transition-transform duration-150"
    >
      <div
        className="relative overflow-hidden rounded-xl bg-slate-900 border border-white/[0.06] aspect-[3/4] isolate"
        style={{ contain: "strict" }}
      >
        <Image
          src={thumb || "/no-image.png"}
          alt={item.title}
          fill
          unoptimized
          loading="lazy"
          sizes="(max-width: 640px) 50vw, 200px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-2 left-2">
          <span className={`px-1.5 py-0.5 rounded ${accentStyle.bg} text-[10px] font-bold text-white uppercase`}>
            {item.type}
          </span>
        </div>

        {item.is_hot && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center px-1.5 py-0.5 rounded bg-rose-500 text-[10px] font-bold text-white">
              <Flame className="w-3 h-3 fill-white" />
            </span>
          </div>
        )}

        {item.rating !== "0" && item.rating !== "?" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white">{item.rating}</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60">
          <Clock className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-bold text-white">{item.latest_chapter}</span>
        </div>
      </div>

      <div className="mt-2">
        <h4 className={`text-[13px] font-semibold text-slate-100 leading-snug line-clamp-2 transition-colors ${accent === 'custom' ? 'group-hover:text-[var(--tsuki-custom-hex)]' : accentStyle.text.replace('text-', 'group-hover:text-')}`}>
          {item.title}
        </h4>
      </div>
    </Link>
  );
});

const ListCard = memo(function ListCard({ item, accent, accentStyle }: { item: MangaItem; accent: string; accentStyle: any }) {
  const thumb = cleanThumb(item.thumb);

  return (
    <Link
      href={`/detail/${item.slug}`}
      className="group flex gap-3 items-start rounded-xl p-2 -m-2 active:scale-[0.98] transition-transform duration-150 hover:bg-white/[0.02]"
    >
      <div
        className="relative w-[88px] h-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-white/[0.06]"
        style={{ contain: "strict" }}
      >
        <Image
          src={thumb || "/no-image.png"}
          alt={item.title}
          fill
          unoptimized
          loading="lazy"
          sizes="88px"
          className="object-cover"
        />
        <div className="absolute top-1.5 left-1.5">
          <span className={`px-1.5 py-0.5 rounded ${accentStyle.bg} text-[9px] font-bold text-white uppercase`}>
            {item.type}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h4 className={`text-sm font-bold text-slate-100 line-clamp-2 leading-snug transition-colors ${accent === 'custom' ? 'group-hover:text-[var(--tsuki-custom-hex)]' : accentStyle.text.replace('text-', 'group-hover:text-')}`}>
          {item.title}
        </h4>

        <div className="mt-2 flex items-center gap-2.5 text-xs text-slate-400">
          {item.rating !== "0" && item.rating !== "?" && (
            <span className="flex items-center gap-1 text-yellow-400 font-medium">
              <Star className="w-3 h-3 fill-yellow-400" /> {item.rating}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {item.latest_chapter}
          </span>
        </div>

        {item.synopsis && (
          <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {item.synopsis}
          </p>
        )}

        {item.genres.length > 0 && (
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {item.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-500 border border-white/[0.04]"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
});

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("bg-slate-800/50 relative overflow-hidden", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-2.5">
      <Shimmer className="aspect-[3/4] rounded-xl" />
      <Shimmer className="h-4 rounded-lg w-3/4" />
      <Shimmer className="h-3 rounded-lg w-1/2" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex gap-3.5">
      <Shimmer className="w-[88px] h-[120px] rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-2">
        <Shimmer className="h-4 rounded-lg w-3/4" />
        <Shimmer className="h-3 rounded-lg w-1/2" />
        <Shimmer className="h-3 rounded-lg w-1/3" />
      </div>
    </div>
  );
}

function EmptyState({ genre, accentStyle }: { genre: string; accentStyle: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1">Tidak ada hasil</h3>
      <p className="text-slate-500 text-sm max-w-[240px]">
        Belum ada manga untuk genre <span className={`${accentStyle.text} font-medium`}>{genre}</span>
      </p>
    </div>
  );
}

function ErrorState({ onRetry, accentStyle }: { onRetry: () => void; accentStyle: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 ring-1 ring-rose-500/20">
        <AlertCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1">Gagal Memuat</h3>
      <p className="text-slate-500 text-sm mb-6">Periksa koneksi dan coba lagi</p>
      <button
        onClick={onRetry}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl ${accentStyle.bg} text-white text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-lg ${accentStyle.glow}`}
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE (FIXED INFINITE SCROLL)
// ═══════════════════════════════════════════════════

export default function GenrePage() {
  const { accent, style: accentStyle } = useAccent(); // 👈 INISIALISASI HOOK ACCENT

  const params = useParams();
  const router = useRouter();
  const genre = (params?.genre as string) || "";

  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "rating">("latest");
  const [showSort, setShowSort] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [genreList, setGenreList] = useState<{ name: string; slug: string }[]>([]);

  // ── Observer target pakai state biar React tahu lifecycle-nya ──
  const [observerTarget, setObserverTarget] = useState<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch daftar genre
  useEffect(() => {
    let cancelled = false;
    async function fetchGenreList() {
      try {
        const res = await fetch("https://cnest.up.railway.app/api/genres");
        const json = await res.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setGenreList(json.data);
        }
      } catch (err) {
        console.error("Gagal nge-fetch list genre:", err);
      }
    }
    fetchGenreList();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchGenre = useCallback(
    async (pageNum: number, reset = false) => {
      if (!genre || isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(false);

      try {
        const res = await getGenre(genre, pageNum);

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.results)
          ? res.data.results
          : [];

        const transformed = data.map(transformItem);

        if (reset) {
          setItems(transformed);
        } else {
          setItems((prev) => {
            const existing = new Set(prev.map((p) => p.slug));
            const merged = [...prev];
            for (const t of transformed) {
              if (!existing.has(t.slug)) merged.push(t);
            }
            return merged;
          });
        }

        if (res?.pagination?.total_pages) {
          setHasMore(pageNum < res.pagination.total_pages);
        } else {
          setHasMore(data.length > 0);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [genre]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchGenre(1, true);
  }, [genre, fetchGenre]);

  // ── INFINITE SCROLL OBSERVER (FIXED) ──
  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isFetchingRef.current) {
      const next = page + 1;
      setPage(next);
      fetchGenre(next, false);
    }
  }, [page, fetchGenre, loading, hasMore]);

  useEffect(() => {
    if (!observerTarget || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [observerTarget, hasMore, loadMore]);

  // ── Sort ──
  const sorted = useMemo(() => {
    if (sortBy === "latest") return items;
    const copy = [...items];
    if (sortBy === "rating") {
      copy.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (sortBy === "popular") {
      copy.sort((a, b) => (b.is_hot ? 1 : 0) - (a.is_hot ? 1 : 0));
    }
    return copy;
  }, [items, sortBy]);

  const formattedGenre = genre
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-white/10">
      <GenreHeader genre={formattedGenre} onBack={() => router.back()} accentStyle={accentStyle} />

      <main className="max-w-md mx-auto px-4 pt-20 space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <button
              onClick={() => setShowGenreDropdown((v) => !v)}
              className="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.04] active:scale-95 transition-transform"
            >
              <span className="flex items-center gap-2">
                <Grid3X3 className={`w-4 h-4 ${accentStyle.text}`} />
                <span className="text-slate-500">Genre:</span>
                <span className="font-bold text-white truncate max-w-[100px]">
                  {formattedGenre}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-500 transition-transform",
                  showGenreDropdown && "rotate-180"
                )}
              />
            </button>

            {showGenreDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowGenreDropdown(false)}
                />
                <div className="absolute top-13 left-0 right-0 z-50 mt-2 p-2 bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 max-h-[60vh] overflow-y-auto scrollbar-hide">
                  {genreList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {genreList.map((g) => (
                        <button
                          key={g.slug}
                          onClick={() => {
                            setShowGenreDropdown(false);
                            router.push(`/genre/${g.slug}`);
                          }}
                          className={cn(
                            "text-left px-3 py-2.5 text-xs rounded-lg transition-colors",
                            genre === g.slug
                              ? `${accentStyle.soft} ${accentStyle.text} font-bold border ${accentStyle.border}`
                              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Memuat genre...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSort((v) => !v)}
              className={cn(
                "w-11 h-11 flex items-center justify-center rounded-xl border transition-all active:scale-90",
                showSort
                  ? `${accentStyle.bg} border-transparent text-white`
                  : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {showSort && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSort(false)}
                />
                <div className="absolute top-12 right-0 z-50 w-40 bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden py-1">
                  {[
                    { key: "latest" as const, label: "Terbaru" },
                    { key: "popular" as const, label: "Populer" },
                    { key: "rating" as const, label: "Rating" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortBy(opt.key);
                        setShowSort(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        sortBy === opt.key
                          ? `${accentStyle.soft} ${accentStyle.text} font-medium`
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white/[0.02] rounded-xl p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all active:scale-90",
                viewMode === "grid"
                  ? `${accentStyle.bg} text-white`
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all active:scale-90",
                viewMode === "list"
                  ? `${accentStyle.bg} text-white`
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sort indicator */}
        {!loading && !error && items.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{items.length} hasil</p>
            <button
              onClick={() => setShowSort(true)}
              className={`flex items-center gap-1 text-xs ${accent === 'custom' ? 'text-[var(--tsuki-custom-hex)]' : accentStyle.text} hover:brightness-125 transition-colors`}
            >
              {sortBy === "latest" && "Terbaru"}
              {sortBy === "popular" && "Populer"}
              {sortBy === "rating" && "Rating"}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Content */}
        {error && !loading ? (
          <ErrorState onRetry={() => fetchGenre(1, true)} accentStyle={accentStyle} />
        ) : loading && items.length === 0 ? (
          <div
            className={cn(
              "gap-3",
              viewMode === "grid" ? "grid grid-cols-2" : "space-y-4"
            )}
          >
            {Array.from({ length: 6 }).map((_, i) =>
              viewMode === "grid" ? (
                <SkeletonCard key={i} />
              ) : (
                <SkeletonList key={i} />
              )
            )}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState genre={formattedGenre} accentStyle={accentStyle} />
        ) : (
          <>
            <div
              className={cn(
                "gap-3",
                viewMode === "grid" ? "grid grid-cols-2" : "space-y-1"
              )}
            >
              {sorted.map((item) =>
                viewMode === "grid" ? (
                  <MangaCard key={item.slug} item={item} accent={accent} accentStyle={accentStyle} />
                ) : (
                  <ListCard key={item.slug} item={item} accent={accent} accentStyle={accentStyle} />
                )
              )}
            </div>

            {/* ── INFINITE SCROLL TARGET (FIXED) ── */}
            {hasMore && (
              <div
                ref={setObserverTarget}
                className="flex justify-center pt-8 pb-4"
              >
                {loading && (
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className={`w-4 h-4 border-2 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`} />
                    <span className="text-xs font-medium text-slate-400">
                      Memuat data...
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
