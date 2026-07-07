"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  Star,
  Clock,
  Flame,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { searchManga, type MangaItem } from "@/lib/api";
import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { cleanThumb } from "@/utils/image";
import SmartImage from "@/components/ui/SmartImage";
import { SkeletonCardGrid } from "@/components/ui/SkeletonCard";

function transformItem(item: Record<string, unknown>): MangaItem {
  return {
    title: typeof item.title === "string" ? item.title : "Untitled",
    slug: typeof item.slug === "string" ? item.slug : typeof item.manga_id === "string" ? item.manga_id : "",
    thumb: cleanThumb(typeof item.thumb === "string" ? item.thumb : typeof item.cover_image_url === "string" ? item.cover_image_url : ""),
    type: (typeof item.type === "string" ? item.type : "MANHWA").toUpperCase(),
    latest_chapter: typeof item.chapter === "string" ? item.chapter : typeof item.latest_chapter === "string" ? item.latest_chapter : "Ch. ?",
    rating: item.rating ? String(item.rating) : "0",
    link: typeof item.link === "string" ? item.link : "",
    is_colored: false,
    is_hot: false,
  };
}

function SearchCard({ item, accentStyle }: { item: MangaItem; accentStyle: { bg: string; text: string; focusRing: string } }) {
  return (
    <Link href={`/manga/${item.slug}`} className="block h-full active:scale-95 transition-transform duration-150">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-2xl bg-[#141414] aspect-[3/4] mb-2 border border-white/[0.08] shadow-xl shadow-black/40 group">
          <SmartImage
            src={item.thumb || "/no-image.png"}
            alt={item.title}
            title={item.title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase shadow-sm border border-white/10", accentStyle.bg)}>
              {item.type}
            </span>
            {item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 shadow-lg shrink-0">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-bold text-white">{item.rating}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 shadow-lg min-w-0 w-fit">
              <Clock className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
              <span className="text-[9px] font-medium text-white truncate">{item.latest_chapter}</span>
            </div>
          </div>
        </div>
        <h4 className="text-xs font-medium text-neutral-300 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-white transition-colors">
          {item.title}
        </h4>
      </div>
    </Link>
  );
}

function SearchContent() {
  const { style: accentStyle } = useAccent();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [results, setResults] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    async function fetchSearchData() {
      if (!submittedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        setError(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      setError(false);
      try {
        const res = await searchManga(submittedQuery) as unknown as Record<string, unknown>;
        let rawData: Record<string, unknown>[] = [];
        if (res && (res.success || res.message === "success" || res.status === "success")) {
          if (Array.isArray(res.data)) rawData = res.data as Record<string, unknown>[];
          else if (res.data && Array.isArray((res.data as Record<string, unknown>).data)) rawData = (res.data as Record<string, unknown[]>).data as Record<string, unknown>[];
          else if (res.data && Array.isArray((res.data as Record<string, unknown>).results)) rawData = (res.data as Record<string, unknown[]>).results as Record<string, unknown>[];
        }
        setResults(rawData.map(transformItem));
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSearchData();
  }, [submittedQuery]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-28 overflow-x-hidden selection:bg-white/10">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 hover:bg-[#262626] active:scale-95 transition-all duration-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 relative">
            <Search size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", accentStyle.text)} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setSubmittedQuery(query); inputRef.current?.blur(); }
              }}
              placeholder="Cari manga, manhwa, manhua..."
              className={cn("w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all", accentStyle.focusRing)}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSubmittedQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 active:scale-90 transition"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-md mx-auto space-y-6">
        {!hasSearched && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", accentStyle.soft)}>
              <Search size={24} className={accentStyle.text} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Cari Komik Favoritmu</h3>
            <p className="text-xs text-neutral-500">Ketik judul seri dan tekan Enter</p>
          </div>
        )}

        {loading && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", accentStyle.bg)}>
                <Flame size={14} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base leading-tight">Mencari...</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Memuat hasil pencarian</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCardGrid key={i} />)}
            </div>
          </>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#141414] rounded-2xl border border-white/[0.08] shadow-xl shadow-black/40">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-red-500/20">
              <AlertCircle className="text-red-400 w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Gagal Memuat</h3>
            <p className="text-sm text-neutral-500 mb-5">Terjadi kesalahan saat mencari data.</p>
            <button
              onClick={() => setSubmittedQuery(query)}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95", accentStyle.bg)}
            >
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]">
              <Search size={24} className="text-neutral-600" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Data Tidak Ditemukan</h3>
            <p className="text-xs text-neutral-500">Coba ubah kata kunci pencarian</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", accentStyle.bg)}>
                  <Flame size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-base leading-tight tracking-tight">Hasil Pencarian</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {results.length} komik untuk &quot;{submittedQuery}&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((item, i) => (
                <SearchCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
