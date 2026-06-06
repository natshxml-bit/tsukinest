"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

const BASE_URL =  "https://cnest.up.railway.app";

// Fungsi helper buat bersihin thumb
function cleanThumb(url: string): string {
  if (!url) return "";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return url;
}

// Komponen Utama (Udah jadi Client Component biar support useAccent)
export default function PopularPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>; 
}) {
  const { accent, style: accentStyle } = useAccent(); // 👈 PANGGIL HOOK
  const params = use(searchParams); // MANTRA Next.js 15 tetep jalan!
  const currentPage = Number(params.page) || 1;
  
  const [popularComics, setPopularComics] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Ambil data real-time di client
  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/popular?page=${currentPage}`)
      .then(res => res.json())
      .then(json => {
        setPopularComics(json.data?.results || json.data || []);
        setTotalPages(json.data?.pagination?.total || 1);
        setLoading(false);
      })
      .catch(error => {
        console.error("Gagal ambil data populer", error);
        setLoading(false);
      });
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-28 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-gray-950/95 p-4 border-b border-white/5 flex items-center gap-3">
        <Link href="/" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition active:scale-95">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          Populer
        </h1>
      </header>

      {/* CONTENT */}
      <section className="p-4 max-w-md mx-auto">
        {loading ? (
           <div className="flex justify-center items-center py-20">
             <div className={`w-8 h-8 border-4 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {popularComics.length > 0 ? (
                popularComics.map((item: any, index: number) => {
                  const thumbUrl = cleanThumb(item.thumb); 
                  
                  return (
                    <Link href={`/detail/${item.slug}`} key={index} className="flex flex-col gap-2 group active:scale-95 transition-transform">
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-900 border border-white/5">
                        <Image
                          src={thumbUrl || "/no-image.png"}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {/* TIPE MENGGUNAKAN ACCENT */}
                        <div className={`absolute top-2 left-2 ${accentStyle.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow uppercase`}>
                          {item.type || 'MANHWA'}
                        </div>

                        {item.rating && item.rating !== "0" && (
                          <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            ⭐ {item.rating}
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 bg-black/80 text-gray-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                          {item.chapter || item.latest_chapter || 'Ch. 0'}
                        </div>
                      </div>

                      <h3 className={`text-sm font-semibold line-clamp-2 leading-snug transition-colors ${accent === 'custom' ? 'group-hover:text-[var(--tsuki-custom-hex)]' : accentStyle.text.replace('text-', 'group-hover:text-')}`}>
                        {item.title}
                      </h3>
                    </Link>
                  )
                })
              ) : (
                <p className="col-span-2 text-center text-gray-500 py-10">Data tidak ditemukan</p>
              )}
            </div>

            {/* PAGINATION */}
            {popularComics.length > 0 && (
              <div className="flex justify-between items-center mt-10 mb-6 bg-gray-900 p-2 rounded-xl border border-white/5">
                <Link 
                  href={currentPage > 1 ? `/popular?page=${currentPage - 1}` : "#"}
                  className={`bg-white/10 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition block ${currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
                >
                  ← Prev
                </Link>
                
                <span className={`text-sm font-bold ${accentStyle.text}`}>
                  Page {currentPage} / {totalPages}
                </span>
                
                <Link 
                  href={currentPage < totalPages ? `/popular?page=${currentPage + 1}` : "#"}
                  className={`${accentStyle.bg} px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:brightness-110 transition shadow-lg ${accentStyle.glow} block ${currentPage >= totalPages ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
                >
                  Next →
                </Link>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  );
}
