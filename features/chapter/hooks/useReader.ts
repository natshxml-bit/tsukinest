"use client";
// features/chapter/hooks/useReader.ts
// Core reader state: data fetching, pagination, scroll progress, settings.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRead } from "@/lib/api";
import { fixUrl, cleanNavigationSlug } from "@/features/chapter/utils/reader.utils";
import type { ReadData, ReadMode, FitMode, ReadChapterRef } from "@/features/chapter/types";

export function useReader() {
  const router = useRouter();
  const params = useParams();
  // params.slug = series slug, params.chapter = chapter slug
  const seriesSlug = params?.slug as string;
  const chapterSlug = params?.chapter as string;

  const [data, setData] = useState<ReadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [mode, setMode] = useState<ReadMode>("vertical");
  const [fit, setFit] = useState<FitMode>("height");
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  // Naikin angka ini buat maksa fetch chapter ulang dari awal (dipakai tombol refresh,
  // soalnya di dalem APK gak ada gesture pull-to-refresh kayak browser biasa).
  const [reloadKey, setReloadKey] = useState(0);

  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const currentChapterBtnRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  /* ─── Scroll progress (vertical mode) ─── */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    window.scrollTo(0, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterSlug]);

  /* ─── Fetch chapter data ─── */
  useEffect(() => {
    if (!chapterSlug) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await getRead(chapterSlug);
        const ch = res?.data || res;
        if (!ch?.images?.length) throw new Error("No images");

        const images = ch.images.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (img: any, i: number) =>
            typeof img === "string"
              ? { index: i, url: img, alt: `Halaman ${i + 1}` }
              : { index: img.index ?? i, url: img.url, alt: img.alt || `Halaman ${i + 1}` }
        );

        let chapTitle = ch.series_title || "";
        let chapNum = ch.chapter_number || "";
        let chapSeriesSlug = ch.series_slug || seriesSlug || "";

        if (!chapTitle || !chapNum) {
          const m = ch.title?.match(/(.*?)\s+(?:Chapter|Ch\.?|Bab)\s*(\d+(?:\.\d+)?)/i);
          if (m) { chapTitle ||= m[1].trim(); chapNum ||= m[2]; }
          else chapTitle ||= ch.title?.replace(/-.*/, "").trim() || "Membaca Komik";
        }
        chapSeriesSlug ||= chapterSlug.replace(/-(?:chapter|ch|bab)-?\d+(?:-\d+)?$/i, "");
        chapNum ||= chapterSlug.match(/\d+(?:-\d+)?$/)?.[0].replace("-", ".") || "?";

        const prev = cleanNavigationSlug(ch.prev_chapter);
        const next = cleanNavigationSlug(ch.next_chapter);

        const rawChapters: ReadChapterRef[] = ch.chapters || [];
        const seen = new Set<string>();
        const uniqueChapters = rawChapters.filter((c) => {
          if (seen.has(c.slug)) return false;
          seen.add(c.slug);
          return true;
        });

        if (!cancelled) {
          setData({
            title: ch.title || `Chapter ${chapNum}`,
            chapter_number: chapNum,
            series_title: chapTitle,
            series_slug: chapSeriesSlug,
            prev_chapter: prev,
            next_chapter: next,
            images,
            chapters: uniqueChapters,
          });
          setPage(0);
          setBrokenImages(new Set());
          setImgLoaded(false);
          setTimeout(() => window.scrollTo(0, 0), 100);
        }
      } catch {
        // data stays null → error state rendered
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [chapterSlug, seriesSlug, reloadKey]);

  /* ─── Preload adjacent pages in horizontal mode ─── */
  useEffect(() => {
    if (!data || mode !== "horizontal") return;
    [page - 1, page + 1].forEach((idx) => {
      if (idx >= 0 && idx < data.images.length) {
        const img = new Image();
        img.src = fixUrl(data.images[idx].url);
      }
    });
    setImgLoaded(false);
  }, [page, mode, data]);

  /* ─── Scroll chapter list to current on open ─── */
  useEffect(() => {
    if (showChapterList) {
      setTimeout(() => currentChapterBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [showChapterList]);

  /* ─── Navigation ─── */
  const handleNavigation = useCallback(
    (targetSlug: string | null) => {
      const clean = cleanNavigationSlug(targetSlug);
      if (!clean) return;
      const targetSeriesSlug = data?.series_slug || seriesSlug;
      setData(null);
      setLoading(true);
      window.scrollTo(0, 0);
      router.push(`/chapter/${targetSeriesSlug}/${clean}`);
    },
    [router, data, seriesSlug]
  );

  const nextPage = useCallback(() => {
    if (!data) return;
    if (page < data.images.length - 1) {
      setPage((p) => p + 1);
    } else if (data.next_chapter) {
      handleNavigation(data.next_chapter);
    }
  }, [data, page, handleNavigation]);

  const prevPage = useCallback(() => {
    if (!data) return;
    if (page > 0) {
      setPage((p) => p - 1);
    } else if (data.prev_chapter) {
      handleNavigation(data.prev_chapter);
    }
  }, [data, page, handleNavigation]);

  /* ─── Touch events ─── */
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || touchY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (mode === "horizontal" && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? nextPage() : prevPage();
    }
    touchX.current = null;
    touchY.current = null;
  };

  const onImageError = (index: number) =>
    setBrokenImages((prev) => new Set(prev).add(index));

  /* ─── Manual refresh (dipake tombol footer, karena APK gak bisa pull-to-refresh) ─── */
  const refreshChapter = useCallback(() => {
    setData(null);
    setBrokenImages(new Set());
    setImgLoaded(false);
    window.scrollTo(0, 0);
    setReloadKey((k) => k + 1);
  }, []);

  /* ─── Derived ─── */
  const progress = useMemo(() => {
    if (!data) return 0;
    return mode === "vertical"
      ? scrollProgress
      : ((page + 1) / data.images.length) * 100;
  }, [mode, scrollProgress, page, data]);

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    if (!chapterSearch.trim()) return data.chapters;
    const q = chapterSearch.toLowerCase();
    return data.chapters.filter(
      (ch) =>
        ch.number.toLowerCase().includes(q) ||
        ch.slug.toLowerCase().includes(q)
    );
  }, [data, chapterSearch]);

  return {
    // Params
    seriesSlug,
    chapterSlug,
    // Data
    data,
    loading,
    // Pagination
    page,
    setPage,
    // UI state
    showUI,
    setShowUI,
    mode,
    setMode,
    fit,
    setFit,
    showSettings,
    setShowSettings,
    showChapterList,
    setShowChapterList,
    showComments,
    setShowComments,
    zoomedImage,
    setZoomedImage,
    // Images
    brokenImages,
    imgLoaded,
    setImgLoaded,
    onImageError,
    // Touch
    onTouchStart,
    onTouchEnd,
    // Chapter search
    chapterSearch,
    setChapterSearch,
    filteredChapters,
    // Refs
    currentChapterBtnRef,
    mainRef,
    // Navigation
    handleNavigation,
    nextPage,
    prevPage,
    refreshChapter,
    // Derived
    progress,
    scrollProgress,
  };
}
