"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { filterManga, getGenres, getGenre, type MangaItem } from "@/lib/api"; 
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

// ─── PENYIMPANAN CACHE GLOBAL ───
// Digunakan untuk mempertahankan state saat pengguna melakukan navigasi kembali (back)
let globalList: MangaItem[] = [];
let globalPage = 1;
let globalScroll = 0;
let globalFilters = {
  genre: "",
  type: "",
  status: "",
  order: "popular"
};

const typeOptions = [
  { value: "", label: "Semua Tipe" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" }
];

const statusOptions = [
  { value: "", label: "Status" },
  { value: "ongoing", label: "Berjalan" },
  { value: "completed", label: "Selesai" }
];

const orderOptions = [
  { value: "popular", label: "Terpopuler" },
  { value: "latest", label: "Terbaru" },
  { value: "title", label: "A-Z" }
];

export default function AllSeriesPage() {
  const { accent, style: accentStyle } = useAccent(); // 👈 INISIALISASI HOOK ACCENT

  const [mangaList, setMangaList] = useState<MangaItem[]>(globalList);
  const [page, setPage] = useState(globalPage);
  const [isLoading, setIsLoading] = useState(globalList.length === 0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [genreOptions, setGenreOptions] = useState<{value: string, label: string}[]>([
    { value: "", label: "Semua Genre" }
  ]);

  const [filterGenre, setFilterGenre] = useState(globalFilters.genre);
  const [filterType, setFilterType] = useState(globalFilters.type);
  const [filterStatus, setFilterStatus] = useState(globalFilters.status);
  const [filterOrder, setFilterOrder] = useState(globalFilters.order);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastFetchedPage = useRef(globalPage); 

  const cleanThumb = (url: string): string => {
    if (!url) return "";
    if (url.includes("<")) {
      const match = url.match(/src=["']([^"']+)["']/i);
      if (match) return match[1];
    }
    return url;
  };

  // ─── MENGAMBIL DAFTAR GENRE UNTUK DROPDOWN ───
  useEffect(() => {
    let isMounted = true;
    const fetchGenres = async () => {
      try {
        const res = await getGenres();
        if (isMounted && res?.success && res.data) {
          const formattedGenres = res.data.map((g: any) => ({
            value: g.slug,
            label: g.name
          }));
          setGenreOptions([{ value: "", label: "Semua Genre" }, ...formattedGenres]);
        }
      } catch (error) {
        console.error("Kesalahan saat memuat daftar genre:", error);
      }
    };
    fetchGenres();
    return () => { isMounted = false; };
  }, []);

  // ─── MENGEMBALIKAN POSISI SCROLL SECARA INSTAN ───
  useEffect(() => {
    if (globalList.length > 0 && globalScroll > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, globalScroll);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── FUNGSI UTAMA PENGAMBILAN DATA (FETCHING) ───
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchFilteredData = useCallback(async (pageNum: number, resetList: boolean = false) => {
    if (resetList) setIsLoading(true);
    else setIsFetchingNextPage(true);

    lastFetchedPage.current = pageNum;
    let res;

    try {
      if (filterGenre !== "") {
        res = await getGenre(filterGenre, pageNum);
      } else {
        res = await filterManga({
          type: filterType,
          status: filterStatus,
          order: filterOrder,
          page: pageNum,
        });
      }

      const incomingData = res?.data?.results || res?.data || [];

      if (incomingData.length > 0) {
        if (resetList) {
          setMangaList(incomingData);
          globalList = incomingData;
        } else {
          setMangaList((prev) => {
            const combined = [...prev, ...incomingData];
            const unique = Array.from(new Map(combined.map((item) => [item.slug, item])).values());
            globalList = unique;
            return unique;
          });
        }
        setHasMore(true);
      } else {
        if (resetList) {
          setMangaList([]);
          globalList = [];
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Kesalahan sistem saat memuat data hasil filter:", error);
      if (!resetList) lastFetchedPage.current = pageNum - 1;
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [filterGenre, filterType, filterStatus, filterOrder]);


  // ─── EFEK: PEMICU PEMBARUAN DATA SAAT FILTER BERUBAH ───
  useEffect(() => {
    if (
      filterGenre === globalFilters.genre &&
      filterType === globalFilters.type &&
      filterStatus === globalFilters.status &&
      filterOrder === globalFilters.order &&
      globalList.length > 0
    ) {
      return;
    }

    globalFilters = { genre: filterGenre, type: filterType, status: filterStatus, order: filterOrder };
    setPage(1);
    globalPage = 1;
    fetchFilteredData(1, true);
  }, [filterGenre, filterType, filterStatus, filterOrder, fetchFilteredData]);


  // ─── EFEK: PEMICU PAGINASI SAAT MENCAPAI BATAS BAWAH ───
  useEffect(() => {
    if (page === 1 || page <= lastFetchedPage.current) return;
    
    globalPage = page; 
    fetchFilteredData(page, false);
  }, [page, fetchFilteredData]);


  // ─── MEREKAM POSISI SCROLL SAAT ITEM DIKLIK ───
  const handleSaveScroll = () => {
    globalScroll = window.scrollY;
  };

  // ─── OBSERVER (INFINITY SCROLL) ───
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isFetchingNextPage) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    }, { rootMargin: "400px" });

    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasMore]);

  const getLabel = (options: any[], value: string) => options.find((opt) => opt.value === value)?.label || options[0].label;

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white p-4 pb-24 relative">
      
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        ></div>
      )}

      {/* HEADER */}
      <div className="mb-6 pt-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          All Series
        </h2>
      </div>

      {/* MENU FILTER (GRID 2 KOLOM) */}
      <div className="grid grid-cols-2 gap-2 mb-8 relative z-50">
        
        {/* Dropdown Genre */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === "genre" ? null : "genre")}
            className={`w-full flex items-center justify-between bg-[#1e1e24] border ${openDropdown === 'genre' ? (accent === 'custom' ? 'border-[var(--tsuki-custom-hex)]' : accentStyle.border) : 'border-white/5'} rounded-xl py-2.5 px-3 text-[11px] font-bold text-gray-300 transition-colors active:scale-95`}
          >
            <span className="truncate">{getLabel(genreOptions, filterGenre)}</span>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'genre' ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)] rotate-180' : accentStyle.text + ' rotate-180') : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === "genre" && (
            <ul className="absolute top-full left-0 mt-1.5 w-[150%] max-h-64 overflow-y-auto bg-[#1e1e24] border border-white/5 rounded-xl shadow-2xl py-1 z-50 custom-scrollbar">
              {genreOptions.map((opt) => (
                <li 
                  key={opt.value}
                  onClick={() => { 
                    setFilterGenre(opt.value); 
                    if(opt.value !== "") {
                      setFilterType(""); setFilterStatus(""); setFilterOrder("popular");
                    }
                    setOpenDropdown(null); 
                  }}
                  className={`px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-colors ${filterGenre === opt.value ? `${accentStyle.soft} ${accentStyle.text}` : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dropdown Tipe */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
            className={`w-full flex items-center justify-between bg-[#1e1e24] border ${openDropdown === 'type' ? (accent === 'custom' ? 'border-[var(--tsuki-custom-hex)]' : accentStyle.border) : 'border-white/5'} rounded-xl py-2.5 px-3 text-[11px] font-bold text-gray-300 transition-colors active:scale-95`}
          >
            <span className="truncate">{getLabel(typeOptions, filterType)}</span>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'type' ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)] rotate-180' : accentStyle.text + ' rotate-180') : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === "type" && (
            <ul className="absolute top-full right-0 mt-1.5 w-full bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-2xl py-1 z-50">
              {typeOptions.map((opt) => (
                <li 
                  key={opt.value}
                  onClick={() => { 
                    setFilterType(opt.value); 
                    setFilterGenre(""); 
                    setOpenDropdown(null); 
                  }}
                  className={`px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-colors ${filterType === opt.value ? `${accentStyle.soft} ${accentStyle.text}` : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dropdown Status */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
            className={`w-full flex items-center justify-between bg-[#1e1e24] border ${openDropdown === 'status' ? (accent === 'custom' ? 'border-[var(--tsuki-custom-hex)]' : accentStyle.border) : 'border-white/5'} rounded-xl py-2.5 px-3 text-[11px] font-bold text-gray-300 transition-colors active:scale-95`}
          >
            <span className="truncate">{getLabel(statusOptions, filterStatus)}</span>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'status' ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)] rotate-180' : accentStyle.text + ' rotate-180') : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === "status" && (
            <ul className="absolute top-full left-0 mt-1.5 w-full bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-2xl py-1 z-50">
              {statusOptions.map((opt) => (
                <li 
                  key={opt.value}
                  onClick={() => { 
                    setFilterStatus(opt.value); 
                    setFilterGenre(""); 
                    setOpenDropdown(null); 
                  }}
                  className={`px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-colors ${filterStatus === opt.value ? `${accentStyle.soft} ${accentStyle.text}` : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dropdown Pengurutan */}
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === "order" ? null : "order")}
            className={`w-full flex items-center justify-between bg-[#1e1e24] border ${openDropdown === 'order' ? (accent === 'custom' ? 'border-[var(--tsuki-custom-hex)]' : accentStyle.border) : 'border-white/5'} rounded-xl py-2.5 px-3 text-[11px] font-bold text-gray-300 transition-colors active:scale-95`}
          >
            <span className="truncate">{getLabel(orderOptions, filterOrder)}</span>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'order' ? (accent === 'custom' ? 'text-[var(--tsuki-custom-hex)] rotate-180' : accentStyle.text + ' rotate-180') : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openDropdown === "order" && (
            <ul className="absolute top-full right-0 mt-1.5 w-full bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-2xl py-1 z-50">
              {orderOptions.map((opt) => (
                <li 
                  key={opt.value}
                  onClick={() => { 
                    setFilterOrder(opt.value); 
                    setFilterGenre(""); 
                    setOpenDropdown(null); 
                  }}
                  className={`px-3 py-2.5 text-[11px] font-bold cursor-pointer transition-colors ${filterOrder === opt.value ? `${accentStyle.soft} ${accentStyle.text}` : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* KONTEN GRID */}
      {isLoading ? (
        <div className="flex justify-center py-20 relative z-10">
          <div className={`w-8 h-8 border-4 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
        </div>
      ) : mangaList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 relative z-10">
          <span className="text-4xl mb-3">📄</span>
          <p className="text-xs font-medium">Data tidak ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {mangaList.map((manga, index) => {
              const cleanTitle = (manga.title || "").replace(/subtitle indonesia/i, '').trim();
              const thumbUrl = cleanThumb(manga.thumb);

              return (
                <Link 
                  href={`/detail/${manga.slug}`} 
                  key={`${manga.slug}-${index}`}
                  onClick={handleSaveScroll} 
                  className="active:scale-[0.97] transition-transform duration-150 block"
                >
                  <div className="group relative rounded-xl overflow-hidden bg-[#1e1e24] border border-white/5 aspect-[3/4]">
                    
                    {/* Lencana Tipe */}
                    {manga.type && (
                      <span 
                        className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-md
                          ${manga.type.toLowerCase() === 'completed' ? 'bg-emerald-600' : accentStyle.bg}`}
                      >
                        {manga.type}
                      </span>
                    )}

                    <Image
                      src={thumbUrl || "/no-image.png"}
                      alt={cleanTitle}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>
                    
                    {/* Chapter di atas Judul */}
                    <div className="absolute bottom-0 left-0 p-2 w-full flex flex-col">
                      {manga.latest_chapter && (
                        <p className={`text-[9px] font-medium ${accentStyle.text} mb-0.5 flex items-center gap-1 drop-shadow-md`}>
                           {manga.latest_chapter}
                        </p>
                      )}
                      <h3 className="text-[11px] font-bold line-clamp-2 leading-tight drop-shadow-md text-white/95">
                        {cleanTitle}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div ref={lastElementRef} className="flex justify-center items-center py-10 h-20">
            {isFetchingNextPage && (
              <div className={`w-6 h-6 border-[3px] border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
            )}
            {!hasMore && mangaList.length > 0 && (
              <p className="text-xs font-medium text-gray-500 bg-white/5 px-4 py-2 rounded-full">
                Semua data telah dimuat.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
