"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Loader2, ImageIcon, Star, Clock } from "lucide-react";
import { useAccent } from "@/lib/accent";

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

const BASE_URL = "https://nest-network.up.railway.app";
const KITSU_CACHE_KEY = "tsukinest_kitsu_cache_v1";
const JIKAN_CACHE_KEY = "tsukinest_jikan_cache_v1";
const ANILIST_CACHE_KEY = "tsukinest_anilist_cache_v1";

let globalList: MangaItem[] = [];
let globalPage = 1;
let globalScroll = 0;
let globalFilters = {
  genre: "",
  type: "",
  status: "",
  order: "popular",
};

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

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  return finalUrl;
}

function formatMangaType(rawType: string): string {
  if (!rawType) return "MANGA";
  const typeUpper = rawType.toUpperCase();
  if (typeUpper.includes("MANHWA")) return "🇰🇷 " + typeUpper;
  if (typeUpper.includes("MANHUA")) return "🇨🇳 " + typeUpper;
  if (typeUpper.includes("MANGA")) return "🇯🇵 " + typeUpper;
  return typeUpper;
}

/* ─── Rate Limiter ─── */
class RateLimiter {
  private queue: { fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }[] = [];
  private active = 0;
  constructor(private max = 2, private interval = 800) {}

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.active >= this.max || this.queue.length === 0) return;
    this.active++;
    const { fn, resolve, reject } = this.queue.shift()!;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.active--;
      setTimeout(() => this.process(), this.interval);
    }
  }
}

const kitsuLimiter = new RateLimiter(10, 100);   // 100 req/10s
const jikanLimiter = new RateLimiter(2, 400);    // 3 req/s
const anilistLimiter = new RateLimiter(2, 1000); // 90 req/menit

/* ─── Cache ─── */
function getCache(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(storeKey: string, title: string, value: string) {
  try {
    const cache = getCache(storeKey);
    cache[title] = value;
    localStorage.setItem(storeKey, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function getCached(storeKey: string, title: string): string | null {
  return getCache(storeKey)[title] || null;
}

/* ─── Title Cleaner ─── */
function sanitizeTitle(title: string): string {
  return (title || "")
    .replace(/subtitle\s*indonesia/gi, "")
    .replace(/\b(ch\.?|chapter|vol\.?|volume|bahasa|season|part)\b.*$/i, "")
    .replace(/[★☆♡♥]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeForJikan(title: string): string {
  let t = sanitizeTitle(title);
  // Jikan sensitive ke special chars & panjang
  t = t.replace(/[^\w\s\-]/g, " ").replace(/\s+/g, " ").trim();
  return t.substring(0, 50).trim();
}

/* ─── API Fetchers ─── */

// Tier 2: Kitsu (100 req/10s, CORS open)
async function fetchKitsu(title: string): Promise<string | null> {
  const cleanTitle = sanitizeTitle(title);
  if (!cleanTitle) return null;

  const cached = getCached(KITSU_CACHE_KEY, cleanTitle);
  if (cached) return cached;

  return kitsuLimiter.enqueue(async () => {
    const res = await fetch(
      `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=1`,
      { headers: { Accept: "application/vnd.api+json" } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const poster = json?.data?.[0]?.attributes?.posterImage;
    const img = poster?.large || poster?.medium || poster?.original || poster?.small;
    if (img) setCache(KITSU_CACHE_KEY, cleanTitle, img);
    return img || null;
  });
}

// Tier 3: Jikan (3 req/s, CORS open)
async function fetchJikan(title: string): Promise<string | null> {
  const cleanTitle = sanitizeForJikan(title);
  if (!cleanTitle) return null;

  const cached = getCached(JIKAN_CACHE_KEY, cleanTitle);
  if (cached) return cached;

  return jikanLimiter.enqueue(async () => {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(cleanTitle)}&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const img = json?.data?.[0]?.images?.jpg?.large_image_url || json?.data?.[0]?.images?.jpg?.image_url;
    if (img) setCache(JIKAN_CACHE_KEY, cleanTitle, img);
    return img || null;
  });
}

// Tier 4: AniList (90 req/menit, CORS strict)
async function fetchAniList(title: string): Promise<string | null> {
  const cleanTitle = sanitizeTitle(title);
  if (!cleanTitle) return null;

  const cached = getCached(ANILIST_CACHE_KEY, cleanTitle);
  if (cached) return cached;

  return anilistLimiter.enqueue(async () => {
    const query = `
      query ($search: String) {
        Media(search: $search, type: MANGA) {
          coverImage { extraLarge large }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search: cleanTitle } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const img = json?.data?.Media?.coverImage?.extraLarge || json?.data?.Media?.coverImage?.large;
    if (img) setCache(ANILIST_CACHE_KEY, cleanTitle, img);
    return img || null;
  });
}

/* ─── SMART IMAGE (4-Tier Fallback) ─── */
const SmartImage = memo(function SmartImage({
  src,
  alt,
  title,
  fill,
  className = "",
  priority,
  ...props
}: any) {
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [fallbackTier, setFallbackTier] = useState<"original" | "kitsu" | "jikan" | "anilist" | "failed">("original");
  const fetchingRef = useRef(false);

  const isPlaceholder =
    !src ||
    src.includes("via.placeholder.com") ||
    src.includes("no-image.png") ||
    src === "/no-image.png";

  const runFallback = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Tier 2: Kitsu (rate limit tinggi, CORS open)
      if (fallbackTier === "original" || fallbackTier === "kitsu") {
        setFallbackTier("kitsu");
        const kitsuImg = await fetchKitsu(title);
        if (kitsuImg) {
          setImgSrc(kitsuImg);
          fetchingRef.current = false;
          return;
        }
      }

      // Tier 3: Jikan
      if (fallbackTier !== "jikan" && fallbackTier !== "anilist" && fallbackTier !== "failed") {
        setFallbackTier("jikan");
        const jikanImg = await fetchJikan(title);
        if (jikanImg) {
          setImgSrc(jikanImg);
          fetchingRef.current = false;
          return;
        }
      }

      // Tier 4: AniList (last resort, CORS strict)
      if (fallbackTier !== "failed") {
        setFallbackTier("anilist");
        const anilistImg = await fetchAniList(title);
        if (anilistImg) {
          setImgSrc(anilistImg);
          fetchingRef.current = false;
          return;
        }
      }

      setFallbackTier("failed");
      setImgSrc("/no-image.png");
    } catch {
      setFallbackTier("failed");
      setImgSrc("/no-image.png");
    } finally {
      fetchingRef.current = false;
    }
  }, [title, fallbackTier]);

  useEffect(() => {
    if (isPlaceholder) {
      if (!fetchingRef.current) runFallback();
    } else {
      setImgSrc(src);
      setFallbackTier("original");
      fetchingRef.current = false;
    }
  }, [src, title, isPlaceholder, runFallback]);

  const handleError = () => {
    if (!fetchingRef.current) runFallback();
  };

  if (imgSrc === "/no-image.png") {
    return (
      <div className={cn("bg-[#1c1c1c] flex flex-col items-center justify-center text-center p-2", fill ? "absolute inset-0 w-full h-full" : "w-full h-full", className)}>
        <ImageIcon className="text-neutral-700 w-5 h-5 mb-1" />
        <span className="text-[9px] text-neutral-500 font-medium line-clamp-2 px-1 leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={cn(fill ? "absolute inset-0 w-full h-full object-cover" : "", className)}
      {...(priority ? { fetchPriority: "high" as any } : {})}
      {...props}
    />
  );
});

/* ─── KOMPONEN KARTU ─── */
const MangaCard = memo(function MangaCard({
  item,
  accentStyle,
}: {
  item: MangaItem;
  accentStyle: any;
}) {
  const thumb = cleanThumb(item.thumb);
  const formattedType = formatMangaType(item.type);
  const cleanTitle = (item.title || "").replace(/subtitle indonesia/i, "").trim();

  return (
    <Link href={`/detail/${item.slug}`} className="block h-full active:scale-95 transition-transform duration-150 transform-gpu">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2 border border-white/[0.04] transform-gpu">
          <SmartImage
            src={thumb}
            alt={cleanTitle}
            title={cleanTitle}
            fill
            loading="lazy"
            decoding="async"
            className="object-cover transition-transform duration-500 hover:scale-105 will-change-transform"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            <div className="px-1.5 py-[2px] rounded bg-black/80 text-[8px] font-bold text-white/90 uppercase max-w-[60%] truncate">
              {formattedType}
            </div>
            {item.rating && item.rating !== "0" && item.rating !== "?" && item.rating !== "N/A" && (
              <div className="flex items-center gap-0.5 px-1.5 py-[2px] rounded bg-black/80 shrink-0">
                <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-bold text-white/90">{item.rating}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-[2px] rounded bg-black/80 min-w-0">
              <Clock className="w-2 h-2 text-neutral-400 shrink-0" />
              <span className="text-[9px] font-medium text-white/90 truncate">{item.latest_chapter || "Ch. ?"}</span>
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

/* ─── SKELETON KARTU ─── */
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] w-full rounded-xl bg-[#1c1c1c] animate-pulse border border-white/[0.04]" />
      <div className="h-3 bg-[#1c1c1c] rounded-md w-full animate-pulse" />
      <div className="h-3 bg-[#1c1c1c] rounded-md w-2/3 animate-pulse" />
    </div>
  );
}

export default function AllSeriesPage() {
  const { accent, style: accentStyle } = useAccent();

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

  const transformItem = useCallback((item: any): MangaItem => {
    const formatType =
      item.taxonomy?.Format?.[0]?.name?.toUpperCase() ||
      item.type?.split(/\s+/)?.[0]?.toUpperCase() ||
      "MANHWA";

    const rawThumb =
      item.cover_image_url ||
      item.cover_portrait_url ||
      item.thumb ||
      item.thumbnail ||
      item.image ||
      item.poster ||
      item.cover ||
      item.featured_image ||
      item.meta?.image ||
      "";

    return {
      title: item.title || "Untitled",
      slug: item.manga_id || item.slug || "",
      thumb: cleanThumb(rawThumb),
      type: formatType,
      latest_chapter: item.latest_chapter_number
        ? `Ch. ${item.latest_chapter_number}`
        : item.chapter || item.latest_chapter || "Ch. ?",
      rating: item.user_rate
        ? String(item.user_rate)
        : item.rating
          ? String(item.rating)
          : "0",
      link: item.link || "",
      is_colored: false,
      is_hot: false,
    };
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${BASE_URL}/genres`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        let raw: any[] = [];
        if (Array.isArray(json)) raw = json;
        else if (json?.data && Array.isArray(json.data)) raw = json.data;
        else if (json?.genres && Array.isArray(json.genres)) raw = json.genres;
        const normalized = raw
          .map((g: any) => ({
            id: String(g.id || g.slug || g.value || g.name || ""),
            name: g.name || g.title || g.label || "Unknown",
          }))
          .filter((g: any) => g.id && g.name);
        setGenres(normalized.length > 0 ? normalized : []);
      } catch (err) {
        console.error("Genres fetch error:", err);
      }
    };
    fetchGenres();
  }, []);

  const fetchManga = useCallback(
    async (pageNum: number, resetList = false) => {
      if (!resetList && pageNum === lastFetchedPageRef.current) return;
      if (pageNum < 1) return;
      if (resetList) setIsLoading(true);
      else setIsFetchingNextPage(true);

      try {
        const params: string[] = [];
        if (selectedGenre) params.push(`genre[]=${encodeURIComponent(selectedGenre)}`);
        if (selectedType) params.push(`type=${encodeURIComponent(selectedType)}`);
        if (selectedStatus) params.push(`status=${encodeURIComponent(selectedStatus)}`);
        if (selectedOrder) params.push(`order=${encodeURIComponent(selectedOrder)}`);
        params.push(`page=${pageNum}`);

        const url = `${BASE_URL}/filter?${params.join("&")}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        let rawData: any[] = [];
        let pagination: any = null;

        if (json?.data?.results && Array.isArray(json.data.results)) {
          rawData = json.data.results;
          pagination = json.data.pagination;
        } else if (json?.results && Array.isArray(json.results)) {
          rawData = json.results;
          pagination = json.pagination;
        } else if (json?.data?.comics && Array.isArray(json.data.comics)) {
          rawData = json.data.comics;
        } else if (Array.isArray(json)) {
          rawData = json;
        }

        const transformed = rawData.map(transformItem);

        if (resetList) {
          const unique = Array.from(new Map(transformed.map((item) => [item.slug, item])).values());
          globalList = unique;
          setMangaList(unique);
          setHasMore(pagination?.has_next ?? rawData.length > 0);
          lastFetchedPageRef.current = pageNum;
          globalPage = pageNum;
        } else {
          const prevList = globalList;
          const combined = [...prevList, ...transformed];
          const unique = Array.from(new Map(combined.map((item) => [item.slug, item])).values());
          const gotNewItems = unique.length > prevList.length;
          globalList = unique;
          setMangaList(unique);
          setHasMore(pagination?.has_next ?? (gotNewItems && rawData.length > 0));
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
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [selectedGenre, selectedType, selectedStatus, selectedOrder, transformItem]
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
  ].filter(Boolean);

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
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05] px-4 py-3 flex items-center justify-between transform-gpu">
        <h1 className="text-xl font-bold tracking-tight">All Series</h1>
        <button
          onClick={openBottomSheet}
          className={cn(
            "p-2.5 rounded-full active:scale-95 transition-all shadow-lg",
            accentStyle.bg, "text-white"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/[0.05] bg-[#0a0a0a]">
          {activeFilters.map((f: any) => (
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

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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

      {showFilters && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowFilters(false)} />
          <div className="relative w-full max-w-md bg-[#141414] border-t border-white/[0.05] rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Filter & Sort</h2>
              <button
                onClick={() => { setTempGenre(""); setTempType(""); setTempStatus(""); setTempOrder("popular"); }}
                className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
              <FilterSection title="Urutkan">
                <div className="flex flex-wrap gap-2">
                  {orderOptions.map((opt) => (
                    <Chip key={opt.value} active={tempOrder === opt.value} onClick={() => setTempOrder(opt.value)}>{opt.label}</Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Tipe">
                <div className="flex flex-wrap gap-2">
                  {typeOptions.slice(1).map((opt) => (
                    <Chip key={opt.value} active={tempType === opt.value} onClick={() => setTempType(tempType === opt.value ? "" : opt.value)}>{opt.label}</Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Status">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.slice(1).map((opt) => (
                    <Chip key={opt.value} active={tempStatus === opt.value} onClick={() => setTempStatus(tempStatus === opt.value ? "" : opt.value)}>{opt.label}</Chip>
                  ))}
                </div>
              </FilterSection>
              <FilterSection title="Genre">
                <div className="grid grid-cols-3 gap-2">
                  {genres.map((g) => (
                    <Chip key={g.id} active={tempGenre === g.id} onClick={() => setTempGenre(tempGenre === g.id ? "" : g.id)}>{g.name}</Chip>
                  ))}
                </div>
              </FilterSection>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 rounded-xl bg-[#1c1c1c] text-white font-semibold text-sm active:scale-95 transition-all border border-white/5 hover:bg-[#262626]">Batal</button>
              <button
                onClick={() => { setSelectedGenre(tempGenre); setSelectedType(tempType); setSelectedStatus(tempStatus); setSelectedOrder(tempOrder); setShowFilters(false); }}
                className={cn("flex-1 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all shadow-lg text-white", accentStyle.bg)}
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
