"use client";

// features/chapter/hooks/useReader.ts
// Core reader state: data fetching, pagination, scroll progress, settings.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getRead } from "@/lib/api";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { fixUrl, cleanNavigationSlug } from "@/features/chapter/utils/reader.utils";
import type { ReadData, ReadMode, FitMode, ReadChapterRef } from "@/features/chapter/types";

export function useReader(seriesTitleFallback?: string) {
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

  /* ─── Pulihkan posisi baca (auto-scroll ke halaman terakhir) ─── */
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  // Berapa gambar awal yang harus di-render eager pas restore posisi baca.
  // Gambar di atas posisi terakhir WAJIB ke-load dulu biar posisi scroll
  // yang dipulihin akurat (kalau lazy, tingginya 0 dan scroll-nya meleset).
  const [eagerLimit, setEagerLimit] = useState(0);
  const [pendingScroll, setPendingScroll] = useState<number | null>(null);
  const restoredRef = useRef<Set<string>>(new Set());
  // Ref biar fetch effect gak perlu masukin `mode` ke dependency (gak mau
  // refetch chapter cuma karena user ganti mode baca).
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  // Ambil lastReadPage dari Firestore. Cuma kepake kalau user lagi login,
  // doc progress-nya ada, dan lastReadChapter-nya masih chapter ini.
  const restorePosition = useCallback(
    async (series: string, chSlug: string, totalPages: number): Promise<number | null> => {
      if (restoredRef.current.has(chSlug)) return null;
      const user = auth.currentUser;
      if (!user || !series || !chSlug) return null;
      try {
        const snap = await getDoc(
          doc(db, "users", user.uid, "reading_progress", series)
        );
        if (!snap.exists()) return null;
        const d = snap.data();
        if (!d || d.lastReadChapter !== chSlug) return null;
        const page = Number(d.lastReadPage ?? 0);
        if (!Number.isFinite(page) || page <= 0 || page >= totalPages) return null;
        restoredRef.current.add(chSlug);
        return page;
      } catch {
        return null;
      }
    },
    []
  );

  /* ─── Scroll progress (vertical mode) ─── */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      // FIX: kalau total <= 0, berarti seluruh chapter (gambar dikit) udah
      // muat di layar tanpa perlu discroll sama sekali — itu artinya udah
      // "kebaca semua", bukan 0%. Sebelumnya di-fallback ke 0, jadi chapter
      // pendek gak akan PERNAH nyampe scrollProgress >= 95 → gak pernah
      // ke-mark "Selesai" walau udah beneran dibaca.
      setScrollProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 100);
    };
    window.scrollTo(0, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterSlug]);

  /* ─── Sync series_title dari fallback (datang dari /detail) ─── */
  useEffect(() => {
    if (!seriesTitleFallback || !data) return;
    if (data.series_title && data.series_title !== "Membaca Komik") return;
    setData((prev) =>
      prev && prev.series_title !== seriesTitleFallback
        ? { ...prev, series_title: seriesTitleFallback }
        : prev
    );
  }, [seriesTitleFallback, data]);

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
        const chapMangaId = ch.manga_id || "";

        if (!chapTitle || !chapNum) {
          const m = ch.title?.match(/(.*?)\s+(?:Chapter|Ch\.?|Bab)\s*(\d+(?:\.\d+)?)/i);
          if (m) { chapTitle ||= m[1].trim(); chapNum ||= m[2]; }
          // FIX: kalau /chapter API nggak kirim series_title, fallback ke
          // judul series yang di-pass dari parent (datang dari /detail),
          // baru kalau itu juga gak ada, pakai title yg ke-parse dari
          // ch.title, dan terakhir "Membaca Komik" sebagai safety net.
          else chapTitle ||= ch.title?.replace(/-.*/, "").trim() || seriesTitleFallback?.trim() || "Membaca Komik";
        }
        chapSeriesSlug ||= chapterSlug.replace(/-(?:chapter|ch|bab)-?\d+(?:-\d+)?$/i, "");
        chapNum ||= chapterSlug.match(/\d+(?:-\d+)?$/)?.[0].replace("-", ".") || "?";

        // FIX: Handle both prev_chapter/next_chapter and prev_chapter_id/next_chapter_id
        const prev = cleanNavigationSlug(ch.prev_chapter_id || ch.prev_chapter);
        const next = cleanNavigationSlug(ch.next_chapter_id || ch.next_chapter);

        const rawChapters: ReadChapterRef[] = ch.chapters || [];
        const seen = new Set<string>();
        const uniqueChapters = rawChapters.filter((c) => {
          if (seen.has(c.slug)) return false;
          seen.add(c.slug);
          return true;
        });

        if (!cancelled) {
          // FIX: pulihkan posisi baca terakhir SEBELUM data di-render, biar
          // eagerLimit (gambar yang di-render eager) langsung kepasang pas
          // render pertama — kalau telat, gambar-gambar udah ke-render lazy
          // dan posisi scroll hasil restore-nya gak bakal akurat.
          const restorePage = await restorePosition(
            chapSeriesSlug,
            chapterSlug,
            images.length
          );

          if (cancelled) return;

          setData({
            title: ch.title || `Chapter ${chapNum}`,
            chapter_number: chapNum,
            series_title: chapTitle,
            series_slug: chapSeriesSlug,
            manga_id: chapMangaId,
            prev_chapter: prev,
            next_chapter: next,
            images,
            chapters: uniqueChapters,
          });

          if (restorePage != null && modeRef.current === "horizontal") {
            setPage(restorePage);
          } else {
            setPage(0);
          }
          setEagerLimit(restorePage != null && modeRef.current === "vertical" ? restorePage : 0);
          setPendingScroll(restorePage != null && modeRef.current === "vertical" ? restorePage : null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug, seriesSlug, reloadKey]);

  /* ─── Restore posisi baca (vertical mode) ─── */
  // Sekali pendingScroll dijadiin, tunggu render gambar sebentar, scroll ke
  // gambar target, terus koreksi ulang sampai tinggi gambar-nya beneran
  // kebaca (naturalHeight > 0) — karena gambar di atas target yang belum
  // ke-load bikin offsetTop-nya meleset.
  useEffect(() => {
    if (pendingScroll == null || modeRef.current !== "vertical") return;
    const target = pendingScroll;
    setPendingScroll(null);
    let iv: number | undefined;
    const scrollTo = () => {
      const el = mainRef.current?.querySelectorAll<HTMLImageElement>("img")?.[target];
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    };
    const timer = window.setTimeout(() => {
      scrollTo();
      iv = window.setInterval(() => {
        const cur = mainRef.current?.querySelectorAll<HTMLImageElement>("img")?.[target];
        if (cur && cur.naturalHeight > 0) {
          scrollTo();
          window.clearInterval(iv);
        }
      }, 200);
    }, 300);
    return () => {
      window.clearTimeout(timer);
      if (iv != null) window.clearInterval(iv);
    };
  }, [pendingScroll]);

  /* ─── Best-effort restore buat entry langsung (auth telat) ─── */
  // Kalau user buka URL chapter langsung (misal share link / refresh APK),
  // auth bisa nyelesaiin lebih telat dari fetch data → restore pertama
  // kelewat. Ini retry-nya pakai authUser yang udah jadi. Mode horizontal
  // masih bisa ditolong (setPage), vertical cuma best-effort karena
  // gambar-gambar di atas target udah ke-render lazy duluan.
  useEffect(() => {
    if (!authUser || !data || restoredRef.current.has(chapterSlug)) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", authUser.uid, "reading_progress", data.series_slug)
        );
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        if (!d || d.lastReadChapter !== chapterSlug) return;
        const page = Number(d.lastReadPage ?? 0);
        if (!Number.isFinite(page) || page <= 0 || page >= data.images.length) return;
        restoredRef.current.add(chapterSlug);
        if (mode === "horizontal") {
          setPage(page);
        } else {
          setPendingScroll(page);
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [authUser, data, mode, chapterSlug]);

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
      // FIX: Pastikan series slug selalu dapat dari salah satu fallback, termasuk params?.slug
      const targetSeriesSlug = data?.series_slug || seriesSlug || (params?.slug as string);
      setData(null);
      setLoading(true);
      window.scrollTo(0, 0);
      router.push(`/chapter/${targetSeriesSlug}/${clean}`);
    },
    [router, data, seriesSlug, params?.slug]
  );

  const nextPage = useCallback(() => {
    if (!data) return;
    if (page < data.images.length - 1) {
      setPage((p) => p + 1);
    } else if (data.next_chapter) {
      // The fallback from next_chapter_id is already handled in the fetch effect
      handleNavigation(data.next_chapter);
    }
  }, [data, page, handleNavigation]);

  const prevPage = useCallback(() => {
    if (!data) return;
    if (page > 0) {
      setPage((p) => p - 1);
    } else if (data.prev_chapter) {
      // The fallback from prev_chapter_id is already handled in the fetch effect
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
    // Position restore
    eagerLimit,
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