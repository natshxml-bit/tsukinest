"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, X, Loader2, Star, Clock } from "lucide-react";

import { searchManga, type MangaItem } from "@/lib/api"; 
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return url;
}

function transformItem(item: any): MangaItem {
  return {
    ...item,
    title: item.title || "",
    slug: item.slug || "",
    thumb: cleanThumb(item.thumb),
    type: item.type?.split(/\s+/)[0] || "MANGA", 
    latest_chapter: item.chapter || item.latest_chapter || "-", 
    rating: item.rating || "0",
  };
}

// ─── KOMPONEN KARTU PENCARIAN ───
// 👈 Terima props accent & accentStyle biar tetep dapet warna dinamis
function SearchCard({ item, accent, accentStyle }: { item: MangaItem; accent: string; accentStyle: any }) {
  const thumb = cleanThumb(item.thumb);
  return (
    <Link
      href={`/detail/${item.slug}`}
      className="group block relative overflow-hidden transform-gpu active:scale-95 transition-transform duration-150"
    >
      <div className={`relative overflow-hidden rounded-xl bg-gray-900 border border-white/5 aspect-[3/4] transition-colors ${accent === 'custom' ? 'group-hover:border-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'group-hover:border-')}`}>
        <Image
          src={thumb || "/no-image.png"}
          alt={item.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-transparent to-transparent" />
        
        <div className="absolute top-2 left-2">
          <span className={`px-1.5 py-0.5 rounded ${accentStyle.bg} text-[10px] font-bold text-white uppercase shadow-sm`}>
            {item.type}
          </span>
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] font-bold text-white">{item.rating}</span>
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 drop-shadow-md">
          <Clock className={`w-3 h-3 ${accentStyle.text} flex-shrink-0`} />
          <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{item.latest_chapter}</span>
        </div>
      </div>
      <div className="mt-2 px-1">
        <h4 className={`font-semibold text-gray-100 text-xs leading-snug line-clamp-2 transition-colors ${accent === 'custom' ? 'group-hover:text-[var(--tsuki-custom-hex)]' : accentStyle.text.replace('text-', 'group-hover:text-')}`}>
          {item.title}
        </h4>
      </div>
    </Link>
  );
}

// ─── HALAMAN UTAMA PENCARIAN ───
export default function SearchPage() {
  const { accent, style: accentStyle } = useAccent(); // 👈 PANGGIL HOOK ACCENT

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  
  const [results, setResults] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    async function fetchSearchData() {
      if (!submittedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      
      try {
        const res = await searchManga(submittedQuery);
        
        if (res && res.success && res.data) {
          const formattedData = res.data.map(transformItem);
          setResults(formattedData);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Kesalahan sistem saat pengambilan data pencarian:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchData();
  }, [submittedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSubmittedQuery(query);
      inputRef.current?.blur(); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24">
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/5 pt-4 pb-3 px-4 transform-gpu">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/5 hover:bg-white/10 transition-colors active:scale-90 flex-shrink-0 transform-gpu"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${accentStyle.text}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Masukkan kriteria pencarian..."
              className={`w-full bg-[#1e1e24] border border-white/5 ${accentStyle.focusRing} rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setSubmittedQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 active:scale-90 transition transform-gpu"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        
        {!hasSearched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center border border-white/5 mb-2">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Inisialisasi Pencarian
            </p>
            <p className="text-gray-500 text-xs">
              Masukkan judul seri untuk memulai kueri pencarian.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className={`w-8 h-8 ${accentStyle.text} animate-spin mb-4`} />
            <p className="text-xs text-gray-400 animate-pulse">Menyinkronkan data...</p>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
            <p className="text-gray-300 text-base font-bold">Data Tidak Ditemukan</p>
            <p className="text-gray-500 text-xs">Silakan ubah parameter pencarian Anda.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <span>Menampilkan kueri untuk</span>
              <span className={`${accentStyle.text} px-2 py-0.5 ${accentStyle.soft} rounded-md`}>
                &quot;{submittedQuery}&quot;
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((item, idx) => (
                <SearchCard key={item.slug || idx} item={item} accent={accent} accentStyle={accentStyle} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
