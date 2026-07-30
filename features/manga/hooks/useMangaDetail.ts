"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDetail } from "@/lib/api";
import { auth, db } from "@/lib/firebase";
import {
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import type { MangaDetail as MangaDetailType } from "@/features/manga/types";

/* ─── Types ─── */
interface Chapter {
  slug: string;
  chapter_number: string;
  release_date: string;
}

/* ─── Helpers ─── */
function toString(val: unknown): string {
  if (val == null) return "";
  return String(val);
}

function getTaxonomyNames(data: Record<string, unknown>, key: string): string[] {
  const taxonomy = data.taxonomy as Record<string, { name: string }[]> | undefined;
  return taxonomy?.[key]?.map((t) => t.name) || [];
}

function getChapterNumberValue(chapterNumber: string): number {
  const cleaned = chapterNumber.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// API detail (/detail/{slug}) balikin field chapters[] dengan nama field yang
// gak konsisten antar sumber (scraped backend) — kadang chapter_number,
// kadang cuma "chapter"; kadang slug, kadang chapter_slug. Baca defensif
// biar daftar bab gak kosong cuma gara-gara satu sumber pakai nama beda.
function normalizeChapter(ch: unknown, index: number): Chapter {
  const raw = (ch ?? {}) as Record<string, unknown>;
  return {
    slug:
      (raw.slug as string) ||
      (raw.chapter_slug as string) ||
      (raw.chapter_id as string) ||     // ← TAMBAH INI
      "",
    chapter_number:
      toString(raw.chapter_number) ||
      toString(raw.chapter) ||
      `Ch. ${index + 1}`,
    release_date: (raw.release_date as string) || "",
  };
}


/* ─── Normalize raw API data to MangaDetailType ─── */
function normalizeMangaData(raw: Record<string, unknown>): MangaDetailType {
  const authors = getTaxonomyNames(raw, "Author");
  const artists = getTaxonomyNames(raw, "Artist");
  const genresFromTaxonomy = getTaxonomyNames(raw, "Genre");

  return {
    ...raw,
    title: (raw.title as string) || "Judul Tidak Tersedia",
    alternative_title: (raw.alternative_title as string) || undefined,
    thumb:
      (raw.cover_image_url as string) ||
      (raw.cover_portrait_url as string) ||
      (raw.thumb as string) ||
      (raw.thumbnail as string) ||
      "",
    synopsis:
      (raw.description as string) ||
      (raw.synopsis as string) ||
      "Sinopsis belum tersedia untuk seri ini.",
    author: authors[0] || (raw.author as string) || undefined,
    authors: authors.length > 0 ? authors : (raw.authors as string[]) || [],
    artist: artists[0] || (raw.artist as string) || undefined,
    artists: artists.length > 0 ? artists : (raw.artists as string[]) || [],
    genres:
      genresFromTaxonomy.length > 0
        ? genresFromTaxonomy
        : (raw.genres as string[]) || [],
    type: (raw.country_id as string) || (raw.type as string) || undefined,
    status: raw.status as string | undefined,
    rating:
      toString(raw.user_rate) || (raw.rating as string) || undefined,
    views: toString(raw.view_count) || (raw.views as string) || "0",
    followers:
      toString(raw.bookmark_count) || (raw.followers as string) || "0",
    release_year:
      (raw.release_year as string) ||
      (raw.year as string) ||
      (raw.released as string) ||
      undefined,
    updated_at:
      (raw.updated_at as string) ||
      (raw.last_updated as string) ||
      (raw.updated_on as string) ||
      undefined,
    chapters: ((raw.chapters as Record<string, unknown>[]) || []).map(
      normalizeChapter
    ),
    total_chapters: (raw.chapters as unknown[])?.length,
    related_series: (raw.related_series as MangaDetailType["related_series"]) || [],
  } as MangaDetailType;
}

/* ─── Hook ─── */
export function useMangaDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";

  /* ─── Data ─── */
  const [data, setData] = useState<MangaDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ─── Auth ─── */
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  /* ═══════════════════════════════════════════════════
     FIREBASE: BOOKMARK & LIKE
     ═══════════════════════════════════════════════════ */
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!user?.uid || !slug) {
      setIsBookmarked(false);
      return;
    }
    const ref = doc(db, "users", user.uid, "bookmarks", slug);
    const unsub = onSnapshot(ref, (snap) => setIsBookmarked(snap.exists()));
    return () => unsub();
  }, [user?.uid, slug]);

  useEffect(() => {
    if (!user?.uid || !slug) {
      setIsLiked(false);
      return;
    }
    const ref = doc(db, "users", user.uid, "likes", slug);
    const unsub = onSnapshot(ref, (snap) => setIsLiked(snap.exists()));
    return () => unsub();
  }, [user?.uid, slug]);

  /* ─── Toggle Bookmark ─── */
  const toggleBookmark = useCallback(async () => {
    if (!user) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (!slug || !data) return;

    const ref = doc(db, "users", user.uid, "bookmarks", slug);
    if (isBookmarked) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        id: slug,
        slug,
        title: data.title || "",
        thumb: data.thumb || "",
        type: data.type || "manga",
        latest_chapter: normalizeChapter(data.chapters?.[0], 0).chapter_number,
        savedAt: Date.now(),
      });
    }
  }, [user, slug, data, isBookmarked]);

  /* ─── Toggle Like ─── */
  const toggleLike = useCallback(async () => {
    if (!user) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (!slug || !data) return;

    const ref = doc(db, "users", user.uid, "likes", slug);
    if (isLiked) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        id: slug,
        slug,
        title: data.title || "",
        thumb: data.thumb || "",
        type: data.type || "manga",
        latest_chapter: normalizeChapter(data.chapters?.[0], 0).chapter_number,
        savedAt: Date.now(),
      });
    }
  }, [user, slug, data, isLiked]);

  /* ═══════════════════════════════════════════════════
     FIREBASE: READING PROGRESS
     ═══════════════════════════════════════════════════ */
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [lastReadChapterSlug, setLastReadChapterSlug] = useState<string | null>(null);
  const [lastReadPage, setLastReadPage] = useState(0);

  useEffect(() => {
    if (!user?.uid || !slug) {
      setReadChapters([]);
      setLastReadChapterSlug(null);
      setLastReadPage(0);
      return;
    }

    const progressRef = doc(db, "users", user.uid, "reading_progress", slug);
    const unsub = onSnapshot(
      progressRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setReadChapters(d.readChapters || []);
          setLastReadChapterSlug(d.lastReadChapter || null);
          setLastReadPage(d.lastReadPage || 0);
        } else {
          setReadChapters([]);
          setLastReadChapterSlug(null);
          setLastReadPage(0);
        }
      },
      () => {
        setReadChapters([]);
        setLastReadChapterSlug(null);
        setLastReadPage(0);
      }
    );

    return () => unsub();
  }, [user?.uid, slug]);

  /* ─── Mark Chapter as Opened ─── */
  const markChapterAsRead = useCallback(
    async (chapterSlug: string) => {
      if (!user?.uid || !slug) return;

      const progressRef = doc(db, "users", user.uid, "reading_progress", slug);
      await setDoc(
        progressRef,
        {
          lastReadChapter: chapterSlug,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user?.uid, slug]
  );

  /* ─── Fetch manga data ─── */
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    getDetail(slug)
      .then((res) => {
        if (cancelled) return;
        if (!res?.data) {
          setError("Data tidak ditemukan.");
          setData(null);
        } else {
          const normalized = normalizeMangaData(res.data as Record<string, unknown>);
          setData(normalized);
          setError(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Terjadi kesalahan.");
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ─── Derived: chapters ─── */
  const chapters = useMemo<Chapter[]>(() => {
    if (!data?.chapters) return [];
    return data.chapters.map((ch, i) => normalizeChapter(ch, i));
  }, [data?.chapters]);

  /* ─── Derived: sorted chapters ─── */
  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const numA = getChapterNumberValue(a.chapter_number);
      const numB = getChapterNumberValue(b.chapter_number);
      return numB - numA;
    });
  }, [chapters]);

  /* ─── Chapter filter & sort ─── */
  const [chapterFilter, setChapterFilter] = useState("");
  const [chapterSort, setChapterSort] = useState<"newest" | "oldest">("newest");
  const [showAllChapters, setShowAllChapters] = useState(false);

  const filteredChapters = useMemo(() => {
    let result = [...sortedChapters];
    if (chapterFilter) {
      const q = chapterFilter.toLowerCase();
      result = result.filter((ch) => ch.chapter_number.toLowerCase().includes(q));
    }
    if (chapterSort === "oldest") {
      result = result.reverse();
    }
    return result;
  }, [sortedChapters, chapterFilter, chapterSort]);

  const shownChapters = useMemo(() => {
    if (showAllChapters) return filteredChapters;
    return filteredChapters.slice(0, 20);
  }, [filteredChapters, showAllChapters]);

  /* ─── Continue Reading ─── */
  const continueReadingChapter = useMemo(() => {
    if (!lastReadChapterSlug) return null;
    const ch = chapters.find((c) => c.slug === lastReadChapterSlug);
    return ch || null;
  }, [lastReadChapterSlug, chapters]);

  /* ─── Latest Chapter ─── */
  const latestChapter = useMemo(() => {
    return sortedChapters[0] || null;
  }, [sortedChapters]);

  /* ─── Last Read Chapter ─── */
  const lastReadChapter = useMemo(() => {
    if (!lastReadChapterSlug) return null;
    return chapters.find((c) => c.slug === lastReadChapterSlug) || null;
  }, [lastReadChapterSlug, chapters]);

  /* ─── UI State ─── */
  const [activeTab, setActiveTab] = useState<"chapters" | "info" | "related">("chapters");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal">("vertical");
  const [imageQuality, setImageQuality] = useState<"high" | "medium" | "low">("high");

  const settingsRef = useRef<HTMLDivElement>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);

  /* ─── Reading mode (localStorage) ─── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("reading_mode");
    if (saved === "horizontal" || saved === "vertical") {
      setReadingMode(saved);
    }
  }, []);

  const saveReadingMode = useCallback((mode: "vertical" | "horizontal") => {
    setReadingMode(mode);
    localStorage.setItem("reading_mode", mode);
  }, []);

  /* ─── Image quality (localStorage) ─── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("image_quality");
    if (saved === "high" || saved === "medium" || saved === "low") {
      setImageQuality(saved);
    }
  }, []);

  /* ─── Share ─── */
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  /* ─── Navigation ─── */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  /* ─── Derived: authors, artists, genres ─── */
  const authors = useMemo(() => {
    if (!data) return [];
    // Coba baca dari authors (array) dulu, fallback ke author (string)
    if (Array.isArray(data.authors) && data.authors.length > 0) return data.authors;
    if (data.author) return [data.author];
    return [];
  }, [data]);

  const artists = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.artists) && data.artists.length > 0) return data.artists;
    if (data.artist) return [data.artist];
    return [];
  }, [data]);

  const genres = useMemo(() => {
    if (!data?.genres) return [];
    return data.genres
      .map((g) => (typeof g === "string" ? g : g?.name || ""))
      .filter(Boolean);
  }, [data?.genres]);

  const displayTotalChapters = useMemo(() => {
    return data?.chapters?.length || 0;
  }, [data?.chapters]);

  /* ─── Click outside settings ─── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSettings]);

  /* ─── Return ─── */
  return {
    slug,
    data,
    loading,
    error,
    user,
    isBookmarked,
    isLiked,
    toggleBookmark,
    toggleLike,
    chapters,
    sortedChapters,
    shownChapters,
    filteredChapters,
    readChapters,
    continueReadingChapter,
    latestChapter,
    lastReadChapter,
    displayTotalChapters,
    chapterFilter,
    setChapterFilter,
    chapterSort,
    setChapterSort,
    showAllChapters,
    setShowAllChapters,
    markChapterAsRead,
    lastReadPage,
    activeTab,
    setActiveTab,
    showSettings,
    setShowSettings,
    settingsRef,
    readingMode,
    saveReadingMode,
    imageQuality,
    setImageQuality,
    showShareModal,
    setShowShareModal,
    handleShare,
    copied,
    copyToClipboard,
    showNotification,
    setShowNotification,
    handleBack,
    authors,
    artists,
    genres,
    chapterListRef,
  };
}
