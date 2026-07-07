"use client";
// features/manga/hooks/useMangaDetail.ts

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { fetchMangaDetail } from "@/features/manga/services/manga.service";
import type {
  MangaDetail,
  ChapterItem,
  DetailTab,
  SortOrder,
  ReadingMode,
  ImageQuality,
} from "@/features/manga/types";

const READ_CHAPTERS_KEY = "tsukinest_read_chapters";
const READING_MODE_KEY = "tsukinest_theme";

export function useMangaDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Data state
  const [data, setData] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<DetailTab>("chapters");
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chapter state
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null);
  const [chapterFilter, setChapterFilter] = useState("");
  const [chapterSort, setChapterSort] = useState<SortOrder>("newest");

  // Settings state
  const [readingMode, setReadingMode] = useState<ReadingMode>("vertical");
  const [imageQuality, setImageQuality] = useState<ImageQuality>("high");

  // Refs
  const settingsRef = useRef<HTMLDivElement>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);

  /* ─── Auth ─── */
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  /* ─── Load local preferences ─── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_CHAPTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setReadChapters(parsed);
        if (parsed.length > 0) setLastReadChapter(parsed[parsed.length - 1]);
      }
      const storedMode = localStorage.getItem(READING_MODE_KEY);
      if (storedMode) setReadingMode(storedMode as ReadingMode);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  /* ─── Check bookmark ─── */
  useEffect(() => {
    if (!user || !slug) return;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "bookmarks", slug));
        setIsBookmarked(snap.exists());
      } catch {
        // ignore
      }
    };
    check();
  }, [user, slug]);

  /* ─── Fetch manga detail ─── */
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const normalized = await fetchMangaDetail(slug);
        if (!cancelled) {
          if (!normalized) {
            setError("Gagal memuat informasi seri.");
          } else {
            setData(normalized);
          }
        }
      } catch {
        if (!cancelled) setError("Terjadi kesalahan sistem saat memuat data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ─── Auto scroll to last read ─── */
  useEffect(() => {
    if (activeTab === "chapters" && lastReadChapter) {
      setTimeout(() => {
        document
          .getElementById(`chapter-${lastReadChapter}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [activeTab, showAllChapters, lastReadChapter]);

  /* ─── Actions ─── */
  const markChapterAsRead = useCallback((chapterSlug: string) => {
    setReadChapters((prev) => {
      if (prev.includes(chapterSlug)) return prev;
      const updated = [...prev, chapterSlug];
      localStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(updated));
      setLastReadChapter(chapterSlug);
      return updated;
    });
  }, []);

  const toggleBookmark = async () => {
    if (!user) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (!data) return;
    try {
      const docRef = doc(db, "users", user.uid, "bookmarks", slug);
      if (isBookmarked) {
        setIsBookmarked(false);
        await deleteDoc(docRef);
      } else {
        setIsBookmarked(true);
        await setDoc(docRef, {
          id: slug,
          slug,
          title: data.title,
          thumb: data.thumb,
          type: data.type || "MANHWA",
          rating: data.rating || "0",
          latest_chapter: data.chapters[0]?.chapter_number || "Ch. ?",
          savedAt: Date.now(),
        });
      }
    } catch {
      setIsBookmarked((v) => !v);
    }
  };

  const handleBack = useCallback(() => {
    const from = searchParams.get("from");
    if (from?.startsWith("/")) {
      router.push(from);
    } else {
      router.back();
    }
  }, [searchParams, router]);

  const handleShare = async () => {
    if (navigator.share && data) {
      try {
        await navigator.share({
          title: data.title,
          text: `Baca ${data.title} di TsukiNest!`,
          url: window.location.href,
        });
        return;
      } catch {
        // fallback to modal
      }
    }
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveReadingMode = (mode: ReadingMode) => {
    setReadingMode(mode);
    localStorage.setItem(READING_MODE_KEY, mode);
  };

  /* ─── Derived data ─── */
  const getChapterNumberValue = useCallback((chapter: ChapterItem): number => {
    const num = chapter.chapter_number?.match(/(\d+(?:\.\d+)?)/);
    if (num) return parseFloat(num[0]);
    const lower = chapter.chapter_number?.toLowerCase() || "";
    if (lower.includes("prologue")) return -2;
    if (lower.includes("epilogue")) return 999999;
    if (lower.includes("side")) return 999998;
    if (lower.includes("extra")) return 999997;
    if (lower.includes("special")) return 999996;
    return 0;
  }, []);

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    if (!chapterFilter.trim()) return data.chapters;
    const q = chapterFilter.toLowerCase();
    return data.chapters.filter(
      (ch) =>
        ch.chapter_number.toLowerCase().includes(q) ||
        (ch.release_date && ch.release_date.toLowerCase().includes(q))
    );
  }, [data, chapterFilter]);

  const sortedChapters = useMemo(() => {
    return [...filteredChapters].sort((a, b) => {
      const aVal = getChapterNumberValue(a);
      const bVal = getChapterNumberValue(b);
      return chapterSort === "newest" ? bVal - aVal : aVal - bVal;
    });
  }, [filteredChapters, chapterSort, getChapterNumberValue]);

  const latestChapter = useMemo(() => {
    if (!data || data.chapters.length === 0) return null;
    return [...data.chapters].sort(
      (a, b) => getChapterNumberValue(b) - getChapterNumberValue(a)
    )[0];
  }, [data, getChapterNumberValue]);

  const continueReadingChapter = lastReadChapter
    ? data?.chapters.find((ch) => ch.slug === lastReadChapter) ?? null
    : null;

  const displayTotalChapters = useMemo(() => {
    if (!data) return 0;
    if (data.total_chapters && data.total_chapters > 0) return data.total_chapters;
    let maxChapter = 0;
    data.chapters.forEach((ch) => {
      const numMatch = ch.chapter_number?.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[0]);
        if (parsed > maxChapter) maxChapter = parsed;
      }
    });
    return maxChapter > 0 ? Math.floor(maxChapter) : data.chapters.length;
  }, [data]);

  const shownChapters = showAllChapters
    ? sortedChapters
    : sortedChapters.slice(0, 15);

  const genres = useMemo(
    () =>
      (data?.genres || [])
        .map((g) => (typeof g === "string" ? g : g.name))
        .filter(Boolean),
    [data]
  );

  const authors = data?.author ? [data.author] : data?.authors || [];
  const artists = data?.artist ? [data.artist] : data?.artists || [];

  return {
    // Params
    slug,
    // Data
    data,
    loading,
    error,
    // User
    user,
    isBookmarked,
    isLiked,
    setIsLiked,
    // UI toggles
    activeTab,
    setActiveTab,
    showFullSynopsis,
    setShowFullSynopsis,
    showAllChapters,
    setShowAllChapters,
    showShareModal,
    setShowShareModal,
    showSettings,
    setShowSettings,
    showNotification,
    setShowNotification,
    copied,
    // Settings
    readingMode,
    saveReadingMode,
    imageQuality,
    setImageQuality,
    // Chapter state
    readChapters,
    lastReadChapter,
    chapterFilter,
    setChapterFilter,
    chapterSort,
    setChapterSort,
    // Derived
    sortedChapters,
    shownChapters,
    latestChapter,
    continueReadingChapter,
    displayTotalChapters,
    genres,
    authors,
    artists,
    // Refs
    settingsRef,
    chapterListRef,
    // Actions
    markChapterAsRead,
    toggleBookmark,
    handleBack,
    handleShare,
    copyToClipboard,
  };
}
