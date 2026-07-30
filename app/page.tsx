"use client";

import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, User as UserIcon, Star, Clock, Grid3X3, LayoutList,
  BadgeCheck, MessageCircle, WifiOff, RefreshCw, History, X, ChevronRight,
  AlertCircle, Sparkles, Shuffle, Crown, TrendingUp, Flame, Play, BookmarkPlus,
  ChevronLeft, Info
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

function useScrollHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

// =============================================================================
// HEADER — Netflix-style glassmorphism with scroll transition
// =============================================================================

function Header({ onNotifClick, hasUnread, user, onSearchClick, accentStyle }: {
  onNotifClick: () => void; hasUnread: boolean; user: FirebaseUser | null; onSearchClick: () => void; accentStyle: AccentStyle;
}) {
  const scrolled = useScrollHeader();
  const { text: greeting, icon } = getGreeting();
  const displayName = user?.displayName || "Guest";
  const photoURL = user?.photoURL;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
      scrolled 
        ? "bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20" 
        : "bg-gradient-to-b from-black/60 to-transparent"
    )}>
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/profile" prefetch={false} className="flex items-center gap-3 active:scale-95 transition-transform duration-150 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1c1c1c] to-[#262626] overflow-hidden flex items-center justify-center ring-2 ring-white/[0.08] group-hover:ring-white/20 transition-all">
              {photoURL ? <Image src={photoURL} alt={displayName} width={36} height={36} className="object-cover w-full h-full" unoptimized /> : <UserIcon className="w-4 h-4 text-neutral-400" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center text-[9px] ring-1 ring-white/10 shadow-sm">{icon}</div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{greeting}</span>
            <span className="text-sm font-bold text-white leading-tight truncate max-w-[140px]">{displayName}</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={onNotifClick} className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.06] text-neutral-300 hover:bg-white/[0.12] active:scale-90 transition-all duration-200 backdrop-blur-sm">
            <Bell className="w-4 h-4" />
            {hasUnread && <span className={cn("absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#0a0a0a] animate-pulse", accentStyle.bg)} />}
          </button>
          <button onClick={onSearchClick} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.06] text-neutral-300 hover:bg-white/[0.12] active:scale-90 transition-all duration-200 backdrop-blur-sm">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// QUICK SEARCH BAR — Fullscreen immersive search
// =============================================================================

function QuickSearchBar({ open, onClose, accentStyle }: { open: boolean; onClose: () => void; accentStyle: AccentStyle }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  if (!open) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-md mx-auto px-4 pt-24">
        <form onSubmit={handleSubmit} className="relative group">
          <input ref={inputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari manga, manhwa, manhua..."
            className={cn("w-full h-14 bg-[#141414] border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder-neutral-600 focus:outline-none transition-all duration-300 focus:border-white/20 focus:bg-[#1a1a1a] text-base", accentStyle.focusRing)} />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neutral-300 transition-colors" />
          <button type="button" onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </form>
        <div className="mt-8">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Genre Populer</p>
          <div className="flex flex-wrap gap-2">
            {["Action", "Romance", "Fantasy", "Comedy", "Drama", "Horror", "Isekai", "Slice of Life", "School", "Supernatural"].map((genre) => (
              <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`} prefetch={false} onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#1c1c1c] border border-white/[0.06] text-xs text-neutral-300 hover:bg-[#262626] hover:border-white/10 hover:text-white transition-all duration-200 active:scale-95">{genre}</Link>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Pencarian Terbaru</p>
          <div className="space-y-1">
            {["Solo Leveling", "Omniscient Reader", "Lookism", "True Beauty"].map((term) => (
              <button key={term} onClick={() => { router.push(`/search?q=${encodeURIComponent(term)}`); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors text-left group">
                <Clock className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
                <span className="text-sm text-neutral-400 group-hover:text-neutral-200">{term}</span>
                <ChevronRight className="w-3 h-3 text-neutral-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NOTIFICATION POPUP — Redesigned with tabs
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
      <div className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-14 left-0 right-0 z-[55] flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-md w-full bg-[#141414]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex px-1 border-b border-white/[0.05]">
            <button onClick={() => setActiveTab("updates")} className={cn("flex-1 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2", activeTab === "updates" ? "text-white border-white" : "text-neutral-500 border-transparent hover:text-neutral-300")}>Update</button>
            <button onClick={() => setActiveTab("activity")} className={cn("flex-1 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 relative", activeTab === "activity" ? "text-white border-white" : "text-neutral-500 border-transparent hover:text-neutral-300")}>
              Aktivitas
              {unreadActivityCount > 0 && <span className="absolute top-2.5 right-8 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </button>
          </div>
          {activeTab === "updates" && items.length > 0 && (
            <div className="p-2 flex justify-end border-b border-white/[0.05]">
              <button onClick={() => { onMarkRead(); onClose(); }} className={cn("text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80 font-medium", accentStyle.text)}>Tandai semua dibaca</button>
            </div>
          )}
          <div className="overflow-y-auto p-2 space-y-0.5">
            {activeTab === "updates" && (
              <>
                {items.slice(0, 8).map((item) => (
                  <Link href={`/manga/${item.slug}`} prefetch={false} onClick={() => { onMarkRead(); onClose(); }} key={item.slug}
                    className="flex gap-3 items-center p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.98] group">
                    <div className="relative w-11 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#1c1c1c] ring-1 ring-white/[0.06]">
                      <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="44px" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">{item.title}</h4>
                      <p className={cn("text-xs mt-0.5 font-medium", accentStyle.text)}>{item.latest_chapter}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-[#1c1c1c] flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium">Belum ada update terbaru</p>
                    <p className="text-neutral-600 text-xs mt-1">Manga favoritmu akan muncul di sini</p>
                  </div>
                )}
              </>
            )}
            {activeTab === "activity" && (
              <>
                {!user ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-[#1c1c1c] flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium">Silakan login untuk melihat notifikasi</p>
                  </div>
                ) : dbNotifs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-[#1c1c1c] flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium">Belum ada aktivitas</p>
                  </div>
                ) : (
                  dbNotifs.map((notif) => (
                    <div key={notif.id} onClick={() => handleReadFirebaseNotif(notif)} className={cn("flex gap-3 items-start p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]", notif.isRead ? "hover:bg-white/[0.04]" : cn("bg-white/[0.02]", accentStyle.border))}>
                      <img src={notif.triggerUserPhoto || "/no-avatar.png"} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#1c1c1c] ring-1 ring-white/[0.08]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-300 leading-snug"><span className="font-semibold text-white">{notif.triggerUserName}</span> <span className="text-neutral-400">{notif.message}</span></p>
                        <p className={cn("text-[11px] mt-1.5 flex items-center gap-1.5 font-medium", accentStyle.text)}><MessageCircle className="w-3 h-3" /> Bab {notif.chapter}</p>
                        <p className="text-[11px] text-neutral-600 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && <div className={cn("w-2 h-2 rounded-full shrink-0 mt-2 animate-pulse", accentStyle.bg)} />}
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
// SECTION HEADER — Cleaner with better visual hierarchy
// =============================================================================

function SectionHeader({ title, icon: Icon, actionLabel, actionHref = "#", rightContent, accentStyle, subtitle, badge }: {
  title: string; icon?: React.ElementType; actionLabel?: string; actionHref?: string;
  rightContent?: React.ReactNode; accentStyle: AccentStyle; subtitle?: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-lg", accentStyle.bg)}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-base leading-tight tracking-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      {rightContent || (actionLabel && (
        <Link href={actionHref} prefetch={false} className="text-xs font-semibold text-neutral-500 hover:text-white transition-colors flex items-center gap-0.5 shrink-0 group">
          {actionLabel} <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ))}
    </div>
  );
}

// =============================================================================
// MANGA CARD — Netflix-style hover zoom, better shadows, premium badges
// =============================================================================

const MangaCard = memo(function MangaCard({ item, variant = "default", accentStyle, index = 0 }: {
  item: MangaItem; variant?: "default" | "compact" | "project"; index?: number; accentStyle: AccentStyle;
}) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block h-full group">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2.5 shadow-lg shadow-black/40 ring-1 ring-white/[0.04] group-hover:ring-white/[0.12] transition-all duration-300">
          <SmartImage 
            src={item.thumb || "/no-image.png"} 
            alt={item.title} 
            title={item.title} 
            fill 
            loading="lazy" 
            decoding="async" 
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
            sizes="(max-width: 768px) 33vw, 20vw" 
            unoptimized 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 pointer-events-none z-10">
            <span className={cn(
              "px-2 py-[3px] rounded-md text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md",
              item.type === "MANHWA" ? "bg-blue-500/80" :
              item.type === "MANHUA" ? "bg-red-500/80" :
              item.type === "MANGA" ? "bg-emerald-500/80" :
              "bg-neutral-500/80"
            )}>
              {formatMangaType(item.type)}
            </span>
            {item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5 px-1.5 py-[3px] rounded-md bg-black/60 backdrop-blur-md border border-white/[0.08]">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-bold text-white">{item.rating}</span>
              </div>
            )}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-2 py-[3px] rounded-md bg-black/60 backdrop-blur-md border border-white/[0.06] min-w-0">
              <Clock className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
              <span className="text-[9px] font-semibold text-white truncate">{item.latest_chapter}</span>
            </div>
            <div className="shrink-0 flex gap-1">
              {item.is_hot && (
                <span className="px-1.5 py-[3px] rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-[8px] font-bold text-white uppercase tracking-wider shadow-lg shadow-red-500/20">
                  <Flame className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />HOT
                </span>
              )}
              {item.is_new && !item.is_hot && (
                <span className="px-1.5 py-[3px] rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-[8px] font-bold text-white uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                  NEW
                </span>
              )}
            </div>
          </div>

          {/* Hover overlay with action hint */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transform scale-50 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
        <h4 className={cn(
          "text-[13px] font-semibold text-neutral-300 leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200",
          variant === "default" ? "min-h-[2.5rem]" : ""
        )}>{item.title}</h4>
      </div>
    </Link>
  );
});

// =============================================================================
// NEW RELEASE CARD — Larger, more prominent for featured content
// =============================================================================

const NewReleaseCard = memo(function NewReleaseCard({ item, accentStyle }: { item: MangaItem; accentStyle: AccentStyle }) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block flex-shrink-0 w-[160px] group">
      <div className="relative overflow-hidden rounded-2xl bg-[#141414] aspect-[2/3] mb-2.5 shadow-xl shadow-black/50 ring-1 ring-white/[0.04] group-hover:ring-white/[0.15] transition-all duration-300">
        <SmartImage 
          src={item.thumb || "/no-image.png"} 
          alt={item.title} 
          title={item.title} 
          fill 
          loading="lazy" 
          decoding="async" 
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
          sizes="160px" 
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* NEW badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={cn("px-2 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider shadow-lg backdrop-blur-md", accentStyle.bg)}>
            NEW
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={cn(
            "px-2 py-[3px] rounded-md text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md",
            item.type === "MANHWA" ? "bg-blue-500/80" :
            item.type === "MANHUA" ? "bg-red-500/80" :
            "bg-emerald-500/80"
          )}>
            {formatMangaType(item.type)}
          </span>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center gap-2">
            {item.rating !== "0" && item.rating !== "?" && (
              <>
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[11px] font-bold text-white">{item.rating}</span>
                <span className="text-neutral-600 text-[10px]">•</span>
              </>
            )}
            <span className={cn("text-[11px] font-semibold", accentStyle.text)}>{item.latest_chapter}</span>
          </div>
        </div>

        {/* Hover play button */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-neutral-200 transition-colors">{item.title}</h4>
    </Link>
  );
});

// =============================================================================
// PROJECT CARD — List view with better visual hierarchy
// =============================================================================

const ProjectCard = memo(function ProjectCard({ item, accentStyle, index = 0 }: { item: MangaItem; index?: number; accentStyle: AccentStyle }) {
  const latestChapter = (item.chapters as { released_time?: string }[])?.[0] || null;
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="flex gap-3.5 items-center p-2.5 -mx-2 rounded-xl hover:bg-white/[0.03] transition-all duration-200 group active:scale-[0.98]">
      <div className="relative w-[72px] h-[100px] flex-shrink-0 overflow-hidden rounded-xl bg-[#141414] shadow-lg shadow-black/30 ring-1 ring-white/[0.04]">
        <SmartImage 
          src={item.thumb || "/no-image.png"} 
          alt={item.title} 
          title={item.title} 
          fill 
          loading="lazy" 
          decoding="async" 
          className="object-cover transition-transform duration-500 group-hover:scale-110" 
          sizes="72px" 
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
          {item.is_hot && <span className="px-1.5 py-[2px] rounded bg-gradient-to-r from-red-500 to-orange-500 text-[8px] font-bold text-white uppercase shadow-md">HOT</span>}
          {item.is_new && !item.is_hot && <span className="px-1.5 py-[2px] rounded bg-gradient-to-r from-emerald-500 to-teal-500 text-[8px] font-bold text-white uppercase shadow-md">NEW</span>}
        </div>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-neutral-200 transition-colors">{item.title}</h4>
        <div className="flex items-center gap-2.5 text-xs text-neutral-500 mb-1.5 flex-wrap">
          <span className={cn(
            "px-1.5 py-[2px] rounded text-[9px] font-bold text-white uppercase tracking-wider",
            item.type === "MANHWA" ? "bg-blue-500/80" :
            item.type === "MANHUA" ? "bg-red-500/80" :
            "bg-emerald-500/80"
          )}>
            {formatMangaType(item.type)}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" /> {item.latest_chapter}
          </span>
          {item.rating !== "0" && item.rating !== "?" && (
            <span className="flex items-center gap-1 text-yellow-500 shrink-0">
              <Star className="w-3 h-3 fill-yellow-500" /> {item.rating}
            </span>
          )}
        </div>
        {latestChapter && (
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-[3px] rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm", accentStyle.bg)}>UP</span>
            <span className="text-[10px] text-neutral-500 font-medium">{latestChapter.released_time || "Baru saja"}</span>
          </div>
        )}
        {item.genres && item.genres.length > 0 && (
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {item.genres.slice(0, 2).map((genre: string) => (
              <span key={genre} className="px-2 py-[2px] rounded-md bg-white/[0.04] text-[10px] text-neutral-500 font-medium border border-white/[0.03]">{genre}</span>
            ))}
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
    <section className="-mx-4">
      <div className="px-4 mb-4">
        <SectionHeader title="Lanjutkan Membaca" icon={History} accentStyle={accentStyle} subtitle={`${reads.length} komik dalam daftar`} />
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {reads.slice(0, 10).map((read) => {
          const progress = read.progress || Math.floor(Math.random() * 70) + 20;
          return (
            <Link key={`${read.slug}-${read.timestamp}`} href={`/manga/${read.slug}`} prefetch={false} className="flex-shrink-0 w-[130px] group">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] mb-2 shadow-lg shadow-black/40 ring-1 ring-white/[0.04] group-hover:ring-white/[0.12] transition-all duration-300">
                <SmartImage 
                  src={read.thumb || "/no-image.png"} 
                  alt={read.title} 
                  title={read.title} 
                  fill 
                  loading="lazy" 
                  decoding="async" 
                  sizes="130px" 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  unoptimized 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Progress bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1 bg-white/10">
                    <div className={cn("h-full transition-all duration-500", accentStyle.bg)} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="p-2.5 pt-1.5">
                    <p className={cn("text-[10px] font-bold truncate", accentStyle.text)}>{read.chapter}</p>
                  </div>
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
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
// FLOATING BUTTONS & STATES
// =============================================================================

function ScrollToTop({ accentStyle }: { accentStyle: AccentStyle }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button 
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
      className={cn("fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full border border-white/[0.08] text-white flex items-center justify-center shadow-xl shadow-black/50 transition-all active:scale-90 hover:brightness-110 backdrop-blur-md", accentStyle.bg)}
    >
      <ChevronLeft className="w-5 h-5 -rotate-90" />
    </button>
  );
}

function RandomPickButton({ items, accentStyle }: { items: MangaItem[]; accentStyle: AccentStyle }) {
  const router = useRouter();
  return (
    <button 
      onClick={() => { if (items.length === 0) return; router.push(`/manga/${items[Math.floor(Math.random() * items.length)].slug}`); }}
      className={cn("fixed bottom-24 left-4 z-40 w-11 h-11 rounded-full border border-white/[0.08] text-white flex items-center justify-center shadow-xl shadow-black/50 transition-all active:scale-90 hover:brightness-110 backdrop-blur-md", accentStyle.bg)}
      title="Random Pick"
    >
      <Shuffle className="w-4 h-4" />
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[140px] space-y-2.5">
      <div className="aspect-[2/3] rounded-xl bg-[#1c1c1c] animate-pulse ring-1 ring-white/[0.04]" />
      <div className="h-3 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
      <div className="h-2.5 rounded bg-[#1c1c1c] w-1/2 animate-pulse" />
    </div>
  );
}

function SkeletonProject() {
  return (
    <div className="flex gap-3.5 p-2.5 -mx-2">
      <div className="w-[72px] h-[100px] rounded-xl bg-[#1c1c1c] flex-shrink-0 animate-pulse ring-1 ring-white/[0.04]" />
      <div className="flex-1 space-y-2.5 py-1.5">
        <div className="h-4 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-[#1c1c1c] w-1/2 animate-pulse" />
        <div className="h-3 rounded bg-[#1c1c1c] w-1/3 animate-pulse" />
      </div>
    </div>
  );
}

function HomeErrorState({ onRetry, accentStyle }: { onRetry: () => void; accentStyle: AccentStyle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#1c1c1c] flex items-center justify-center mb-5 ring-1 ring-white/[0.06]">
        <AlertCircle className="w-8 h-8 text-neutral-500" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Gagal memuat data</h3>
      <p className="text-neutral-500 text-sm mb-6 max-w-[240px]">Cek koneksi internet atau coba muat ulang halaman</p>
      <button onClick={onRetry} className={cn("flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg", accentStyle.bg)}>
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 animate-in slide-in-from-top">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs text-red-400 font-medium">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Koneksi terputus. Menunggu jaringan...</span>
      </div>
    </div>
  );
}

// =============================================================================
// HERO CAROUSEL WRAPPER — Netflix style with better info display
// =============================================================================

function HeroSection({ items, accentStyle, loading }: { items: MangaItem[]; accentStyle: AccentStyle; loading: boolean }) {
  if (loading) return <div className="aspect-[4/3] rounded-2xl bg-[#1c1c1c] animate-pulse ring-1 ring-white/[0.04]" />;
  if (items.length === 0) return null;

  // Use the imported HeroCarousel but wrap it with better styling
  return (
    <div className="relative -mx-4">
      <HeroCarousel items={items} accentStyle={accentStyle} />
    </div>
  );
}

// =============================================================================
// HORIZONTAL SCROLL SECTION — Netflix-style row with peek
// =============================================================================

function HorizontalScrollSection({ 
  title, 
  icon: Icon, 
  items, 
  accentStyle, 
  actionLabel, 
  actionHref,
  subtitle,
  badge,
  loading,
  cardComponent: CardComponent = MangaCard,
  cardWidth = "132px"
}: {
  title: string;
  icon?: React.ElementType;
  items: MangaItem[];
  accentStyle: AccentStyle;
  actionLabel?: string;
  actionHref?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  loading: boolean;
  cardComponent?: React.FC<{ item: MangaItem; accentStyle: AccentStyle; index?: number }>;
  cardWidth?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [checkScroll, items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="-mx-4">
      <div className="px-4 mb-4">
        <SectionHeader 
          title={title} 
          icon={Icon} 
          actionLabel={actionLabel} 
          actionHref={actionHref} 
          accentStyle={accentStyle} 
          subtitle={subtitle}
          badge={badge}
        />
      </div>
      <div className="relative group">
        {/* Navigation arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {canScrollRight && (
          <button 
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 px-4" 
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            items.map((item, i) => (
              <div key={`${item.slug}-${i}`} className="flex-shrink-0" style={{ width: cardWidth }}>
                <CardComponent item={item} accentStyle={accentStyle} index={i} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// HOME PAGE — Main component with Netflix/Webtoon-inspired layout
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
  const isOnline = useOnlineStatus();

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

  // =============================================================================
  // DATA MAPPING
  // =============================================================================
  const popular = useMemo(() => unwrap(homeData?.data?.top?.daily, []).map(transformItem), [homeData]);
  const projects = useMemo(() => unwrap(homeData?.data?.project_update, []).map(transformItem), [homeData]);
  const latest = useMemo(() => unwrap(homeData?.data?.mirror_update, []).map(transformItem), [homeData]);
  const topWeekly = useMemo(() => unwrap(homeData?.data?.top?.weekly, []).map(transformItem), [homeData]);
  const recommendations = useMemo(() => {
    const rec = homeData?.data?.recommended;
    if (!rec) return [];
    return [
      ...unwrap(rec.manhwa, []),
      ...unwrap(rec.manga, []),
      ...unwrap(rec.manhua, []),
    ].map(transformItem);
  }, [homeData]);

  const newReleases = useMemo(() => {
    const all = [...popular, ...latest, ...projects, ...recommendations];
    const seen = new Set<string>();
    return all.filter((item) => { if (seen.has(item.slug)) return false; seen.add(item.slug); return item.is_new || (item.rating && parseFloat(item.rating) > 8); }).slice(0, 10);
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
      className="min-h-screen bg-[#0a0a0a] text-white pb-24 touch-pan-y relative overflow-x-hidden selection:bg-white/20"
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pulling && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center transition-transform duration-150" style={{ transform: `translateY(${pullDistance}px)` }}>
          <div className="bg-[#141414]/90 backdrop-blur-xl border border-white/[0.08] rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-xl">
            <RefreshCw className={cn("w-4 h-4", accentStyle.text, pullDistance > 60 && "animate-spin")} />
            <span className="text-xs text-neutral-400 font-medium">{pullDistance > 60 ? "Lepaskan untuk refresh" : "Tarik untuk refresh"}</span>
          </div>
        </div>
      )}

      {!isOnline && <OfflineBanner />}

      <Header 
        onNotifClick={handleNotifClick} 
        hasUnread={showBellDot} 
        user={user} 
        onSearchClick={() => setSearchOpen(true)} 
        accentStyle={accentStyle} 
      />

      <QuickSearchBar open={searchOpen} onClose={() => setSearchOpen(false)} accentStyle={accentStyle} />

      <NotifPopup 
        open={notifOpen} 
        onClose={() => setNotifOpen(false)} 
        items={latest} 
        onMarkRead={markNotifRead} 
        dbNotifs={dbNotifs} 
        user={user} 
        accentStyle={accentStyle} 
      />

      <main className="relative max-w-md mx-auto px-4 pt-14 space-y-8 z-10">
        {error && !loading ? (
          <HomeErrorState onRetry={() => fetchData(true)} accentStyle={accentStyle} />
        ) : (
          <>
            {/* Hero Section */}
            <section className="-mx-4">
              {loading ? (
                <div className="aspect-[16/10] bg-[#1c1c1c] animate-pulse" />
              ) : (
                <HeroSection items={popular} accentStyle={accentStyle} loading={loading} />
              )}
            </section>

            {/* Continue Reading */}
            {!loading && recentReads.length > 0 && <RecentReads reads={recentReads} accentStyle={accentStyle} />}

            {/* Popular Today */}
            <HorizontalScrollSection
              title="Populer Hari Ini"
              icon={TrendingUp}
              items={popular}
              accentStyle={accentStyle}
              actionLabel="Lihat Semua"
              actionHref="/popular"
              subtitle="Paling banyak dibaca saat ini"
              loading={loading}
              cardWidth="140px"
            />

            {/* Editor's Pick */}
            {!loading && editorsPick.length > 0 && (
              <section>
                <SectionHeader 
                  title="Pilihan Editor" 
                  icon={Crown} 
                  accentStyle={accentStyle} 
                  subtitle="Rating tertinggi minggu ini"
                  badge={<span className="px-2 py-[3px] rounded-md bg-yellow-500/15 border border-yellow-500/25 text-yellow-500 text-[9px] font-bold uppercase tracking-wider">TOP</span>} 
                />
                <div className="grid grid-cols-3 gap-3">
                  {editorsPick.map((item, i) => (
                    <div key={`${item.slug}-${i}`} className="h-full">
                      <MangaCard item={item} variant="default" index={i} accentStyle={accentStyle} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* New Releases */}
            {!loading && newReleases.length > 0 && (
              <HorizontalScrollSection
                title="Baru Rilis"
                icon={Sparkles}
                items={newReleases}
                accentStyle={accentStyle}
                subtitle="Update terbaru dari berbagai project"
                badge={<span className="px-2 py-[3px] rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-500 text-[9px] font-bold uppercase tracking-wider">NEW</span>}
                loading={loading}
                cardComponent={NewReleaseCard}
                cardWidth="160px"
              />
            )}

            {/* Latest Episodes */}
            <section>
              <SectionHeader 
                title="Episode Terbaru" 
                icon={Clock} 
                actionLabel="Lihat Semua" 
                actionHref="/latest" 
                accentStyle={accentStyle} 
                subtitle="Update real-time dari mirror"
              />
              {loading ? (
                <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonProject key={i} />)}</div>
              ) : (
                <div className="space-y-0.5">{latest.slice(0, 6).map((item, i) => <ProjectCard key={`${item.slug}-${i}`} item={item} index={i} accentStyle={accentStyle} />)}</div>
              )}
            </section>

            {/* Top Weekly */}
            {!loading && topWeekly.length > 0 && (
              <section>
                <SectionHeader
                  title="Top Mingguan"
                  icon={Crown}
                  accentStyle={accentStyle}
                  subtitle="Peringkat tertinggi minggu ini"
                  badge={<span className="px-2 py-[3px] rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-500 text-[9px] font-bold uppercase tracking-wider">RANK</span>}
                />
                <div className="grid grid-cols-3 gap-3">
                  {topWeekly.slice(0, 6).map((item, i) => (
                    <div key={`${item.slug}-${i}`} className="h-full relative">
                      <span className={cn(
                        "absolute -top-1.5 -left-1 z-20 w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ring-2 ring-[#0a0a0a] shadow-lg",
                        i === 0 ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-black" :
                        i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-black" :
                        i === 2 ? "bg-gradient-to-br from-orange-400 to-amber-600 text-black" :
                        "bg-[#262626] text-white border border-white/[0.06]"
                      )}>
                        {i + 1}
                      </span>
                      <MangaCard item={item} variant="default" index={i} accentStyle={accentStyle} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Project Update */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-lg", accentStyle.bg)}>
                    <BadgeCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight tracking-tight">Project Update</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">{projects.length} komik aktif dalam project</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.06] rounded-xl p-0.5">
                  <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-all active:scale-90", viewMode === "grid" ? cn("text-white shadow-md", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-all active:scale-90", viewMode === "list" ? cn("text-white shadow-md", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}>
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {loading ? (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {Array.from({ length: 4 }).map((_, i) => viewMode === "grid" ? <div key={i} className="aspect-[2/3] rounded-xl bg-[#1c1c1c] animate-pulse ring-1 ring-white/[0.04]" /> : <SkeletonProject key={i} />)}
                </div>
              ) : (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-0.5")}>
                  {projects.slice(0, 10).map((item, i) => viewMode === "grid"
                    ? <MangaCard key={`${item.slug}-${i}`} item={item} variant="project" index={i} accentStyle={accentStyle} />
                    : <ProjectCard key={`${item.slug}-${i}`} item={item} index={i} accentStyle={accentStyle} />)}
                </div>
              )}
            </section>

            <div className="h-4" />
          </>
        )}
      </main>

      <ScrollToTop accentStyle={accentStyle} />
      {!loading && allItems.length > 0 && <RandomPickButton items={allItems} accentStyle={accentStyle} />}
    </div>
  );
}
