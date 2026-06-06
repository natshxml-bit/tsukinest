"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

const BASE_URL = "https://cnest.up.railway.app";

function cleanThumb(url: string): string {
  if (!url) return "";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return url;
}

export default function LatestPage({
  searchParams,
}: {
  // MANTRA 2: Di Next.js 15+, searchParams itu Promise
  searchParams: Promise<{ page?: string }>; 
}) {
  const { accent, style: accentStyle } = useAccent(); // 👈 PANGGIL HOOK
  const params = use(searchParams);
  const currentPage = Number(params.page) || 1;
  
  const [latestComics, setLatestComics] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/latest?page=${currentPage}`)
      .then(res => res.json())
      .then(json => {
        setLatestComics(json.data?.results || json.data || []);
        setTotalPages(json.data?.pagination?.total || 100);
        setLoading(false);
      })
      .catch(error => {
        console.error("Gagal ambil data latest", error);
        setLoading(false);
      });
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-[#0F0F12] text-white pb-28 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0F0F12]/95 p-4 border-b border-white/5 flex items-center gap-3">
        <Link href="/" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition active:scale-95">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
           Episode Terbaru
        </h1>
      </header>

      {/* GRID LIST */}
      <section className="p-4 max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className={`w-8 h-8 border-4 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
           </div>
        ) : latestComics.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Data tidak ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {latestComics.map((item: any, index: number) => {
              const thumbUrl = cleanThumb(item.thumb); 
              const cleanTitle = (item.title || "").replace(/subtitle indonesia/i, '').trim();
              
              return (
                <Link href={`/detail/${item.slug}`} key={index} className="flex flex-col gap-2 group active:scale-95 transition-transform duration-150">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#1e1e24] border border-white/5">
                    <Image
                      src={thumbUrl || "/no-image.png"}
                      alt={cleanTitle}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

                    {/* TIPE MENGGUNAKAN ACCENT */}
                    <div className={`absolute top-2 left-2 ${accentStyle.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow`}>
                      {item.type?.toUpperCase() || 'MANHWA'}
                    </div>

                    {item.rating && item.rating !== "0" && item.rating !== "N/A" && (
                      <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        ⭐ {item.rating}
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 bg-black/80 text-gray-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                        {item.chapter || item.latest_chapter || 'Ch. 0'}
                    </div>
                  </div>

                  <h3 className={`text-sm font-bold line-clamp-2 leading-snug transition-colors text-white/95 ${accent === 'custom' ? 'group-hover:text-[var(--tsuki-custom-hex)]' : accentStyle.text.replace('text-', 'group-hover:text-')}`}>
                    {cleanTitle}
                  </h3>
                </Link>
              )
            })}
          </div>
        )}

        {/* PAGINATION DINAMIS */}
        {!loading && latestComics.length > 0 && (
          <div className="flex justify-between items-center mt-10 mb-6 bg-[#1e1e24] p-2 rounded-xl border border-white/5">
            <Link 
              href={currentPage > 1 ? `/latest?page=${currentPage - 1}` : "#"}
              className={`bg-white/10 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition block ${currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
            >
              ← Prev
            </Link>
            
            <span className={`text-sm font-bold ${accentStyle.text}`}>
              Page {currentPage} / {totalPages}
            </span>
            
            <Link 
              href={currentPage < totalPages ? `/latest?page=${currentPage + 1}` : "#"}
              className={`${accentStyle.bg} px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:brightness-110 transition shadow-lg ${accentStyle.glow} block ${currentPage >= totalPages ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
            >
              Next →
            </Link>
          </div>
        )}
      </section>

    </main>
  );
}
