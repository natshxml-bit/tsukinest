"use client";

import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, User as UserIcon, Star, Clock, Grid3X3, LayoutList,
  BadgeCheck, MessageCircle, WifiOff, RefreshCw, History, X, ChevronRight,
  AlertCircle, Sparkles, Shuffle, Crown, Play, TrendingUp, Flame,
  BookOpen, Zap, ChevronLeft, Heart, Eye,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

import { type MangaItem as ImportedMangaItem, getHome, unwrap, type ApiEnvelope } from "@/lib/api";
import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { cleanThumb } from "@/utils/image";
import { formatMangaType } from "@/utils/manga";
import SmartImage from "@/components/ui/SmartImage";
import HeroCarousel from "@/components/manga/HeroCarousel";

// =============================================================================
// TYPES & HELPERS
// =============================================================================

type MangaItem = ImportedMangaItem & {
  is_new?: boolean;
  chapters?: any[];
};

type AccentStyle = Record<string, string>;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Selamat Pagi", icon: "☀️" };
  if (hour >= 12 && hour < 15) return { text: "Selamat Siang", icon: "🌤️" };
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", icon: "🌅" };
  return { text: "Selamat Malam", icon: "🌙" };
}

function timeAgo(date: unknown): string {
  if (!date) return "Baru saja";
  const past = (date as { toDate?: () => Date }).toDate
    ? (date as { toDate: () => Date }).toDate()
    : new Date(date as string);
  const seconds = Math.floor((Date.now() - past.getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

const SEEN_NOTIF_KEY = "tsukinest_seen_notifs_v2";
const RECENT_READS_KEY = "tsukinest_recent_reads";

interface RecentRead {
  slug: string;
  title: string;
  thumb: string;
  chapter: string;
  timestamp: number;
  progress?: number;
}

interface DbNotif {
  id: string;
  userId: string;
  triggerUserId: string;
  triggerUserName: string;
  triggerUserPhoto: string;
  type: string;
  slug: string;
  chapter: string;
  message: string;
  isRead: boolean;
  createdAt: unknown;
}

interface HomeData {
  data?: {
    project_update?: ApiEnvelope<any[]>;
    mirror_update?: ApiEnvelope<any[]>;
    recommended?: {
      manhwa?: ApiEnvelope<any[]>;
      manga?: ApiEnvelope<any[]>;
      manhua?: ApiEnvelope<any[]>;
    };
    top?: {
      daily?: ApiEnvelope<any[]>;
      weekly?: ApiEnvelope<any[]>;
      all_time?: ApiEnvelope<any[]>;
    };
  };
  cached_at?: string;
}

// =============================================================================
// TRANSFORM ITEM
// =============================================================================

function transformItem(item: any): MangaItem {
  const rawItem = item || {};
  const taxonomy = rawItem.taxonomy || {};

  const formatArr = taxonomy.Format;
  let rawType: string;
  if (Array.isArray(formatArr) && formatArr.length > 0) {
    rawType = String(formatArr[0]?.slug || formatArr[0]?.name || "").toUpperCase() || "MANGA";
  } else if (rawItem.country_id) {
    const countryMap: Record<string, string> = { KR: "MANHWA", JP: "MANGA", CN: "MANHUA" };
    rawType = countryMap[String(rawItem.country_id).toUpperCase()] || "MANGA";
  } else if (typeof rawItem.type === "string" && rawItem.type) {
    rawType = rawItem.type.toUpperCase();
  } else {
    rawType = "MANGA";
  }

  const genres = Array.isArray(taxonomy.Genre)
    ? taxonomy.Genre.map((g: any) => g?.name).filter(Boolean)
    : Array.isArray(rawItem.genres) ? rawItem.genres : [];

  const rawChapter = rawItem.latest_chapter || rawItem.chapter || rawItem.latest_chapter_number;
  const formattedChapter = rawChapter
    ? (String(rawChapter).toLowerCase().includes("ch") ? String(rawChapter) : `Ch. ${rawChapter}`)
    : "Ch. ?";

  const rawRating = rawItem.rating || rawItem.user_rate;
  const formattedRating = rawRating && String(rawRating) !== "0" ? String(rawRating) : "0";

  return {
    title: typeof rawItem.title === "string" ? rawItem.title : "Untitled",
    slug: rawItem.slug || rawItem.manga_id || "",
    thumb: cleanThumb(rawItem.thumb || rawItem.cover_image_url || rawItem.cover || ""),
    type: rawType,
    latest_chapter: formattedChapter,
    rating: formattedRating,
    link: typeof rawItem.link === "string" ? rawItem.link : "",
    is_colored: Boolean(rawItem.is_colored),
    is_hot: Boolean(rawItem.is_hot),
    is_new: Boolean(rawItem.is_new),
    synopsis: rawItem.synopsis || rawItem.description || "",
    genres,
    chapters: Array.isArray(rawItem.chapters) ? rawItem.chapters : [],
  } as MangaItem;
}

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

function getSeenSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(SEEN_NOTIF_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveSeenSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SEEN_NOTIF_KEY, JSON.stringify(slugs.slice(0, 50))); } catch { /* ignore */ }
}
function getRecentReads(): RecentRead[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(RECENT_READS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

// =============================================================================
// CACHE & HOOKS
// =============================================================================

let globalCache: { home: HomeData | null; timestamp: number } = { home: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000;

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const applyStatus = (online: boolean) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (online) setIsOnline(true);
      else debounceTimer = setTimeout(() => setIsOnline(false), 1500);
    };
    applyStatus(navigator.onLine);
    const on = () => applyStatus(true);
    const off = () => applyStatus(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return isOnline;
}

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isRefreshing = useRef(false);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing.current) startY.current = e.touches[0].clientY;
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) { setPulling(true); setPullDistance(Math.min(diff * 0.4, 80)); }
  }, []);
  const onTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing.current) {
      isRefreshing.current = true; setPullDistance(0); setPulling(false);
      await onRefresh(); isRefreshing.current = false;
    } else { setPullDistance(0); setPulling(false); }
    startY.current = 0;
  }, [pullDistance, onRefresh]);
  return { pulling, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
}

// =============================================================================
// HEADER — Netflix-style transparent header
// =============================================================================

function Header({ onNotifClick, hasUnread, user, onSearchClick, accentStyle, scrolled }: {
  onNotifClick: () => void; hasUnread: boolean; user: FirebaseUser | null;
  onSearchClick: () => void; accentStyle: AccentStyle; scrolled: boolean;
}) {
  const { text: greeting, icon } = getGreeting();
  const displayName = user?.displayName || "Guest";
  const photoURL = user?.photoURL;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      )}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-16">
        {/* Left: Avatar + Greeting */}
        <Link href="/profile" prefetch={false} className="flex items-center gap-3 group">
          <div className="relative">
            <div className={cn(
              "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300",
              "bg-gradient-to-br from-[#1a1a2e] to-[#16213e] ring-2 ring-white/10",
              "group-hover:ring-white/25 group-active:scale-90"
            )}>
              {photoURL ? (
                <Image src={photoURL} alt={displayName} width={40} height={40} className="object-cover w-full h-full" unoptimized />
              ) : (
                <UserIcon className="w-4.5 h-4.5 text-neutral-400" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center text-[9px] ring-1 ring-white/10">
              {icon}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">{greeting}</span>
            <span className="text-[15px] font-bold text-white leading-tight truncate max-w-[130px]">{displayName}</span>
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSearchClick}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-neutral-200 hover:bg-white/[0.12] active:scale-90 transition-all duration-200"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onNotifClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-neutral-200 hover:bg-white/[0.12] active:scale-90 transition-all duration-200"
          >
            <Bell className="w-[18px] h-[18px]" />
            {hasUnread && (
              <span className={cn("absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-[#0a0a0a] animate-pulse", accentStyle.bg)} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// QUICK SEARCH — Netflix-style full overlay
// =============================================================================

function QuickSearchBar({ open, onClose, accentStyle }: { open: boolean; onClose: () => void; accentStyle: AccentStyle }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); onClose(); }
  };

  const popularGenres = ["Action", "Romance", "Fantasy", "Comedy", "Drama", "Horror", "Isekai", "Slice of Life", "Thriller", "Adventure"];

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a]/98 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Search Input */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] text-neutral-300 active:scale-90 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <form onSubmit={handleSubmit} className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari judul, genre, author..."
              className={cn(
                "w-full h-12 bg-white/[0.06] border border-white/[0.1] rounded-2xl pl-12 pr-4 text-[15px] text-white placeholder-neutral-500",
                "focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all duration-300"
              )}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          </form>
        </div>

        {/* Trending Searches */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-neutral-400" />
            <p className="text-sm font-semibold text-neutral-300">Trending Pencarian</p>
          </div>
          <div className="space-y-1">
            {["Solo Leveling", "Omniscient Reader", "Tower of God", "Nano Machine", "Return of Mount Hua"].map((term, i) => (
              <button
                key={term}
                onClick={() => { router.push(`/search?q=${encodeURIComponent(term)}`); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors text-left"
              >
                <span className="text-sm font-bold text-neutral-600 w-5">{i + 1}</span>
                <span className="text-sm text-neutral-300">{term}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Genre Chips */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-4 h-4 text-neutral-400" />
            <p className="text-sm font-semibold text-neutral-300">Jelajahi Genre</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularGenres.map((genre) => (
              <Link
                key={genre}
                href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`}
                prefetch={false}
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[13px] font-medium text-neutral-300 hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all duration-200"
              >
                {genre}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NOTIFICATION POPUP — Modern sheet style
// =============================================================================

function NotifPopup({ open, onClose, items, onMarkRead, dbNotifs, user, accentStyle }: {
  open: boolean; onClose: () => void; items: MangaItem[]; onMarkRead: () => void;
  dbNotifs: DbNotif[]; user: FirebaseUser | null; accentStyle: AccentStyle;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"updates" | "activity">("updates");
  if (!open) return null;

  const unreadActivityCount = dbNotifs.filter((n) => !n.isRead).length;

  const handleReadFirebaseNotif = async (notif: DbNotif) => {
    if (!notif.isRead) {
      try { await updateDoc(doc(db, "notifications", notif.id), { isRead: true }); } catch { /* ignore */ }
    }
    onClose(); router.push(`/manga/${notif.slug}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-[50] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[55] animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="max-w-lg mx-auto bg-[#111111] border-t border-white/[0.08] rounded-t-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Tabs */}
          <div className="flex px-4 pt-2 border-b border-white/[0.05]">
            <button
              onClick={() => setActiveTab("updates")}
              className={cn(
                "flex-1 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 relative",
                activeTab === "updates" ? "text-white border-white" : "text-neutral-500 border-transparent"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Update
              </span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={cn(
                "flex-1 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 relative",
                activeTab === "activity" ? "text-white border-white" : "text-neutral-500 border-transparent"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Aktivitas
                {unreadActivityCount > 0 && (
                  <span className="absolute top-2 right-8 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadActivityCount}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Mark all read */}
          {activeTab === "updates" && items.length > 0 && (
            <div className="px-4 py-2.5 flex justify-end border-b border-white/[0.04]">
              <button onClick={() => { onMarkRead(); onClose(); }} className={cn("text-xs font-medium px-3 py-1.5 rounded-full transition hover:opacity-80", accentStyle.text, accentStyle.bg, "bg-opacity-10")}>
                ✓ Tandai semua dibaca
              </button>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto p-3 space-y-1 flex-1">
            {activeTab === "updates" && (
              <>
                {items.slice(0, 10).map((item) => (
                  <Link
                    href={`/manga/${item.slug}`} prefetch={false}
                    onClick={() => { onMarkRead(); onClose(); }}
                    key={item.slug}
                    className="flex gap-3.5 items-center p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a] shadow-md">
                      <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill className="object-cover" sizes="48px" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      <p className={cn("text-xs mt-1 font-medium", accentStyle.text)}>{item.latest_chapter}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{formatMangaType(item.type)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm">Belum ada update terbaru</p>
                  </div>
                )}
              </>
            )}
            {activeTab === "activity" && (
              <>
                {!user ? (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm">Login untuk melihat notifikasi</p>
                  </div>
                ) : dbNotifs.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm">Belum ada aktivitas</p>
                  </div>
                ) : (
                  dbNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleReadFirebaseNotif(notif)}
                      className={cn(
                        "flex gap-3 items-start p-3.5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]",
                        notif.isRead ? "hover:bg-white/[0.03]" : "bg-white/[0.03] border border-white/[0.06]"
                      )}
                    >
                      <img src={notif.triggerUserPhoto || "/no-avatar.png"} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#1a1a1a] ring-1 ring-white/10" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-300 leading-relaxed">
                          <span className="font-semibold text-white">{notif.triggerUserName}</span> {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("text-[11px] font-medium", accentStyle.text)}>Bab {notif.chapter}</span>
                          <span className="text-[11px] text-neutral-600">•</span>
                          <span className="text-[11px] text-neutral-500">{timeAgo(notif.createdAt)}</span>
                        </div>
                      </div>
                      {!notif.isRead && <div className={cn("w-2 h-2 rounded-full shrink-0 mt-2", accentStyle.bg)} />}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// SECTION HEADER — Netflix-style
// =============================================================================

function SectionHeader({ title, icon: Icon, actionLabel, actionHref, accentStyle, subtitle, badge }: {
  title: string; icon?: React.ElementType; actionLabel?: string; actionHref?: string;
  accentStyle: AccentStyle; subtitle?: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-lg", accentStyle.bg)}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-[17px] leading-tight tracking-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {actionLabel && (
        <Link
          href={actionHref || "#"} prefetch={false}
          className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-white/[0.04]"
        >
          {actionLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// MANGA CARD — Netflix/Webtoon hybrid card
// =============================================================================

const MangaCard = memo(function MangaCard({ item, variant = "default", accentStyle, rank }: {
  item: MangaItem; variant?: "default" | "compact" | "project"; accentStyle: AccentStyle; rank?: number;
}) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block h-full group active:scale-[0.96] transition-transform duration-200">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-2xl bg-[#141414] aspect-[2/3] mb-2.5 shadow-lg shadow-black/30">
          <SmartImage
            src={item.thumb || "/no-image.png"} alt={item.title} title={item.title}
            fill loading="lazy" decoding="async" className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 20vw" unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 pointer-events-none z-10">
            <div className="flex flex-col gap-1">
              <span className="px-2 py-[3px] rounded-lg text-[9px] font-bold text-white uppercase bg-black/60 backdrop-blur-sm border border-white/10 tracking-wider">
                {formatMangaType(item.type)}
              </span>
              {item.is_hot && (
                <span className="px-2 py-[3px] rounded-lg text-[9px] font-bold text-white uppercase bg-red-500/90 backdrop-blur-sm flex items-center gap-0.5 w-fit">
                  <Flame className="w-2.5 h-2.5" /> HOT
                </span>
              )}
              {item.is_new && !item.is_hot && (
                <span className="px-2 py-[3px] rounded-lg text-[9px] font-bold text-white uppercase bg-emerald-500/90 backdrop-blur-sm w-fit">
                  NEW
                </span>
              )}
            </div>
            {item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-white">{item.rating}</span>
              </div>
            )}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none z-10">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm w-fit">
              <BookOpen className="w-3 h-3 text-neutral-300" />
              <span className="text-[10px] font-semibold text-white">{item.latest_chapter}</span>
            </div>
          </div>

          {/* Rank badge */}
          {rank !== undefined && (
            <div className={cn(
              "absolute -top-0 -left-0 z-20 w-7 h-7 rounded-br-xl flex items-center justify-center text-[11px] font-black",
              rank < 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black" : "bg-[#262626] text-white border-r border-b border-white/10"
            )}>
              {rank + 1}
            </div>
          )}
        </div>
        <h4 className={cn(
          "text-[13px] font-semibold text-neutral-200 leading-snug line-clamp-2 group-hover:text-white transition-colors",
          variant === "default" ? "min-h-[2.6rem]" : ""
        )}>
          {item.title}
        </h4>
      </div>
    </Link>
  );
});

// =============================================================================
// WIDE CARD — Webtoon-style horizontal card
// =============================================================================

const WideCard = memo(function WideCard({ item, accentStyle, index }: {
  item: MangaItem; accentStyle: AccentStyle; index: number;
}) {
  return (
    <Link
      href={`/manga/${item.slug}`} prefetch={false}
      className="flex gap-3.5 items-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200 group"
    >
      {/* Rank number */}
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
        index < 3 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/20" : "bg-white/[0.06] text-neutral-400"
      )}>
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="relative w-14 h-[76px] flex-shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] shadow-md">
        <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="56px" unoptimized />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white line-clamp-1 leading-snug">{item.title}</h4>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="px-1.5 py-[2px] rounded-md text-[9px] font-bold text-white/80 uppercase bg-white/[0.08] border border-white/[0.06]">
            {formatMangaType(item.type)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
            <BookOpen className="w-3 h-3" /> {item.latest_chapter}
          </span>
        </div>
        {item.genres && item.genres.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {item.genres.slice(0, 2).map((g: string) => (
              <span key={g} className="text-[10px] text-neutral-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{g}</span>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      {item.rating !== "0" && item.rating !== "?" && (
        <div className="flex flex-col items-center shrink-0">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-bold text-white mt-0.5">{item.rating}</span>
        </div>
      )}
    </Link>
  );
});

// =============================================================================
// NEW RELEASE CARD — AnimeLovers style
// =============================================================================

const NewReleaseCard = memo(function NewReleaseCard({ item, accentStyle }: { item: MangaItem; accentStyle: AccentStyle }) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block flex-shrink-0 w-[140px] group active:scale-[0.96] transition-transform duration-200">
      <div className="relative overflow-hidden rounded-2xl bg-[#141414] aspect-[2/3] mb-2.5 shadow-lg shadow-black/30">
        <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="140px" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* NEW badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className={cn("px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-wider shadow-lg", accentStyle.bg)}>
            ✦ NEW
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="px-1.5 py-[3px] rounded-md text-[8px] font-bold text-white/80 uppercase bg-black/60 backdrop-blur-sm border border-white/10">
            {formatMangaType(item.type)}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
          <div className="flex items-center gap-1.5">
            {item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-white">{item.rating}</span>
              </div>
            )}
            <span className="text-neutral-500 text-[10px]">•</span>
            <span className={cn("text-[10px] font-semibold", accentStyle.text)}>{item.latest_chapter}</span>
          </div>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-neutral-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{item.title}</h4>
    </Link>
  );
});

// =============================================================================
// PROJECT CARD — List style
// =============================================================================

const ProjectCard = memo(function ProjectCard({ item, accentStyle }: { item: MangaItem; accentStyle: AccentStyle }) {
  const latestChapter = (item.chapters as { released_time?: string }[])?.[0] || null;
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="flex gap-3.5 items-center p-3 rounded-2xl hover:bg-white/[0.03] active:scale-[0.98] transition-all duration-200 group">
      <div className="relative w-[60px] h-[82px] flex-shrink-0 overflow-hidden rounded-xl bg-[#141414] shadow-md">
        <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="60px" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {item.is_hot && (
          <div className="absolute top-1 left-1 z-10">
            <span className="px-1 py-[1px] rounded bg-red-500 text-[7px] font-black text-white uppercase">HOT</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-neutral-100">{item.title}</h4>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5 flex-wrap">
          <span className="px-1.5 py-[2px] rounded-md text-[8px] font-bold text-white/80 uppercase bg-white/[0.06] border border-white/[0.06]">
            {formatMangaType(item.type)}
          </span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {item.latest_chapter}</span>
          {item.rating !== "0" && item.rating !== "?" && (
            <span className="flex items-center gap-0.5 text-amber-400"><Star className="w-3 h-3 fill-amber-400" /> {item.rating}</span>
          )}
        </div>
        {latestChapter && (
          <div className="flex items-center gap-1.5">
            <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white uppercase", accentStyle.bg)}>UP</span>
            <span className="text-[10px] text-neutral-500">{latestChapter.released_time || "Baru saja"}</span>
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0 group-hover:text-neutral-400 transition-colors" />
    </Link>
  );
});

// =============================================================================
// RECENT READS — Netflix "Continue Watching" style
// =============================================================================

function RecentReads({ reads, accentStyle }: { reads: RecentRead[]; accentStyle: AccentStyle }) {
  if (reads.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Lanjutkan Membaca" icon={History} accentStyle={accentStyle} subtitle={`${reads.length} komik tersimpan`} />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {reads.slice(0, 10).map((read) => {
          const progress = read.progress || Math.floor(Math.random() * 70) + 20;
          return (
            <Link key={`${read.slug}-${read.timestamp}`} href={`/manga/${read.slug}`} prefetch={false} className="flex-shrink-0 w-[130px] group active:scale-[0.96] transition-transform duration-200">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#141414] mb-2 shadow-lg shadow-black/30">
                <SmartImage src={read.thumb || "/no-image.png"} alt={read.title} title={read.title} fill loading="lazy" sizes="130px" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-xl", accentStyle.bg)}>
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="h-1 bg-white/15 rounded-full overflow-hidden mb-1.5">
                    <div className={cn("h-full rounded-full transition-all duration-500", accentStyle.bg)} style={{ width: `${progress}%` }} />
                  </div>
                  <p className={cn("text-[10px] font-semibold", accentStyle.text)}>{read.chapter}</p>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-neutral-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{read.title}</h4>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// =============================================================================
// GENRE QUICK PILLS — Webtoon style
// =============================================================================

function GenrePills({ accentStyle }: { accentStyle: AccentStyle }) {
  const genres = [
    { name: "Action", emoji: "⚔️" },
    { name: "Romance", emoji: "💕" },
    { name: "Fantasy", emoji: "🐉" },
    { name: "Comedy", emoji: "😂" },
    { name: "Drama", emoji: "🎭" },
    { name: "Horror", emoji: "👻" },
    { name: "Isekai", emoji: "🌀" },
    { name: "Sci-Fi", emoji: "🚀" },
  ];

  return (
    <section>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {genres.map((genre) => (
          <Link
            key={genre.name}
            href={`/genre/${genre.name.toLowerCase().replace(/\s+/g, "-")}`}
            prefetch={false}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] active:scale-95 transition-all duration-200"
          >
            <span className="text-sm">{genre.emoji}</span>
            <span className="text-[13px] font-medium text-neutral-300 whitespace-nowrap">{genre.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// FLOATING BUTTONS
// =============================================================================

function ScrollToTop({ accentStyle }: { accentStyle: AccentStyle }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn("fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-xl shadow-black/40 transition-all active:scale-90 hover:brightness-110 animate-in fade-in slide-in-from-bottom-2 duration-300", accentStyle.bg)}
    >
      <ChevronLeft className="w-5 h-5 rotate-90" />
    </button>
  );
}

function RandomPickButton({ items, accentStyle }: { items: MangaItem[]; accentStyle: AccentStyle }) {
  const router = useRouter();
  return (
    <button
      onClick={() => { if (items.length === 0) return; router.push(`/manga/${items[Math.floor(Math.random() * items.length)].slug}`); }}
      className="fixed bottom-24 left-4 z-40 w-11 h-11 rounded-full bg-[#1c1c1c]/90 backdrop-blur-sm border border-white/[0.1] text-white flex items-center justify-center shadow-xl shadow-black/40 transition-all active:scale-90 hover:bg-[#262626] animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <Shuffle className="w-4.5 h-4.5" />
    </button>
  );
}

// =============================================================================
// SKELETONS
// =============================================================================

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[132px] space-y-2.5">
      <div className="aspect-[2/3] rounded-2xl bg-[#1a1a1a] animate-pulse" />
      <div className="h-3.5 rounded-lg bg-[#1a1a1a] w-4/5 animate-pulse" />
    </div>
  );
}

function SkeletonWide() {
  return (
    <div className="flex gap-3.5 p-3 rounded-2xl bg-white/[0.02]">
      <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] animate-pulse" />
      <div className="w-14 h-[76px] rounded-xl bg-[#1a1a1a] animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded-lg bg-[#1a1a1a] w-3/4 animate-pulse" />
        <div className="h-3 rounded-lg bg-[#1a1a1a] w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonProject() {
  return (
    <div className="flex gap-3.5 p-3">
      <div className="w-[60px] h-[82px] rounded-xl bg-[#1a1a1a] flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded-lg bg-[#1a1a1a] w-3/4 animate-pulse" />
        <div className="h-3 rounded-lg bg-[#1a1a1a] w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function HomeErrorState({ onRetry, accentStyle }: { onRetry: () => void; accentStyle: AccentStyle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-neutral-600" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1.5">Gagal memuat data</h3>
      <p className="text-neutral-500 text-sm mb-6 max-w-[240px]">Cek koneksi internet kamu atau coba lagi nanti</p>
      <button onClick={onRetry} className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95 shadow-lg", accentStyle.bg)}>
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 backdrop-blur-md border-b border-red-500/20 px-4 py-2.5 animate-in slide-in-from-top duration-300">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-xs font-medium text-red-400">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Koneksi terputus — menunggu jaringan...</span>
      </div>
    </div>
  );
}

// =============================================================================
// HOME PAGE
// =============================================================================

export default function HomePage() {
  const { accent, style: accentStyle } = useAccent();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentReads, setRecentReads] = useState<RecentRead[]>([]);
  const [hasUnreadManga, setHasUnreadManga] = useState(false);
  const [dbNotifs, setDbNotifs] = useState<DbNotif[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isOnline = useOnlineStatus();

  // Track scroll for header transparency
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && globalCache.home && now - globalCache.timestamp < CACHE_DURATION) {
      setHomeData(globalCache.home); setLoading(false); return;
    }
    setLoading(true); setError(false);
    try {
      const homeRes = (await getHome()) as HomeData;
      if (!homeRes) { setError(true); return; }
      globalCache = { home: homeRes, timestamp: Date.now() };
      setHomeData(homeRes);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  const { pulling, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => { await fetchData(true); });

  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => setUser(u)); return () => unsub(); }, []);
  useEffect(() => {
    if (!user) { setDbNotifs([]); return; }
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setDbNotifs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as DbNotif[]);
    });
    return () => unsub();
  }, [user]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(() => { if (isOnline && document.visibilityState === "visible") fetchData(); }, 300000);
    return () => clearInterval(interval);
  }, [fetchData, isOnline]);
  useEffect(() => { setRecentReads(getRecentReads()); }, []);

  // ========================================================================
  // DATA MAPPING
  // ========================================================================
  const popular = useMemo(() => unwrap(homeData?.data?.top?.daily, []).map(transformItem), [homeData]);
  const projects = useMemo(() => unwrap(homeData?.data?.project_update, []).map(transformItem), [homeData]);
  const latest = useMemo(() => unwrap(homeData?.data?.mirror_update, []).map(transformItem), [homeData]);
  const topWeekly = useMemo(() => unwrap(homeData?.data?.top?.weekly, []).map(transformItem), [homeData]);
  const recommendations = useMemo(() => {
    const rec = homeData?.data?.recommended;
    if (!rec) return [];
    return [...unwrap(rec.manhwa, []), ...unwrap(rec.manga, []), ...unwrap(rec.manhua, [])].map(transformItem);
  }, [homeData]);

  const newReleases = useMemo(() => {
    const all = [...popular, ...latest, ...projects, ...recommendations];
    const seen = new Set<string>();
    return all.filter((item) => { if (seen.has(item.slug)) return false; seen.add(item.slug); return item.is_new || (item.rating && parseFloat(item.rating) > 8); }).slice(0, 12);
  }, [popular, latest, projects, recommendations]);

  const editorsPick = useMemo(() => {
    const seen = new Set<string>();
    return [...recommendations].filter((r) => r.rating && r.rating !== "0" && r.rating !== "?")
      .sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"))
      .filter((r) => { if (seen.has(r.slug)) return false; seen.add(r.slug); return true; })
      .slice(0, 6);
  }, [recommendations]);

  const allItems = useMemo(() => [...popular, ...latest, ...projects, ...recommendations, ...topWeekly], [popular, latest, projects, recommendations, topWeekly]);

  useEffect(() => {
    if (latest.length === 0) return;
    const seen = getSeenSlugs();
    setHasUnreadManga(latest.map((i) => i.slug).some((s) => !seen.includes(s)));
  }, [latest]);

  const markNotifRead = useCallback(() => {
    if (latest.length === 0) return;
    saveSeenSlugs(latest.map((i) => i.slug));
    setHasUnreadManga(false);
  }, [latest]);

  const hasUnreadDb = dbNotifs.some((n) => !n.isRead);
  const showBellDot = hasUnreadManga || hasUnreadDb;
  const handleNotifClick = useCallback(() => setNotifOpen((v) => !v), []);

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white pb-28 touch-pan-y relative overflow-x-hidden"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pulling && (
        <div className="fixed top-16 left-0 right-0 z-40 flex justify-center transition-transform" style={{ transform: `translateY(${pullDistance}px)` }}>
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.1] rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-xl">
            <RefreshCw className={cn("w-4 h-4 transition-transform", accentStyle.text, pullDistance > 60 && "animate-spin")} />
            <span className="text-xs font-medium text-neutral-300">{pullDistance > 60 ? "Lepaskan untuk refresh" : "Tarik untuk refresh"}</span>
          </div>
        </div>
      )}

      {!isOnline && <OfflineBanner />}

      <Header
        onNotifClick={handleNotifClick} hasUnread={showBellDot} user={user}
        onSearchClick={() => setSearchOpen(true)} accentStyle={accentStyle} scrolled={scrolled}
      />
      <QuickSearchBar open={searchOpen} onClose={() => setSearchOpen(false)} accentStyle={accentStyle} />
      <NotifPopup open={notifOpen} onClose={() => setNotifOpen(false)} items={latest} onMarkRead={markNotifRead} dbNotifs={dbNotifs} user={user} accentStyle={accentStyle} />

      <main className="relative max-w-lg mx-auto px-4 pt-16 space-y-8 z-10">
        {error && !loading ? (
          <HomeErrorState onRetry={() => fetchData(true)} accentStyle={accentStyle} />
        ) : (
          <>
            {/* ===== HERO CAROUSEL — Netflix style ===== */}
            <section className="-mx-4">
              {loading ? (
                <div className="aspect-[16/10] bg-[#141414] animate-pulse" />
              ) : (
                <HeroCarousel items={popular} accentStyle={accentStyle} />
              )}
            </section>

            {/* ===== GENRE PILLS — Webtoon style ===== */}
            {!loading && <GenrePills accentStyle={accentStyle} />}

            {/* ===== CONTINUE READING — Netflix style ===== */}
            {!loading && recentReads.length > 0 && <RecentReads reads={recentReads} accentStyle={accentStyle} />}

            {/* ===== POPULAR TODAY — Netflix horizontal row ===== */}
            <section>
              <SectionHeader title="Populer Hari Ini" icon={Flame} actionLabel="Lihat Semua" actionHref="/popular" accentStyle={accentStyle} subtitle="Paling banyak dibaca" />
              {loading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {popular.map((item, i) => (
                    <div key={`${item.slug}-${i}`} className="flex-shrink-0 w-[132px]">
                      <MangaCard item={item} variant="compact" accentStyle={accentStyle} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ===== EDITOR'S PICK — Grid layout ===== */}
            {!loading && editorsPick.length > 0 && (
              <section>
                <SectionHeader
                  title="Pilihan Editor" icon={Crown} accentStyle={accentStyle} subtitle="Rating tertinggi minggu ini"
                  badge={<span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider">TOP</span>}
                />
                <div className="grid grid-cols-3 gap-3">
                  {editorsPick.map((item, i) => (
                    <div key={`${item.slug}-${i}`} className="h-full">
                      <MangaCard item={item} variant="default" accentStyle={accentStyle} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== NEW RELEASES — AnimeLovers style horizontal ===== */}
            {!loading && newReleases.length > 0 && (
              <section>
                <SectionHeader
                  title="Baru Rilis" icon={Sparkles} accentStyle={accentStyle} subtitle="Fresh dari oven"
                  badge={<span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">NEW</span>}
                />
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {newReleases.map((item, i) => <NewReleaseCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />)}
                </div>
              </section>
            )}

            {/* ===== TOP WEEKLY — Webtoon ranking style ===== */}
            {!loading && topWeekly.length > 0 && (
              <section>
                <SectionHeader
                  title="Top Mingguan" icon={TrendingUp} accentStyle={accentStyle} subtitle="Peringkat tertinggi"
                  badge={<span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-wider">RANK</span>}
                />
                <div className="space-y-2">
                  {topWeekly.slice(0, 8).map((item, i) => (
                    <WideCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ===== LATEST UPDATES — List style ===== */}
            <section>
              <SectionHeader title="Episode Terbaru" icon={Clock} actionLabel="Lihat Semua" actionHref="/latest" accentStyle={accentStyle} subtitle="Update real-time" />
              {loading ? (
                <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonProject key={i} />)}</div>
              ) : (
                <div className="space-y-1">{latest.slice(0, 6).map((item, i) => <ProjectCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />)}</div>
              )}
            </section>

            {/* ===== PROJECT UPDATE — Grid/List toggle ===== */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-lg", accentStyle.bg)}>
                    <BadgeCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[17px] leading-tight tracking-tight">Project Update</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">{projects.length} komik aktif</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-all duration-200 active:scale-90", viewMode === "grid" ? cn("text-white shadow-md", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-all duration-200 active:scale-90", viewMode === "list" ? cn("text-white shadow-md", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}>
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {loading ? (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {Array.from({ length: 4 }).map((_, i) => viewMode === "grid" ? <div key={i} className="aspect-[2/3] rounded-2xl bg-[#1a1a1a] animate-pulse" /> : <SkeletonProject key={i} />)}
                </div>
              ) : (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {projects.slice(0, 10).map((item, i) => viewMode === "grid"
                    ? <MangaCard key={`${item.slug}-${i}`} item={item} variant="project" accentStyle={accentStyle} />
                    : <ProjectCard key={`${item.slug}-${i}`} item={item} accentStyle={accentStyle} />)}
                </div>
              )}
            </section>

            {/* Bottom spacer */}
            <div className="h-6" />
          </>
        )}
      </main>

      <ScrollToTop accentStyle={accentStyle} />
      {!loading && allItems.length > 0 && <RandomPickButton items={allItems} accentStyle={accentStyle} />}
    </div>
  );
}