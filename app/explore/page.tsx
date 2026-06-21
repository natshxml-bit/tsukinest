// app/explore/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { useAccent } from "@/lib/accent";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Compass,
  Star,
  Clock,
  ImageIcon,
  Flame,
  AlertCircle,
  RefreshCw,
  Grid2x2,
  Grid3x3,
  ArrowUp,
  TrendingUp,
  ChevronRight,
  Heart,
  BookOpen,
} from "lucide-react";

const BASE_URL = "https://nest-network.up.railway.app";

let globalList: any[] = [];
let globalFeatured: any[] = [];
let globalStep = 0;
let globalScroll = 0;
let globalEmptyStrikes = 0;
let globalFilter: "all" | "manhwa" | "manhua" | "manga" = "all";
let globalGrid: 2 | 3 = 2;

const ROTATION_TYPES = ["manhwa", "manhua", "manga"];

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatTypeWithFlag(rawType: string): string {
  if (!rawType) return "🇯🇵 MANGA";
  const t = rawType.toUpperCase();
  if (t.includes("MANHWA")) return "🇰🇷 MANHWA";
  if (t.includes("MANHUA")) return "🇨🇳 MANHUA";
  if (t.includes("MANGA")) return "🇯🇵 MANGA";
  return t;
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["\']([^"\']+)["\']/i);
    if (match) finalUrl = match[1];
  }
  if (finalUrl.startsWith("http") && !finalUrl.includes("wsrv.nl") && !finalUrl.includes("anilist.co")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=400&output=webp&q=70`;
  }
  return finalUrl;
}

function getOriginalUrl(url: string): string {
  if (!url) return "";
  try {
    if (url.includes("wsrv.nl")) {
      const urlObj = new URL(url);
      const originalUrl = urlObj.searchParams.get("url");
      if (originalUrl) return decodeURIComponent(originalUrl);
    }
  } catch { /* ignore */ }
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["\']([^"\']+)["\']/i);
    if (match) finalUrl = match[1];
  }
  return finalUrl;
}

// ─── SMART IMAGE (Clean & Smooth) ───
const SmartImage = memo(function SmartImage({
  src, alt, title, fill, className = "", priority, ...props
}: any) {
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [loaded, setLoaded] = useState(false);
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false);
  const [hasTriedAniList, setHasTriedAniList] = useState(false);

  const fetchAniListFallback = async () => {
    if (hasTriedAniList) return;
    setHasTriedAniList(true);
    try {
      const cleanTitle = (title || "").split(/[-–—~,|:]/)[0].replace(/[★☆]/g, " ").trim();
      const query = `query ($search: String) { Media (search: $search, type: MANGA) { coverImage { extraLarge large } } }`;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search: cleanTitle } }),
      });
      if (!res.ok) { setImgSrc("/no-image.png"); return; }
      const json = await res.json();
      const altPoster = json?.data?.Media?.coverImage?.extraLarge || json?.data?.Media?.coverImage?.large;
      setImgSrc(altPoster || "/no-image.png");
    } catch { setImgSrc("/no-image.png"); }
  };

  useEffect(() => {
    setLoaded(false);
    const isPlaceholder = !src || src.includes("via.placeholder.com") || src.includes("no-image.png");
    if (isPlaceholder) fetchAniListFallback();
    else { setImgSrc(src); setHasTriedOriginal(false); setHasTriedAniList(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleLoad = () => setLoaded(true);

  const handleError = () => {
    if (imgSrc.includes("wsrv.nl") && !hasTriedOriginal) {
      setHasTriedOriginal(true);
      const original = getOriginalUrl(imgSrc);
      if (original && original !== imgSrc) { setImgSrc(original); return; }
    }
    fetchAniListFallback();
  };

  if (imgSrc === "/no-image.png" && loaded) {
    return (
      <div className={cn("bg-[#1c1c1c] flex flex-col items-center justify-center text-center p-2", fill ? "absolute inset-0 w-full h-full" : "w-full h-full", className)}>
        <ImageIcon className="text-neutral-700 w-6 h-6 mb-1" />
        <span className="text-[10px] text-neutral-600 font-medium line-clamp-2 px-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        fill ? "absolute inset-0 w-full h-full object-cover" : "",
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...(priority ? { fetchPriority: "high" as any } : {})}
      {...props}
    />
  );
});

// ─── SKELETON CARD ───
function SkeletonCard() {
  return (
    <div className="flex flex-col h-full">
      <div className="aspect-[2/3] w-full rounded-xl bg-[#1c1c1c] animate-pulse border border-white/[0.04]" />
      <div className="h-3 rounded-md bg-[#1c1c1c] w-3/4 animate-pulse mt-2.5" />
      <div className="h-2 rounded-md bg-[#1c1c1c] w-1/2 animate-pulse mt-1.5" />
    </div>
  );
}

// ─── FEATURED CARD ───
function FeaturedCard({ manga, accentStyle }: { manga: any; accentStyle: any }) {
  const cleanTitle = (manga.title || "").replace(/subtitle indonesia/i, "").trim();
  const thumbUrl = cleanThumb(manga.thumb);
  return (
    <Link href={`/detail/${manga.slug}`} className="block shrink-0 w-[65%] sm:w-[55%]">
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-[#1c1c1c] border border-white/[0.08] shadow-lg">
        <SmartImage src={thumbUrl} alt={cleanTitle} title={cleanTitle} fill loading="lazy" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={cn("px-2 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-wider", accentStyle.bg)}>
            🔥 TRENDING
          </span>
          {manga.rating && manga.rating !== "?" && (
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-black/70">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{manga.rating}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
            {formatTypeWithFlag(manga.type)}
          </span>
          <h4 className="text-white font-bold text-base leading-tight mt-1 line-clamp-2">
            {cleanTitle}
          </h4>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-white/80">
            <BookOpen className="w-3 h-3" />
            <span>{manga.latest_chapter}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── EXPLORE CARD ───
function ExploreCard({ 
  manga, 
  grid, 
  user,
  onRequireLogin 
}: { 
  manga: any; 
  grid: 2 | 3; 
  user: User | null;
  onRequireLogin: () => void;
}) {
  const cleanTitle = (manga.title || "").replace(/subtitle indonesia/i, "").trim();
  const thumbUrl = cleanThumb(manga.thumb);
  const typeLabel = formatTypeWithFlag(manga.type);
  const [liked, setLiked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
    if (!user || !manga.slug) {
      setLiked(false);
      return;
    }
    // 👇 UBAH DI SINI
    const docRef = doc(db, "users", user.uid, "likes", manga.slug);
    const unsub = onSnapshot(docRef, (docSnap) => {
      setLiked(docSnap.exists());
    });
    return () => unsub();
  }, [user, manga.slug]);


  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Munculkan Modal cantik jika belum login
    if (!user) {
      onRequireLogin();
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const docRef = doc(db, "users", user.uid, "likes", manga.slug);
      if (liked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          id: manga.slug,
          slug: manga.slug,
          title: cleanTitle,
          thumb: manga.thumb || "",
          type: manga.type || "manga",
          latest_chapter: manga.latest_chapter || "",
          savedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("Gagal menyimpan ke library:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <Link href={`/detail/${manga.slug}`} className="block h-full">
        <div className="flex flex-col h-full">
          <div className={cn(
            "relative overflow-hidden rounded-xl bg-[#1c1c1c] aspect-[2/3] mb-2 border border-white/[0.08]",
            grid === 3 && "rounded-lg"
          )}>
            <SmartImage src={thumbUrl} alt={cleanTitle} title={cleanTitle} fill loading="lazy" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 z-10">
              <span className="px-1.5 py-[2px] rounded-md text-[8px] font-bold text-white/90 uppercase bg-black/70 border border-white/10 tracking-wide pointer-events-none">
                {typeLabel}
              </span>
              <button
                type="button"
                onClick={handleLikeToggle}
                disabled={isProcessing}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  liked ? "bg-red-500 text-white" : "bg-black/60 text-white/70"
                )}
              >
                <Heart className={cn("w-3 h-3", liked && "fill-current")} />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 z-10">
              <div className="flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-black/70 border border-white/5 w-fit max-w-[90%]">
                <Clock className="w-2 h-2 text-neutral-400 shrink-0" />
                <span className="text-[9px] font-medium text-neutral-200 truncate">{manga.latest_chapter}</span>
              </div>
            </div>
          </div>
          <h4 className={cn("text-xs font-medium text-neutral-300 leading-snug line-clamp-2 min-h-[2.5rem]", grid === 3 && "text-[11px]")}>
            {cleanTitle}
          </h4>
        </div>
      </Link>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function ExplorePage() {
  const { accent, style: accentStyle } = useAccent();
  const [user, setUser] = useState<User | null>(null);

  const [mangaList, setMangaList] = useState<any[]>(globalList);
  const [featured, setFeatured] = useState<any[]>(globalFeatured);
  const [fetchStep, setFetchStep] = useState(globalStep);
  const [isLoading, setIsLoading] = useState(globalList.length === 0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(globalEmptyStrikes < 3);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<typeof globalFilter>(globalFilter);
  const [grid, setGrid] = useState<2 | 3>(globalGrid);
  const [showFab, setShowFab] = useState(false);
  
  // State untuk kontrol UI Modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastFetchedStep = useRef(-1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const transformItem = (item: any) => ({
    title: item.title || "Untitled",
    slug: item.slug || item.manga_id || "",
    thumb: item.thumb || item.thumbnail || item.cover_image_url || "",
    type: (item.type || "MANHWA").toUpperCase(),
    latest_chapter: item.chapter || item.latest_chapter || "Ch. ?",
    rating: item.rating && item.rating !== "0" ? String(item.rating) : null,
  });

  const mergeAndDedupe = (existingList: any[], newData: any[]) => {
    const combined = [...existingList, ...newData];
    return Array.from(new Map(combined.map((item) => [item.slug, item])).values());
  };

  useEffect(() => {
    if (globalList.length > 0 && globalScroll > 0) {
      const timer = setTimeout(() => window.scrollTo(0, globalScroll), 50);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (globalFeatured.length > 0) { setFeatured(globalFeatured); return; }
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/filter?order=top&type=manhwa&page=1`);
        const json = await res.json();
        let raw: any[] = [];
        if (json.data?.results) raw = json.data.results;
        else if (Array.isArray(json.data)) raw = json.data;
        else if (Array.isArray(json)) raw = json;
        const items = raw.slice(0, 6).map(transformItem);
        setFeatured(items);
        globalFeatured = items;
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (fetchStep === 0 && globalList.length > 0) { 
      setIsLoading(false);
      setMangaList(globalList);
      return; 
    }

    if (fetchStep <= lastFetchedStep.current) return;

    let isMounted = true;
    
    const fetchData = async () => {
      if (fetchStep === 0) setIsLoading(true); 
      else setIsFetchingNextPage(true);
      
      setError(false);

      let currentType: string;
      if (filter === "all") currentType = ROTATION_TYPES[fetchStep % 3];
      else currentType = filter;
      const currentPage = Math.floor(fetchStep / 3) + 1;

      try {
        const url = `${BASE_URL}/filter?order=popular&type=${currentType}&page=${currentPage}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        
        if (!isMounted) return;
        lastFetchedStep.current = fetchStep;

        let rawData: any[] = [];
        if (json.data && json.data.results) rawData = json.data.results;
        else if (json.data && Array.isArray(json.data)) rawData = json.data;
        else if (Array.isArray(json)) rawData = json;

        if (rawData.length > 0) {
          const transformedData = rawData.map(transformItem);
          setMangaList((prev) => { 
            const merged = mergeAndDedupe(prev, transformedData); 
            globalList = merged; 
            return merged; 
          });
          globalEmptyStrikes = 0;
        } else {
          globalEmptyStrikes += 1;
          if (globalEmptyStrikes >= 3) setHasMore(false);
          else setFetchStep((prev) => prev + 1);
        }
      } catch (err) {
        console.error(`Fetch error step ${fetchStep}:`, err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) { 
          setIsLoading(false); 
          setIsFetchingNextPage(false); 
          globalStep = fetchStep; 
        }
      }
    };
    
    fetchData();
    
    return () => { isMounted = false; };
  }, [fetchStep, filter]);

  const handleSaveScroll = () => { globalScroll = window.scrollY; };

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setFetchStep((prev) => prev + 1);
    }, { rootMargin: "400px" });
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasMore]);

  const handleFilterChange = (f: typeof globalFilter) => {
    setFilter(f); globalFilter = f;
    setMangaList([]); globalList = [];
    setFetchStep(0); globalStep = 0;
    setHasMore(true); globalEmptyStrikes = 0;
    lastFetchedStep.current = -1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGridChange = (g: 2 | 3) => { setGrid(g); globalGrid = g; };

  const loadingTypeInfo = (filter === "all" ? ROTATION_TYPES[fetchStep % 3] : filter).toUpperCase();

  const filterPills = [
    { key: "all", label: "Semua" },
    { key: "manhwa", label: "🇰🇷 Manhwa" },
    { key: "manhua", label: "🇨🇳 Manhua" },
    { key: "manga", label: "🇯🇵 Manga" },
  ] as const;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-28 overflow-x-hidden selection:bg-white/10">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05]">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accentStyle.bg)}>
            <Compass size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-semibold text-base leading-tight tracking-tight">Explore</h1>
            <p className="text-[11px] text-neutral-500 truncate">Temukan komik favoritmu</p>
          </div>
        </div>
      </header>

      <div className="fixed top-14 left-0 right-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05]">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filterPills.map((p) => {
            const active = filter === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handleFilterChange(p.key)}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border",
                  active
                    ? cn("text-white border-transparent", accentStyle.bg)
                    : "bg-white/[0.03] text-neutral-400 border-white/[0.08]"
                )}
              >
                {p.label}
              </button>
            );
          })}
          <div className="ml-auto shrink-0 flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full p-0.5">
            <button
              onClick={() => handleGridChange(2)}
              className={cn("p-1.5 rounded-full transition", grid === 2 ? "bg-white/10 text-white" : "text-neutral-500")}
            >
              <Grid2x2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleGridChange(3)}
              className={cn("p-1.5 rounded-full transition", grid === 3 ? "bg-white/10 text-white" : "text-neutral-500")}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <section className="pt-28 px-4 max-w-md mx-auto space-y-5">
        {!isLoading && featured.length > 0 && (
          <div className="-mx-4">
            <div className="px-4 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", accentStyle.bg)}>
                  <TrendingUp size={12} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm">Sedang Trending</h3>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-2">
              {featured.map((m, i) => (
                <div key={`${m.slug}-${i}`}>
                  <FeaturedCard manga={m} accentStyle={accentStyle} />
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div>
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", accentStyle.bg)}>
                  <Flame size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm leading-tight tracking-tight">Memuat...</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Mengambil komik untukmu</p>
                </div>
              </div>
            </div>
            <div className={cn("grid gap-3", grid === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#141414] rounded-2xl border border-white/[0.08]">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-red-500/20">
              <AlertCircle className="text-red-400 w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Gagal Memuat</h3>
            <p className="text-sm text-neutral-500 mb-5">Terjadi kesalahan saat mengambil data.</p>
            <button
              onClick={() => { setError(false); lastFetchedStep.current = fetchStep - 1; setFetchStep((prev) => prev); }}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95", accentStyle.bg)}
            >
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && !error && mangaList.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", accentStyle.bg)}>
                  <Flame size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm leading-tight tracking-tight">
                    {filter === "all" ? "Jelajahi Komik" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Populer`}
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Pilihan terbaik untukmu</p>
                </div>
              </div>
              <span className={cn("text-xs font-bold shrink-0 tabular-nums", accentStyle.text)}>{mangaList.length}</span>
            </div>
            <div className={cn("grid gap-3", grid === 2 ? "grid-cols-2" : "grid-cols-3 gap-2.5")}>
              {mangaList.map((manga, index) => (
                <div key={`${manga.slug}-${index}`} onClick={handleSaveScroll}>
                  {/* Parsing prop onRequireLogin ke ExploreCard */}
                  <ExploreCard 
                    manga={manga} 
                    grid={grid} 
                    user={user} 
                    onRequireLogin={() => setShowLoginModal(true)} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && mangaList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]">
              <Compass size={28} className="text-neutral-600" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Belum Ada Data</h3>
            <p className="text-xs text-neutral-500 max-w-[240px]">Geser ke bawah untuk memuat komik atau coba filter lainnya</p>
          </div>
        )}

        <div ref={lastElementRef} className="flex flex-col justify-center items-center py-10 h-24 gap-3">
          {isFetchingNextPage && (
            <>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn("w-1.5 h-1.5 rounded-full animate-pulse", accentStyle.bg)}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">Memuat {loadingTypeInfo}...</span>
            </>
          )}
          {!hasMore && mangaList.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span className={cn("w-1.5 h-1.5 rounded-full", accentStyle.bg)} />
              Semua komik sudah ditampilkan
            </div>
          )}
        </div>
      </section>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-4 z-30 w-11 h-11 rounded-full flex items-center justify-center border border-white/10 transition-all duration-300",
          accentStyle.bg,
          showFab ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ArrowUp className="w-4 h-4 text-white" />
      </button>

      {/* MODAL KETIKA BELUM LOGIN (Custom Pop Up) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/5 w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-5 ring-1", accentStyle.soft, accentStyle.border)}>
              <span className="text-4xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Akses Diblokir</h3>
            <p className="text-[13px] text-neutral-400 mb-7 leading-relaxed px-2">
              Silakan masuk (Log In) untuk menggunakan fitur simpan ke Library.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link href="/profile" className="w-full">
                <button className={cn("w-full py-3.5 rounded-2xl text-white text-[13px] font-bold transition-all active:scale-95", accentStyle.bg, accentStyle.glow)}>
                  Masuk ke Akun
                </button>
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3.5 rounded-2xl bg-white/5 text-white text-[13px] font-bold transition-all hover:bg-white/10 active:scale-95"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
