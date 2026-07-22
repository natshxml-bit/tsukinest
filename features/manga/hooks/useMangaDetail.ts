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

// API detail (/detail/{slug}) balikin field chapters[] dengan nama field yang
// gak konsisten antar sumber (scraped backend) — kadang chapter_number,
// kadang cuma "chapter"; kadang slug, kadang chapter_slug. Baca defensif
// biar daftar bab gak kosong cuma gara-gara satu sumber pakai nama beda.
function normalizeChapter(ch: unknown, index: number): Chapter {
  const raw = (ch ?? {}) as Record<string, unknown>;
  return {
    slug: (raw.slug as string) || (raw.chapter_slug as string) || "",
    chapter_number:
      (raw.chapter_number as string) || (raw.chapter as string) || `Ch. ${index + 1}`,
    release_date: (raw.release_date as string) || "",
  };
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
     Pakai users/{uid}/bookmarks/{slug} & users/{uid}/likes/{slug} —
     subcollection yang sama dengan explore/page.tsx & library/page.tsx,
     dan yang dicover firestore.rules. Doc ID = slug, jadi cek
     ada/gaknya tinggal onSnapshot ke doc-nya langsung (gak perlu query).
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
     Pakai users/{uid}/reading_progress/{slug} — subcollection yang
     sama dicover firestore.rules dan dipakai useReadingProgress.ts
     (ChapterReader). Skema field disamain (readChapters, lastReadChapter,
     lastReadPage, updatedAt) biar dua hook ini nulis ke dokumen &
     bentuk data yang konsisten, bukan dua sistem progress yang beda.
     ═══════════════════════════════════════════════════ */
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [lastReadChapterSlug, setLastReadChapterSlug] = useState<string | null>(null);
  const [lastReadPage, setLastReadPage] = useState(0);

  // Real-time listener untuk reading progress
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
        // Error fallback
        setReadChapters([]);
        setLastReadChapterSlug(null);
        setLastReadPage(0);
      }
    );

    return () => unsub();
  }, [user?.uid, slug]);

  /* ─── Mark Chapter as Opened ───
     Dipanggil pas user KLIK buat buka chapter (dari list / tombol lanjutkan).
     Ini CUMA nyatet chapter yang lagi dibuka (buat badge "Terakhir" & posisi
     lanjutkan baca) — BUKAN tanda udah selesai dibaca. Status "Selesai"
     (readChapters) cuma boleh diisi dari ChapterReader, pas user beneran
     nyampe halaman/scroll terakhir chapter itu. Jangan tambahin arrayUnion
     ke readChapters di sini lagi, biar gak "Selesai" duluan sebelum dibaca. */
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
          setData(res.data as MangaDetailType);
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
      const numA = parseFloat(a.chapter_number.replace(/[^0-9.]/g, "")) || 0;
      const numB = parseFloat(b.chapter_number.replace(/[^0-9.]/g, "")) || 0;
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

  /* ─── Last Read Chapter (for "Terakhir" tag) ─── */
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

  /* ─── Reading mode (localStorage — user preference, tetap) ─── */
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

  /* ─── Image quality (localStorage — user preference, tetap) ─── */
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
    if (!data?.author) return [];
    return Array.isArray(data.author) ? data.author : [data.author];
  }, [data?.author]);

  const artists = useMemo(() => {
    if (!data?.artist) return [];
    return Array.isArray(data.artist) ? data.artist : [data.artist];
  }, [data?.artist]);

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
    // Data
    slug,
    data,
    loading,
    error,

    // Auth
    user,

    // Bookmark & Like
    isBookmarked,
    isLiked,
    toggleBookmark,
    toggleLike,

    // Chapters
    chapters,
    sortedChapters,
    shownChapters,
    filteredChapters,
    readChapters,
    continueReadingChapter,
    latestChapter,
    lastReadChapter,
    displayTotalChapters,

    // Chapter controls
    chapterFilter,
    setChapterFilter,
    chapterSort,
    setChapterSort,
    showAllChapters,
    setShowAllChapters,
    markChapterAsRead,

    // Reading Progress
    lastReadPage,

    // Tabs
    activeTab,
    setActiveTab,

    // Settings
    showSettings,
    setShowSettings,
    settingsRef,
    readingMode,
    saveReadingMode,
    imageQuality,
    setImageQuality,

    // Share
    showShareModal,
    setShowShareModal,
    handleShare,
    copied,
    copyToClipboard,

    // Notification
    showNotification,
    setShowNotification,

    // Navigation
    handleBack,

    // Derived
    authors,
    artists,
    genres,

    // Refs
    chapterListRef,
  };
}
