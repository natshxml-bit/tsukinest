// app/library/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  doc,
  onSnapshot,
  writeBatch,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { MangaItem } from "@/lib/api";
import { useAccent } from "@/lib/accent";
import { ImageIcon, Heart, Bookmark as BookmarkIcon, Clock } from "lucide-react";

interface LibraryItem extends MangaItem {
  id: string;
  savedAt: number;
  lastReadChapter?: string;
  updatedAt?: number;
  lastReadAt?: number;
  totalChapters?: number;
  status?: "ongoing" | "completed" | "hiatus";
  poster?: string;
  cover?: string;
  image?: string;
  thumbnail?: string;
  thumb_url?: string;
}

type TabType = "bookmark" | "like" | "history";
type SortType = "newest" | "oldest" | "alpha" | "updated";
type ViewType = "grid" | "list";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatTypeWithFlag(rawType: string): string {
  if (!rawType) return "🇯🇵 MANGA";
  const t = rawType.toUpperCase();
  if (t.includes("MANHWA")) return "🇰🇷 MANHWA";
  if (t.includes("MANHUA")) return "🇨🇳 MANHUA";
  if (t.includes("MANGA")) return "🇯🇵 MANGA";
  return t;
}

function cleanThumbRaw(item: LibraryItem): string {
  const candidates = [
    item.thumb,
    item.poster,
    item.cover,
    item.image,
    item.thumbnail,
    item.thumb_url,
  ];
  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("http") || trimmed.startsWith("/")) return trimmed;
    if (trimmed.includes("<img")) {
      const match = trimmed.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) return match[1];
    }
    if (trimmed.includes("src=")) {
      const match = trimmed.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) return match[1];
    }
    if (trimmed.startsWith("data:image")) return trimmed;
  }
  return "/no-image.png";
}

function cleanThumbUrl(url: string): string {
  if (!url) return "/no-image.png";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  if (url.startsWith("http") && !url.includes("wsrv.nl") && !url.includes("anilist.co")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp&q=70`;
  }
  return url;
}

function getOriginalUrl(url: string): string {
  if (!url) return "";
  try {
    if (url.includes("wsrv.nl")) {
      const urlObj = new URL(url);
      const originalUrl = urlObj.searchParams.get("url");
      if (originalUrl) return decodeURIComponent(originalUrl);
    }
  } catch { /* ignore */ }
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  return finalUrl;
}

// ─── SMART IMAGE ───
const SmartImage = memo(function SmartImage({
  src, alt, title, fill, className = "", priority, ...props
}: any) {
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [loaded, setLoaded] = useState(false);
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false);
  const [hasTriedAniList, setHasTriedAniList] = useState(false);

  const fetchAniListFallback = async () => {
    if (hasTriedAniList) return;
    setHasTriedAniList(true);
    try {
      const cleanTitle = (title || "").split(/[-–—~,|:]/)[0].replace(/[★☆]/g, " ").trim();
      const query = `query ($search: String) { Media (search: $search, type: MANGA) { coverImage { extraLarge large } } }`;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search: cleanTitle } }),
      });
      if (!res.ok) { setImgSrc("/no-image.png"); return; }
      const json = await res.json();
      const altPoster = json?.data?.Media?.coverImage?.extraLarge || json?.data?.Media?.coverImage?.large;
      setImgSrc(altPoster || "/no-image.png");
    } catch { setImgSrc("/no-image.png"); }
  };

  useEffect(() => {
    setLoaded(false);
    const isPlaceholder = !src || src.includes("via.placeholder.com") || src.includes("no-image.png");
    if (isPlaceholder) fetchAniListFallback();
    else { setImgSrc(src); setHasTriedOriginal(false); setHasTriedAniList(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleLoad = () => setLoaded(true);

  const handleError = () => {
    if (imgSrc.includes("wsrv.nl") && !hasTriedOriginal) {
      setHasTriedOriginal(true);
      const original = getOriginalUrl(imgSrc);
      if (original && original !== imgSrc) { setImgSrc(original); return; }
    }
    fetchAniListFallback();
  };

  if (imgSrc === "/no-image.png" && loaded) {
    return (
      <div className={cn("bg-[#1c1c1c] flex flex-col items-center justify-center text-center p-2", fill ? "absolute inset-0 w-full h-full" : "w-full h-full", className)}>
        <ImageIcon className="text-neutral-700 w-6 h-6 mb-1" />
        <span className="text-[10px] text-neutral-600 font-medium line-clamp-2 px-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        fill ? "absolute inset-0 w-full h-full object-cover" : "",
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...(priority ? { fetchPriority: "high" as any } : {})}
      {...props}
    />
  );
});

export default function LibraryPage() {
  const { accent, style: accentStyle } = useAccent();

  const [activeTab, setActiveTab] = useState<TabType>("like");
  const [libraryData, setLibraryData] = useState<LibraryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "info",
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "default";
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "default",
  });

  const triggerToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ show: true, message, type });
    },
    []
  );

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoadingUser(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoadingData(true);
    setIsEditMode(false);
    setSelectedIds(new Set());
    setSearchQuery("");

    const colName = activeTab === "like" ? "likes" : activeTab === "history" ? "history" : "bookmarks";
    const q = query(
      collection(db, "users", user.uid, colName),
      orderBy("savedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data: LibraryItem[] = [];
        snapshot.forEach((d) => {
          const rawData = d.data();
          data.push({ id: d.id, ...rawData } as LibraryItem);
        });
        setLibraryData(data);
        setIsLoadingData(false);
      },
      (err) => {
        console.error(err);
        triggerToast("Gagal memuat data dari basis data.", "error");
        setIsLoadingData(false);
      }
    );
    return () => unsub();
  }, [activeTab, user, triggerToast]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isEditMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditMode(false);
        setSelectedIds(new Set());
      }
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      }
      if (e.key === "Delete" && selectedIds.size > 0) {
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditMode, selectedIds, libraryData]);

  const filteredData = useMemo(() => {
    let data = [...libraryData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.latest_chapter?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "oldest":
        data.sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
        break;
      case "alpha":
        data.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "", "id")
        );
        break;
      case "updated":
        data.sort(
          (a, b) => (b.updatedAt || b.savedAt || 0) - (a.updatedAt || a.savedAt || 0)
        );
        break;
      default: // newest
        data.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }

    return data;
  }, [libraryData, searchQuery, sortBy]);

  const hasUpdates = useMemo(
    () => libraryData.filter((m) => m.updatedAt && m.updatedAt > (m.savedAt || 0)).length,
    [libraryData]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((i) => i.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setConfirmModal({
      show: true,
      title: "Hapus Pilihan",
      message: `Anda yakin ingin menghapus ${selectedIds.size} seri komik terpilih?`,
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, show: false }));
        setIsLoadingData(true);
        try {
          const colName = activeTab === "like" ? "likes" : activeTab === "history" ? "history" : "bookmarks";
          const batch = writeBatch(db);
          selectedIds.forEach((id) => {
            batch.delete(doc(db, "users", user.uid, colName, id));
          });
          await batch.commit();
          setIsEditMode(false);
          setSelectedIds(new Set());
          triggerToast(`${selectedIds.size} item berhasil dihapus.`, "success");
        } catch (e) {
          triggerToast("Terjadi kesalahan saat menghapus data.", "error");
        } finally {
          setIsLoadingData(false);
        }
      },
    });
  };

  const handleClearAll = async () => {
    if (!user || libraryData.length === 0) return;
    setConfirmModal({
      show: true,
      title: `Kosongkan ${activeTab === "like" ? "Disukai" : activeTab === "history" ? "History" : "Bookmark"}`,
      message: `Anda yakin ingin menghapus semua ${libraryData.length} item? Tindakan ini tidak bisa dibatalkan.`,
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal((p) => ({ ...p, show: false }));
        setIsLoadingData(true);
        try {
          const colName = activeTab === "like" ? "likes" : activeTab === "history" ? "history" : "bookmarks";
          const snapshot = await getDocs(
            collection(db, "users", user.uid, colName)
          );
          const batch = writeBatch(db);
          snapshot.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          triggerToast("Semua data berhasil dikosongkan.", "success");
        } catch (e) {
          triggerToast("Gagal mengosongkan data.", "error");
        } finally {
          setIsLoadingData(false);
        }
      },
    });
  };

  const handleExport = () => {
    const data = libraryData.map((item) => ({
      title: item.title,
      slug: item.slug,
      chapter: item.latest_chapter || item.lastReadChapter,
      url: `https://manhwaindo.my/detail/${item.slug}`,
      savedAt: item.savedAt ? new Date(item.savedAt).toISOString() : null,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-${user?.uid?.slice(0, 8)}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast("Data berhasil diekspor!", "success");
  };

  const getRelativeTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "baru saja";
    if (m < 60) return `${m} mnt`;
    if (h < 24) return `${h} jam`;
    if (d < 30) return `${d} hr`;
    if (d < 365) return `${Math.floor(d / 30)} bln`;
    return `${Math.floor(d / 365)} thn`;
  };

  const sortOptions: { key: SortType; label: string }[] = [
    { key: "newest", label: "Terbaru" },
    { key: "oldest", label: "Terlama" },
    { key: "alpha", label: "A-Z" },
    { key: "updated", label: "Update Terbaru" },
  ];

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
        <div
          className={`w-10 h-10 rounded-full border-4 border-white/10 ${
            accent === "custom"
              ? "border-t-[var(--tsuki-custom-hex)]"
              : accentStyle.border.replace("border-", "border-t-")
          } animate-spin`}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div
          className={`w-24 h-24 rounded-3xl ${accentStyle.soft} flex items-center justify-center mb-6 ring-1 ${accentStyle.border}`}
        >
          <span className="text-5xl">🔐</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Akses Diblokir</h2>
        <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">
          Silakan masuk (Log In) untuk menggunakan fitur ini.
        </p>
        <Link href="/profile">
          <button
            className={`${accentStyle.bg} hover:brightness-110 text-white font-bold py-3.5 px-10 rounded-2xl ${accentStyle.glow} transition-all active:scale-95`}
          >
            Masuk ke Akun
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white relative overflow-x-hidden">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className={`p-4 rounded-2xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : `${accentStyle.soft} ${accentStyle.border} ${accentStyle.text}`
            }`}
          >
            <span className="text-lg">
              {toast.type === "success"
                ? "✅"
                : toast.type === "error"
                ? "🚫"
                : "ℹ️"}
            </span>
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-3">
            {[
              { key: "bookmark" as TabType, label: "Bookmark", icon: <BookmarkIcon className="w-4 h-4" /> },
              { key: "like" as TabType, label: "Disukai", icon: <Heart className={cn("w-4 h-4", activeTab === "like" && "fill-current")} /> },
              { key: "history" as TabType, label: "Riwayat", icon: <Clock className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative flex-1 py-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-300 ${
                  activeTab === t.key
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {activeTab === t.key && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  {t.icon}
                  {t.label}
                  {activeTab === t.key && (
                    <span className="ml-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-white/20">
                      {libraryData.length}
                    </span>
                  )}
                </span>

                {activeTab === t.key && (
                  <div
                    className={`absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-6 h-1 ${accentStyle.bg} rounded-full ${accentStyle.glow}`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Search & Controls */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari judul komik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e1e24] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-9 h-9 rounded-xl bg-[#1e1e24] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
              </button>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          sortBy === opt.key
                            ? `${accentStyle.text} bg-white/5 font-semibold`
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View Toggle */}
            <button
              onClick={() =>
                setViewType((v) => (v === "grid" ? "list" : "grid"))
              }
              className="w-9 h-9 rounded-xl bg-[#1e1e24] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {viewType === "grid" ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Stats Bar */}
          {!isEditMode && libraryData.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pb-1">
              <span>
                {filteredData.length} dari {libraryData.length} item
                {searchQuery && " (terfilter)"}
              </span>
              {hasUpdates > 0 && (activeTab === "bookmark" || activeTab === "like") && (
                <span className="text-red-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {hasUpdates} update baru
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          {isEditMode ? (
            <div className="flex items-center gap-2 w-full animate-in slide-in-from-right-3 fade-in duration-200">
              <button
                onClick={selectAll}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e24] hover:bg-white/10 border border-white/5 text-xs font-bold transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selectedIds.size === filteredData.length &&
                    filteredData.length > 0
                      ? `${accentStyle.bg} border-transparent`
                      : "border-gray-500"
                  }`}
                >
                  {selectedIds.size === filteredData.length &&
                    filteredData.length > 0 && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                </div>
                Pilih Semua
                <span className="text-gray-500">
                  ({selectedIds.size}/{filteredData.length})
                </span>
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 rounded-xl bg-[#1e1e24] border border-white/5 text-xs font-bold transition-colors text-gray-300 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 disabled:opacity-30 text-xs font-bold transition-colors"
              >
                Hapus ({selectedIds.size})
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setIsEditMode(true)}
                disabled={libraryData.length === 0 || isLoadingData}
                className="px-4 py-2 rounded-xl bg-[#1e1e24] disabled:opacity-30 border border-white/5 text-xs font-bold transition-colors hover:bg-white/5"
              >
                Edit
              </button>
              <button
                onClick={handleExport}
                disabled={libraryData.length === 0}
                className="w-9 h-9 rounded-xl bg-[#1e1e24] disabled:opacity-30 border border-white/5 flex items-center justify-center transition-colors hover:bg-white/5"
                title="Export JSON"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
              {libraryData.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-9 h-9 rounded-xl bg-[#1e1e24] border border-white/5 flex items-center justify-center transition-colors hover:bg-red-500/10 group"
                  title="Kosongkan Semua"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoadingData ? (
          <div className="flex justify-center py-24">
            <div
              className={`w-10 h-10 rounded-full border-4 border-white/10 ${
                accent === "custom"
                  ? "border-t-[var(--tsuki-custom-hex)]"
                  : accentStyle.border.replace("border-", "border-t-")
              } animate-spin`}
            />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-gray-500">
            <div className="w-20 h-20 rounded-3xl bg-[#1e1e24] flex items-center justify-center mb-5 ring-1 ring-white/5">
              <span className="text-4xl">
                {searchQuery ? "🔍" : "📭"}
              </span>
            </div>
            <p className="text-base font-bold text-gray-300">
              {searchQuery ? "Tidak Ditemukan" : "Data Kosong"}
            </p>
            <p className="text-xs mt-1.5 text-gray-500 max-w-[200px] text-center">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : "Anda belum menambahkan data pada bagian ini."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`mt-4 px-4 py-2 rounded-xl ${accentStyle.bg} text-white text-xs font-bold transition-all hover:brightness-110`}
              >
                Hapus Pencarian
              </button>
            )}
            {!searchQuery && (activeTab === "bookmark" || activeTab === "like") && (
              <Link href="/" className="mt-4">
                <button
                  className={`px-4 py-2 rounded-xl ${accentStyle.bg} text-white text-xs font-bold transition-all hover:brightness-110`}
                >
                  Jelajahi Komik
                </button>
              </Link>
            )}
          </div>
        ) : viewType === "grid" ? (
          <div className="grid grid-cols-3 gap-3">
            {filteredData.map((manga) => {
              const cleanTitle =
                manga.title?.replace(/subtitle indonesia/i, "").trim() ||
                "Tidak ada judul";
              const isSelected = selectedIds.has(manga.id);
              const hasUpdate =
                manga.updatedAt && manga.updatedAt > (manga.savedAt || 0);
              const thumbUrl = cleanThumbUrl(cleanThumbRaw(manga));
              const typeLabel = formatTypeWithFlag(manga.type || "");

              const CardContent = (
                <div
                  className={`relative rounded-2xl overflow-hidden bg-[#1e1e24] aspect-[3/4] transition-all duration-300 ${
                    isEditMode && isSelected
                      ? `scale-[0.95] opacity-80 ring-2 ${
                          accent === "custom"
                            ? "ring-[var(--tsuki-custom-hex)] shadow-[0_0_20px_var(--tsuki-custom-hex)]"
                            : accentStyle.border.replace("border-", "ring-") +
                              " " +
                              accentStyle.glow
                        }`
                      : "ring-1 ring-white/5 hover:ring-white/10 hover:shadow-2xl"
                  }`}
                >
                  <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 pointer-events-none">
                    <span className="px-1.5 py-[2px] rounded-md text-[8px] font-bold text-white/90 uppercase bg-black/70 border border-white/10 tracking-wide">
                      {typeLabel}
                    </span>
                    {hasUpdate && (
                      <span className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black border border-red-400/50 shadow-lg shadow-red-500/20 animate-pulse">
                        TERBARU
                      </span>
                    )}
                    {manga.status === "completed" && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/80 text-white text-[10px] font-bold border border-emerald-400/50">
                        END
                      </span>
                    )}
                  </div>

                  <SmartImage
                    src={thumbUrl}
                    alt={cleanTitle}
                    title={cleanTitle}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/40 to-transparent opacity-90 pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 flex flex-col pointer-events-none">
                    <p
                      className={`text-[9px] font-medium ${accentStyle.text} mb-0.5 flex items-center gap-1 drop-shadow-md`}
                    >
                      {activeTab === "history" && manga.lastReadChapter
                        ? manga.lastReadChapter
                        : manga.latest_chapter || "Ch. ?"}
                    </p>
                    <h3 className="text-[11px] font-bold leading-tight line-clamp-2 drop-shadow-lg text-white/95">
                      {cleanTitle}
                    </h3>
                  </div>
                </div>
              );

              return (
                <div key={manga.id} className="relative group">
                  {isEditMode && (
                    <div
                      className={`absolute -top-2 -left-2 z-30 w-7 h-7 rounded-full bg-[#0a0a0f] border-2 flex items-center justify-center shadow-xl transition-all pointer-events-none ${
                        isSelected ? accentStyle.border : "border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className={`w-4 h-4 ${accentStyle.text}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  {isEditMode ? (
                    <div
                      onClick={() => toggleSelection(manga.id)}
                      className="cursor-pointer"
                    >
                      {CardContent}
                    </div>
                  ) : (
                    <Link href={`/detail/${manga.slug}`}>
                      {CardContent}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-2">
            {filteredData.map((manga) => {
              const cleanTitle =
                manga.title?.replace(/subtitle indonesia/i, "").trim() ||
                "Tidak ada judul";
              const isSelected = selectedIds.has(manga.id);
              const hasUpdate =
                manga.updatedAt && manga.updatedAt > (manga.savedAt || 0);
              const thumbUrl = cleanThumbUrl(cleanThumbRaw(manga));
              const typeLabel = formatTypeWithFlag(manga.type || "");

              return (
                <div
                  key={manga.id}
                  className={`relative flex items-center gap-3 p-2.5 rounded-xl bg-[#1e1e24] border transition-all duration-200 ${
                    isEditMode && isSelected
                      ? `border-2 ${
                          accent === "custom"
                            ? "border-[var(--tsuki-custom-hex)]"
                            : accentStyle.border
                        }`
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  {isEditMode && (
                    <div
                      onClick={() => toggleSelection(manga.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors"
                      style={{
                        borderColor: isSelected
                          ? accent === "custom"
                            ? "var(--tsuki-custom-hex)"
                            : undefined
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {isSelected && (
                        <svg
                          className={`w-3.5 h-3.5 ${accentStyle.text}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/detail/${manga.slug}`}
                    className="flex-shrink-0 relative w-14 h-[4.5rem] rounded-lg overflow-hidden ring-1 ring-white/5"
                  >
                    <SmartImage
                      src={thumbUrl}
                      alt={cleanTitle}
                      title={cleanTitle}
                      fill
                      loading="lazy"
                      className="object-cover"
                    />
                    {hasUpdate && (
                      <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-red-500 border border-black" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1 py-[1px] rounded text-[7px] font-bold text-white/80 uppercase bg-black/70 border border-white/10 tracking-wide">
                        {typeLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate leading-tight">
                      {cleanTitle}
                    </h3>
                    <p
                      className={`text-xs ${accentStyle.text} mt-0.5 font-medium`}
                    >
                      {activeTab === "history" && manga.lastReadChapter
                        ? `Terakhir: ${manga.lastReadChapter}`
                        : manga.latest_chapter || "Ch. ?"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {getRelativeTime(manga.savedAt)}
                      </span>
                      {manga.status === "completed" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          END
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditMode && activeTab === "history" && (manga.chapter_slug || manga.slug) && (
  <Link
    href={`/read/${manga.chapter_slug || manga.slug}`}
    className={`flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#1c1c1c] ${accentStyle.text} text-xs font-bold hover:bg-[#262626] transition-all`}
  >
    Lanjut
  </Link>
)}


                  {!isEditMode && (activeTab === "bookmark" || activeTab === "like") && hasUpdate && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e24] border border-white/5 w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-2xl ${
                confirmModal.variant === "danger"
                  ? "bg-red-500/10"
                  : accentStyle.soft
              } flex items-center justify-center mx-auto mb-4 ring-1 ${
                confirmModal.variant === "danger"
                  ? "ring-red-500/20"
                  : accentStyle.border
              }`}
            >
              <span className="text-2xl">
                {confirmModal.variant === "danger" ? "🗑️" : "⚠️"}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-400 mb-7 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, show: false }))
                }
                className="flex-1 py-3 rounded-xl bg-[#0F0F12] text-sm font-bold transition-colors hover:bg-white/5"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all hover:brightness-110 ${
                  confirmModal.variant === "danger"
                    ? "bg-red-500 hover:bg-red-400"
                    : `${accentStyle.bg}`
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
