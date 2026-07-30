"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Loader2, Star, Clock } from "lucide-react";

import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { formatMangaType } from "@/utils/manga";
import { API_BASE_URL } from "@/constants/api";
import SmartImage from "@/components/ui/SmartImage";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type MangaItem = {
  title: string;
  slug: string;
  thumb: string;
  type: string;
  latest_chapter: string;
  rating: string;
  link: string;
  is_colored: boolean;
  is_hot: boolean;
};

type AccentStyle = Record<string, string>;

const CACHE_KEY = "tsukinest_all_series_cache_v2";

let globalList: MangaItem[] = [];
let globalPage = 1;
let globalScroll = 0;
let globalFilters = { genre: "", type: "", status: "", order: "popular" };

const typeOptions = [
  { value: "", label: "Semua Tipe" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" },
];

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "ongoing", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
];

const orderOptions = [
  { value: "popular", label: "Terpopuler" },
  { value: "latest", label: "Terbaru" },
  { value: "title", label: "A-Z" },
];

// =============================================================================
// HELPERS
// =============================================================================

function extractType(item: Record<string, unknown>): string {
  const taxonomy = item.taxonomy as Record<string, unknown[]> | undefined;
  const formats = taxonomy?.Format;
  if (Array.isArray(formats) && formats.length > 0) {
    const slug = (formats[0] as Record<string, unknown>)?.slug;
    if (typeof slug === "string" && slug.trim()) return slug.toUpperCase();
  }
  const countryId = typeof item.country_id === "string" ? item.country_id : "";
  if (countryId === "KR") return "MANHWA";
  if (countryId === "CN") return "MANHUA";
  if (countryId === "JP") return "MANGA";
  return (typeof item.type === "string" ? item.type : "MANHWA").toUpperCase();
}

function transformItem(item: Record<string, unknown>): MangaItem {
  return {
    title: typeof item.title === "string" ? item.title : "Untitled",
    slug:
      typeof item.slug === "string"
        ? item.slug
        : typeof item.manga_id === "string"
          ? item.manga_id
          : "",
    thumb:
      typeof item.thumb === "string"
        ? item.thumb
        : typeof item.thumbnail === "string"
          ? item.thumbnail
          : typeof item.cover_image_url === "string"
            ? item.cover_image_url
            : typeof item.cover_portrait_url === "string"
              ? item.cover_portrait_url
              : "",
    type: extractType(item),
    latest_chapter:
      typeof item.chapter === "string"
        ? item.chapter
        : typeof item.latest_chapter === "string"
          ? item.latest_chapter
          : typeof item.latest_chapter_number === "number"
            ? `Ch. ${item.latest_chapter_number}`
            : "Ch. ?",
    rating:
      item.rating || item.user_rate
        ? String(item.rating ?? item.user_rate)
        : "0",
    link: typeof item.link === "string" ? item.link : "",
    is_colored: false,
    is_hot: false,
  };
}

// =============================================================================
// MANGA CARD — ✅ Badge IDENTIK dengan Explore/Search/Popular/Latest/Genre
// =============================================================================

const MangaCard = memo(function MangaCard({
  item,
  accentStyle,
}: {
  item: MangaItem;
  accentStyle: AccentStyle;
}) {
  const cleanTitle = (item.title || "").replace(/subtitle indonesia/i, "").trim();

  return (
    <Link
      href={`/manga/${item.slug}`}
      className="block h-full active:scale-95 transition-transform duration-150 transform-gpu"
    >
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2 border border-white/[0.04] transform-gpu">
          <SmartImage
            src={item.thumb || "/no-image.png"}
            alt={cleanTitle}
            title={cleanTitle}
            fill
            loading="lazy"
            decoding="async"
            className="object-cover transition-transform duration-500 hover:scale-105 will-change-transform"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* ✅ Badge — formatMangaType doang, shrink-0, tanpa accent bg */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            <span className="px-1.5 py-[2px] rounded-md text-[8px] font-bold text-white/90 uppercase bg-black/70 border border-white/10 tracking-wide pointer-events-none shrink-0">
              {formatMangaType(item.type)}
            </span>
            {item.rating && item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5 px-1.5 py-[2px] rounded bg-black/80 shrink-0">
                <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-bold text-white/90">{item.rating}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-[2px] rounded bg-black/80 min-w-0">
              <Clock className="w-2 h-2 text-neutral-400 shrink-0" />
              <span className="text-[9px] font-medium text-white/90 truncate">
                {item.latest_chapter || "Ch. ?"}
              </span>
            </div>
          </div>
        </div>

        <h4 className="text-[11px] sm:text-xs font-medium text-neutral-300 leading-snug line-clamp-2 mt-0.5 group-hover:text-white transition-colors">
          {cleanTitle}
        </h4>
      </div>
    </Link>
  );
});

// =============================================================================
// SKELETON
// =============================================================================

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] w-full rounded-xl bg-[#1c1c1c] animate-pulse border border-white/[0.04]" />
      <div className="h-3 bg-[#1c1c1c] rounded-md w-full animate-pulse" />
      <div className="h-3 bg-[#1c1c1c] rounded-md w-2/3 animate-pulse" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function AllSeriesPage() {
  const { style: accentStyle } = useAccent();

  const [mangaList, setMangaList] = useState<MangaItem[]>(globalList);
  const [page, setPage] = useState(globalPage);
  const [isLoading, setIsLoading] = useState(globalList.length === 0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState(globalFilters.genre);
  const [selectedType, setSelectedType] = useState(globalFilters.type);
  const [selectedStatus, setSelectedStatus] = useState(globalFilters.status);
  const [selectedOrder, setSelectedOrder] = useState(globalFilters.order);

  const [showFilters, setShowFilters] = useState(false);
  const [tempGenre, setTempGenre] = useState(globalFilters.genre);
  const [tempType, setTempType] = useState(globalFilters.type);
  const [tempStatus, setTempStatus] = useState(globalFilters.status);
  const [tempOrder, setTempOrder] = useState(globalFilters.order);

  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastFetchedPageRef = useRef(0);

  // ✅ Fetch genres dari API_BASE_URL (bukan hardcoded)
  useEffect(() => {
    let cancelled = false;
    async function fetchGenres() {
      try {
        const res = await fetch(`${API_BASE_URL}/genres`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        let raw: { id: string; name: string }[] = [];
        if (Array.isArray(json)) raw = json;
        else if (json?.data && Array.isArray(json.data)) raw = json.data;

        setGenres(raw.filter((g) => g.id && g.name));
      } catch {
        /* ignore */
      }
    }
    fetchGenres();
    return () => { cancelled = true; };
  }, []);

  const fetchManga = useCallback(
    async (pageNum: number, resetList = false) => {
      if (!resetList && pageNum === lastFetchedPageRef.current) return;
      if (pageNum < 1) return;
      if (resetList) setIsLoading(true);
      else setIsFetchingNextPage(true);

      try {
        const params = new URLSearchParams();
        if (selectedGenre) params.set("genre", selectedGenre);
        if (selectedType) params.set("type", selectedType);
        if (selectedStatus) params.set("status", selectedStatus);
        if (selectedOrder) params.set("order", selectedOrder);
        params.set("page", String(pageNum));

        // ✅ Pakai API_BASE_URL (fix typo localhost:300)
        const url = `${API_BASE_URL}/filter?${params.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        let rawData: Record<string, unknown>[] = [];
        let pagination: { has_next?: boolean } | null = null;

        if (json?.status && json?.data?.results && Array.isArray(json.data.results)) {
          rawData = json.data.results;
          pagination = json.data.pagination;
        }

        const transformed = rawData.map(transformItem);

        if (resetList) {
          const unique = Array.from(new Map(transformed.map((item) => [item.slug, item])).values());
          globalList = unique;
          setMangaList(unique);
          setHasMore(pagination?.has_next ?? rawData.length >= 24);
          lastFetchedPageRef.current = pageNum;
          globalPage = pageNum;
        } else {
          const combined = [...globalList, ...transformed];
          const unique = Array.from(new Map(combined.map((item) => [item.slug, item])).values());
          globalList = unique;
          setMangaList(unique);
          setHasMore(pagination?.has_next ?? rawData.length >= 24);
          lastFetchedPageRef.current = pageNum;
          globalPage = pageNum;
        }

        globalFilters = {
          genre: selectedGenre,
          type: selectedType,
          status: selectedStatus,
          order: selectedOrder,
        };
      } catch (err) {
        console.error("[AllSeries] Fetch error:", err);
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [selectedGenre, selectedType, selectedStatus, selectedOrder]
  );

  useEffect(() => {
    const isCacheValid =
      globalFilters.genre === selectedGenre &&
      globalFilters.type === selectedType &&
      globalFilters.status === selectedStatus &&
      globalFilters.order === selectedOrder &&
      globalList.length > 0;

    if (isCacheValid) {
      setMangaList(globalList);
      setPage(globalPage);
      setIsLoading(false);
      lastFetchedPageRef.current = globalPage;
      return;
    }

    setPage(1);
    globalPage = 1;
    lastFetchedPageRef.current = 0;
    fetchManga(1, true);
  }, [selectedGenre, selectedType, selectedStatus, selectedOrder, fetchManga]);

  useEffect(() => {
    if (page === 1) return;
    if (page <= lastFetchedPageRef.current) return;
    fetchManga(page, false);
  }, [page, fetchManga]);

  useEffect(() => {
    if (globalList.length > 0 && globalScroll > 0) {
      const timer = setTimeout(() => window.scrollTo(0, globalScroll), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSaveScroll = () => {
    globalScroll = window.scrollY;
  };

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore) {
              setPage((prev) => prev + 1);
            }
          },
          { rootMargin: "300px" }
        );
        observerRef.current.observe(node);
      }
    },
    [isLoading, isFetchingNextPage, hasMore]
  );

  const openBottomSheet = () => {
    setTempGenre(selectedGenre);
    setTempType(selectedType);
    setTempStatus(selectedStatus);
    setTempOrder(selectedOrder);
    setShowFilters(true);
  };

  const activeFilters = [
    selectedGenre && {
      id: "genre",
      label: genres.find((g) => g.id === selectedGenre)?.name || "Genre",
    },
    selectedType && {
      id: "type",
      label: typeOptions.find((t) => t.value === selectedType)?.label || "Type",
    },
    selectedStatus && {
      id: "status",
      label: statusOptions.find((s) => s.value === selectedStatus)?.label || "Status",
    },
    selectedOrder !== "popular" && {
      id: "order",
      label: orderOptions.find((o) => o.value === selectedOrder)?.label || "Order",
    },
  ].filter(Boolean) as { id: string; label: string }[];

  const Chip = ({
    active,
    onClick,
    children,
  }: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 border whitespace-nowrap",
        active
          ? cn("border-transparent shadow-md", accentStyle.bg, "text-white")
          : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="text-sm font-semibold text-neutral-400 mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 relative overflow-x-hidden selection:bg-white/10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05] px-4 py-3 flex items-center justify-between transform-gpu">
        <h1 className="text-xl font-bold tracking-tight">All Series</h1>
        <button
          onClick={openBottomSheet}
          className={cn("p-2.5 rounded-full active:scale-95 transition-all shadow-lg", accentStyle.bg, "text-white")}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/[0.05] bg-[#0a0a0a]">
          {activeFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                if (f.id === "genre") { setSelectedGenre(""); setTempGenre(""); }
                if (f.id === "type") { setSelectedType(""); setTempType(""); }
                if (f.id === "status") { setSelectedStatus(""); setTempStatus(""); }
                if (f.id === "order") { setSelectedOrder("popular"); setTempOrder("popular"); }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-neutral-300 whitespace-nowrap active:scale-95 transition-all"
            >
              {f.label}
              <X className="w-3 h-3 text-neutral-500" />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : mangaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-4 border border-white/5">
              <SlidersHorizontal className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Tidak ada seri ditemukan</p>
            <p className="text-xs text-neutral-600 mt-1">Coba ubah filter Anda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {mangaList.map((manga, index) => (
                <div key={`${manga.slug}-${index}`} onClick={handleSaveScroll}>
                  <MangaCard item={manga} accentStyle={accentStyle} />
                </div>
              ))}
            </div>
            <div ref={lastElementRef} className="flex justify-center items-center py-10 h-20">
              {isFetchingNextPage && (
                <Loader2 className={cn("w-6 h-6 animate-spin", accentStyle.text)} />
              )}
              {!hasMore && mangaList.length > 0 && (
                <p className="text-[10px] font-medium text-neutral-500 bg-[#141414] px-4 py-2 rounded-full border border-white/5">
                  Semua data telah dimuat
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowFilters(false)}
          />
          <div className="relative w-full max-w-md bg-[#141414] border-t border-white/[0.05] rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Filter & Sort</h2>
              <button
                onClick={() => {
                  setTempGenre("");
                  setTempType("");
                  setTempStatus("");
                  setTempOrder("popular");
                }}
                className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
              <FilterSection title="Urutkan">
                <div className="flex flex-wrap gap-2">
                  {orderOptions.map((opt) => (
                    <Chip key={opt.value} active={tempOrder === opt.value} onClick={() => setTempOrder(opt.value)}>
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Tipe">
                <div className="flex flex-wrap gap-2">
                  {typeOptions.slice(1).map((opt) => (
                    <Chip
                      key={opt.value}
                      active={tempType === opt.value}
                      onClick={() => setTempType(tempType === opt.value ? "" : opt.value)}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Status">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.slice(1).map((opt) => (
                    <Chip
                      key={opt.value}
                      active={tempStatus === opt.value}
                      onClick={() => setTempStatus(tempStatus === opt.value ? "" : opt.value)}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Genre">
                <div className="grid grid-cols-3 gap-2">
                  {genres.map((g) => (
                    <Chip
                      key={g.id}
                      active={tempGenre === g.id}
                      onClick={() => setTempGenre(tempGenre === g.id ? "" : g.id)}
                    >
                      {g.name}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 rounded-xl bg-[#1c1c1c] text-white font-semibold text-sm active:scale-95 transition-all border border-white/5 hover:bg-[#262626]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setSelectedGenre(tempGenre);
                  setSelectedType(tempType);
                  setSelectedStatus(tempStatus);
                  setSelectedOrder(tempOrder);
                  setShowFilters(false);
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all shadow-lg text-white",
                  accentStyle.bg
                )}
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}