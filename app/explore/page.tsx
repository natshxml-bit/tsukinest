"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUpdates, getLatest, type MangaItem } from "@/lib/api"; 
import { useAccent } from "@/lib/accent"; // 👈 IMPORT HOOK ACCENT

// 🔥 TRIK DEWA: GLOBAL CACHE MEMORY
let globalList: MangaItem[] = [];
let globalPage = 1;
let globalScroll = 0;

export default function ExplorePage() {
  const { accent, style: accentStyle } = useAccent(); // 👈 INISIALISASI HOOK ACCENT

  const [mangaList, setMangaList] = useState<MangaItem[]>(globalList);
  const [page, setPage] = useState(globalPage);
  const [isLoading, setIsLoading] = useState(globalList.length === 0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastFetchedPage = useRef(globalPage); 

  const mergeAndDedupe = (existingList: MangaItem[], newData1: MangaItem[], newData2: MangaItem[]) => {
    const combined = [...existingList, ...newData1, ...newData2];
    const unique = Array.from(new Map(combined.map((item) => [item.slug, item])).values());
    return unique;
  };

  const cleanThumb = (url: string): string => {
    if (!url) return "";
    if (url.includes("<")) {
      const match = url.match(/src=["']([^"']+)["']/i);
      if (match) return match[1];
    }
    return url;
  };

  useEffect(() => {
    if (globalList.length > 0 && globalScroll > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, globalScroll);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (globalList.length > 0) return;

    let isMounted = true; 

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [updatesRes, latestRes] = await Promise.all([
          getUpdates(1),
          getLatest(1)
        ]);

        if (!isMounted) return;

        const updatesData = updatesRes?.data?.results || updatesRes?.data || [];
        const latestData = latestRes?.data?.results || latestRes?.data || [];

        if (updatesData.length > 0 || latestData.length > 0) {
          const merged = mergeAndDedupe([], updatesData, latestData);
          setMangaList(merged);
          globalList = merged; 
        }
      } catch (error) {
        console.error("Gagal load data awal di Explore:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    globalList = mangaList;
    globalPage = page;
  }, [mangaList, page]);

  const handleSaveScroll = () => {
    globalScroll = window.scrollY;
  };

  useEffect(() => {
    if (page <= lastFetchedPage.current) return;

    let isMounted = true;

    const fetchNextPage = async () => {
      setIsFetchingNextPage(true);
      lastFetchedPage.current = page; 
      
      try {
        const [updatesRes, latestRes] = await Promise.all([
          getUpdates(page),
          getLatest(page)
        ]);
        
        if (!isMounted) return;

        const updatesData = updatesRes?.data?.results || updatesRes?.data || [];
        const latestData = latestRes?.data?.results || latestRes?.data || [];
        
        if (updatesData.length > 0 || latestData.length > 0) {
          setMangaList((prev) => {
            const merged = mergeAndDedupe(prev, updatesData, latestData);
            globalList = merged; 
            return merged;
          });
        } else {
          setHasMore(false); 
        }
      } catch (error) {
        console.error(`Gagal nge-fetch halaman ${page}:`, error);
        lastFetchedPage.current = page - 1; 
      } finally {
        if (isMounted) setIsFetchingNextPage(false);
      }
    };

    fetchNextPage();
    
    return () => { isMounted = false; };
  }, [page]);

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

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white p-4 pb-24">
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 pt-2">
            Explore
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className={`w-8 h-8 border-4 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
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
                    
                    {manga.type && (
                      <span 
                        className={`absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-md ${manga.type.toLowerCase() === 'completed' ? 'bg-emerald-600' : accentStyle.bg}`}
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
                    
                    <div className="absolute bottom-0 left-0 p-2 w-full">
                      <h3 className="text-[11px] font-bold line-clamp-2 leading-tight text-white/95">
                        {cleanTitle}
                      </h3>
                      {manga.latest_chapter && (
                        <p className={`text-[9px] font-medium ${accentStyle.text} mt-1 flex items-center gap-1`}>
                           {manga.latest_chapter}
                        </p>
                      )}
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
                Manga habis, bre! 🎉
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
