"use client";

import { useEffect, useState, use, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccent } from "@/lib/accent";
import { ArrowLeft, Star, Clock, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

const BASE_URL = "https://nest-network.up.railway.app";

// ─── UTILS ───
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Jurus 1: Balikin URL wsrv.nl ke aslinya kalau server nolak kompresi
function getOriginalUrl(url: string): string {
  if (!url) return "";
  try {
    if (url.includes("wsrv.nl")) {
      const urlObj = new URL(url);
      const originalUrl = urlObj.searchParams.get("url");
      if (originalUrl) return decodeURIComponent(originalUrl);
    }
  } catch {
    // ignore
  }
  return url;
}

// Jurus 2: Kompres gambar biar scroll super licin & RAM HP aman
function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  
  // Paksa resize & kompres jadi WebP 
  if (finalUrl.startsWith("http") && !finalUrl.includes("wsrv.nl") && !finalUrl.includes("anilist.co")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=300&output=webp&q=70`;
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

// ─── SMART IMAGE ───
const SmartImage = memo(function SmartImage({
  src,
  alt,
  title,
  fill,
  className = "",
  priority,
  unoptimized, 
  sizes,       
  ...props
}: any) {
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false);
  const [hasTriedAniList, setHasTriedAniList] = useState(false);

  const fetchAniListFallback = async () => {
    if (hasTriedAniList) return;
    setHasTriedAniList(true);

    try {
      const cleanTitle = title.split(/[-–—~,|:]/)[0].replace(/[★☆]/g, " ").trim();
      const query = `
        query ($search: String) {
          Media (search: $search, type: MANGA) {
            coverImage {
              extraLarge
              large
            }
          }
        }
      `;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search: cleanTitle } })
      });
      
      if (!res.ok) {
        setImgSrc("/no-image.png");
        return;
      }
      
      const json = await res.json();
      const coverImage = json?.data?.Media?.coverImage;
      const altPoster = coverImage?.extraLarge || coverImage?.large;

      if (altPoster) {
        setImgSrc(altPoster);
      } else {
        setImgSrc("/no-image.png");
      }
    } catch (error) {
      setImgSrc("/no-image.png");
    }
  };

  useEffect(() => {
    const isPlaceholder = 
      !src || 
      src.includes("via.placeholder.com") || 
      src.includes("no-image.png") ||
      title?.toLowerCase().includes("lookism");

    if (isPlaceholder) {
      fetchAniListFallback();
    } else {
      setImgSrc(src);
      setHasTriedOriginal(false);
      setHasTriedAniList(false);
    }
  }, [src, title]);

  const handleError = () => {
    if (imgSrc.includes("wsrv.nl") && !hasTriedOriginal) {
      setHasTriedOriginal(true);
      const original = getOriginalUrl(imgSrc);
      if (original && original !== imgSrc) {
        setImgSrc(original);
        return;
      }
    }
    fetchAniListFallback();
  };

  if (imgSrc === "/no-image.png") {
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
      onError={handleError}
      className={cn(fill ? "absolute inset-0 w-full h-full object-cover" : "", className)}
      {...(priority ? { fetchPriority: "high" as any } : {})}
      {...props}
    />
  );
});

// ─── KOMPONEN KARTU ───
const MangaCard = memo(function MangaCard({
  item,
  accentStyle,
}: {
  item: any;
  accentStyle: any;
}) {
  const thumb = cleanThumb(item.thumb || item.thumbnail);
  const formattedType = formatMangaType(item.type);
  const cleanTitle = (item.title || "").replace(/subtitle indonesia/i, '').trim();

  return (
    <Link href={`/manga/${item.slug}`} className="block h-full active:scale-95 transition-transform duration-150 transform-gpu">
      <div className="flex flex-col h-full">
        {/* Hapus ring, ganti border, tambah transform-gpu */}
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2 border border-white/[0.04] transform-gpu">
          <SmartImage
            src={thumb}
            alt={cleanTitle}
            title={cleanTitle}
            fill
            loading="lazy"
            decoding="async"
            // Tambah will-change-transform biar hover-nya enteng
            className="object-cover transition-transform duration-500 hover:scale-105 will-change-transform"
          />
          {/* Sederhanakan gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Top: Type (kiri) + Rating (kanan) */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            {/* Hapus backdrop-blur, pakai solid bg-black/80 */}
            <div className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white/90 uppercase max-w-[60%] truncate">
              {formattedType}
            </div>

            {item.rating && item.rating !== "0" && item.rating !== "?" && item.rating !== "N/A" && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 shrink-0">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white/90">{item.rating}</span>
              </div>
            )}
          </div>

          {/* Bottom: Chapter */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 min-w-0">
              <Clock className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
              <span className="text-[10px] font-medium text-white/90 truncate">{item.latest_chapter || item.chapter || 'Ch. ?'}</span>
            </div>
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase", accentStyle.bg)}>
              NEW
            </span>
          </div>
        </div>

        <h4 className="text-xs font-medium text-neutral-300 leading-snug line-clamp-2 mt-1 group-hover:text-white transition-colors">
          {cleanTitle}
        </h4>
      </div>
    </Link>
  );
});

// ─── SKELETON KARTU ───
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] w-full rounded-xl bg-[#1c1c1c] animate-pulse border border-white/[0.04]" />
      <div className="h-3.5 bg-[#1c1c1c] rounded-md w-full animate-pulse" />
      <div className="h-3.5 bg-[#1c1c1c] rounded-md w-2/3 animate-pulse" />
    </div>
  );
}

// ─── HALAMAN UTAMA LATEST ───
export default function LatestPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>; 
}) {
  const { accent, style: accentStyle } = useAccent();
  const router = useRouter();
  const params = use(searchParams);
  const currentPage = Number(params.page) || 1;
  
  const [comics, setComics] = useState<any[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    setLoading(true);
    setError(false);

    fetch(`${BASE_URL}/latest?page=${currentPage}`)
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(json => {
        let results = [];
        if (json.success && json.data && json.data.results) {
          results = json.data.results;
        } else if (json.data && Array.isArray(json.data)) {
          results = json.data;
        } else if (Array.isArray(json)) {
          results = json;
        }

        setComics(results);
        
        if (json.data?.pagination) {
          setHasNext(json.data.pagination.has_next);
        } else {
          setHasNext(results.length >= 10);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Gagal ambil data latest", err);
        setError(true);
        setLoading(false);
      });
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-28 font-sans selection:bg-white/10 overflow-x-hidden">
      
      {/* HEADER: Ganti backdrop-blur-xl jadi sm biar lebih enteng */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.05] transform-gpu">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5 text-neutral-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg)}>
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight">Episode Terbaru</h1>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-4 pt-5 max-w-md mx-auto">
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Update Terkini</h2>
            <p className="text-[11px] text-neutral-500 font-medium">Jangan sampai ketinggalan chapter</p>
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
             <button onClick={() => window.location.reload()} className={cn("px-5 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95", accentStyle.bg)}>
               Coba Lagi
             </button>
           </div>
        )}

        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
            ) : comics.length > 0 ? (
              comics.map((item: any, i: number) => (
                <MangaCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />
              ))
            ) : (
              <div className="col-span-2 md:col-span-3 flex flex-col items-center py-20 text-neutral-500">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada update terbaru.</p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && comics.length > 0 && (
          <div className="flex justify-between items-center mt-10 mb-6 bg-[#141414] p-2 rounded-2xl border border-white/[0.05]">
            <Link 
              href={currentPage > 1 ? `/latest?page=${currentPage - 1}` : "#"}
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
              <span className={cn("text-sm font-extrabold", accentStyle.text)}>
                {currentPage}
              </span>
            </div>
            
            <Link 
              href={hasNext ? `/latest?page=${currentPage + 1}` : "#"}
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
