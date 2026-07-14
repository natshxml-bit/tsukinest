"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDetail } from "@/lib/api";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import type { MangaDetail as MangaDetailType } from "@/features/manga/types/manga.types";

/* ─── Types ─── */
interface Chapter {
  slug: string;
  chapter_number: string;
  release_date: string;
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
     FIREBASE: BOOKMARK & LIKE (user_library)
     ═══════════════════════════════════════════════════ */
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [bookmarkDocId, setBookmarkDocId] = useState<string | null>(null);
  const [likeDocId, setLikeDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !slug) {
      setIsBookmarked(false);
      setIsLiked(false);
      setBookmarkDocId(null);
      setLikeDocId(null);
      return;
    }

    const q = query(
      collection(db, "user_library"),
      where("userId", "==", user.uid),
      where("slug", "==", slug)
    );

    const unsub = onSnapshot(q, (snap) => {
      let bookmarked = false;
      let liked = false;
      let bDocId: string | null = null;
      let lDocId: string | null = null;

      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.type === "bookmark") {
          bookmarked = true;
          bDocId = d.id;
        }
        if (data.type === "like") {
          liked = true;
          lDocId = d.id;
        }
      });

      setIsBookmarked(bookmarked);
      setIsLiked(liked);
      setBookmarkDocId(bDocId);
      setLikeDocId(lDocId);
    });

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

    if (isBookmarked && bookmarkDocId) {
      await deleteDoc(doc(db, "user_library", bookmarkDocId));
    } else {
      const newDocRef = doc(collection(db, "user_library"));
      await setDoc(newDocRef, {
        userId: user.uid,
        slug,
        title: data.title || "",
        thumb: data.thumb || "",
        type: "bookmark",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }, [user, slug, data, isBookmarked, bookmarkDocId]);

  /* ─── Toggle Like ─── */
  const toggleLike = useCallback(async () => {
    if (!user) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    if (!slug || !data) return;

    if (isLiked && likeDocId) {
      await deleteDoc(doc(db, "user_library", likeDocId));
    } else {
      const newDocRef = doc(collection(db, "user_library"));
      await setDoc(newDocRef, {
        userId: user.uid,
        slug,
        title: data.title || "",
        thumb: data.thumb || "",
        type: "like",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }, [user, slug, data, isLiked, likeDocId]);

  /* ═══════════════════════════════════════════════════
     FIREBASE: READING PROGRESS (user_reading_progress)
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

    const progressDocId = `${user.uid}_${slug}`;
    const unsub = onSnapshot(
      doc(db, "user_reading_progress", progressDocId),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setReadChapters(d.readChapters || []);
          setLastReadChapterSlug(d.chapterSlug || null);
          setLastReadPage(d.page || 0);
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

  /* ─── Mark Chapter as Read ─── */
  const markChapterAsRead = useCallback(
    async (chapterSlug: string) => {
      if (!user?.uid || !slug) return;

      const progressDocId = `${user.uid}_${slug}`;
      const progressRef = doc(db, "user_reading_progress", progressDocId);

      // Get current data
      const currentSnap = await getDoc(progressRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      const currentRead = currentData.readChapters || [];

      if (currentRead.includes(chapterSlug)) {
        // Already read, just update last read
        await setDoc(
          progressRef,
          {
            userId: user.uid,
            slug,
            chapterSlug,
            chapterNumber:
              data?.chapter_list?.find((c) => c.slug === chapterSlug)?.chapter_number || "",
            page: 0,
            readChapters: currentRead,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      // Add to read chapters
      const newReadChapters = [...currentRead, chapterSlug];

      await setDoc(
        progressRef,
        {
          userId: user.uid,
          slug,
          chapterSlug,
          chapterNumber:
            data?.chapter_list?.find((c) => c.slug === chapterSlug)?.chapter_number || "",
          page: 0,
          readChapters: newReadChapters,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user?.uid, slug, data]
  );

  /* ─── Save Reading Position (dari ChapterReader) ─── */
  const saveReadingPosition = useCallback(
    async (chapterSlug: string, page: number) => {
      if (!user?.uid || !slug) return;

      const progressDocId = `${user.uid}_${slug}`;
      const progressRef = doc(db, "user_reading_progress", progressDocId);

      const currentSnap = await getDoc(progressRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};
      const currentRead = currentData.readChapters || [];

      await setDoc(
        progressRef,
        {
          userId: user.uid,
          slug,
          chapterSlug,
          chapterNumber:
            data?.chapter_list?.find((c) => c.slug === chapterSlug)?.chapter_number || "",
          page,
          readChapters: currentRead,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user?.uid, slug, data]
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
          setData(res.data);
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
    if (!data?.chapter_list) return [];
    return data.chapter_list.map((ch) => ({
      slug: ch.slug,
      chapter_number: ch.chapter_number,
      release_date: ch.release_date,
    }));
  }, [data?.chapter_list]);

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
    if (!data?.genre) return [];
    return Array.isArray(data.genre) ? data.genre : [data.genre];
  }, [data?.genre]);

  const displayTotalChapters = useMemo(() => {
    return data?.chapter_list?.length || 0;
  }, [data?.chapter_list]);

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

    // Reading Progress (NEW — untuk ChapterReader)
    saveReadingPosition,
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
