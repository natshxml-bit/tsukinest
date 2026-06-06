"use client";

import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  User as UserIcon,
  Star,
  Clock,
  Flame,
  Grid3X3,
  LayoutList,
  ArrowUp,
  BadgeCheck,
  MessageCircle,
  WifiOff,
  RefreshCw,
  History,
  TrendingUp,
  Zap,
  X,
  ChevronRight,
  Play,
  AlertCircle,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  type MangaItem,
  type HomeApiResponse,
  type UpdatesApiResponse,
  type LatestApiResponse,
  getHome,
  getUpdates,
  getLatest,
} from "@/lib/api";

import { useAccent } from "@/lib/accent"; // ← HOOK ACCENT

// ─── Utilities ───
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  if (url.includes("<")) {
    const match = url.match(/src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return url;
}

function transformItem(item: any): MangaItem {
  return {
    title: item.title || "Untitled",
    slug: item.slug || "",
    thumb: cleanThumb(item.thumb),
    type: item.type?.split(/\s+/)[0] || "MANHWA",
    latest_chapter: item.chapter || item.latest_chapter || "Ch. ?",
    rating: item.rating ? String(item.rating) : "0",
    link: item.link || "",
    is_colored: item.badges?.includes("color") || false,
    is_hot: item.badges?.includes("hot") || false,
    synopsis: item.synopsis || "",
    genres: item.genres || [],
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function timeAgo(date: any): string {
  if (!date) return "Baru saja";
  const now = new Date();
  const past = date.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

// ─── LocalStorage Helpers ───
const SEEN_NOTIF_KEY = "tsukinest_seen_notifs_v2";
const RECENT_READS_KEY = "tsukinest_recent_reads";

function getSeenSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEN_NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeenSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_NOTIF_KEY, JSON.stringify(slugs.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

interface RecentRead {
  slug: string;
  title: string;
  thumb: string;
  chapter: string;
  timestamp: number;
}

function getRecentReads(): RecentRead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_READS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Global Cache ───
let globalCache = {
  home: null as HomeApiResponse | null,
  updates: null as UpdatesApiResponse | null,
  latest: null as LatestApiResponse | null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// ─── Hooks ───
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
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
    if (window.scrollY === 0 && !isRefreshing.current) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(diff * 0.4, 80));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !isRefreshing.current) {
      isRefreshing.current = true;
      setPullDistance(0);
      setPulling(false);
      await onRefresh();
      isRefreshing.current = false;
    } else {
      setPullDistance(0);
      setPulling(false);
    }
    startY.current = 0;
  }, [pullDistance, onRefresh]);

  return { pulling, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
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
  createdAt: any;
}

// ═══════════════════════════════════════════════════
// COMPONENTS (DENGAN ACCENT DYNAMIC)
// ═══════════════════════════════════════════════════

function Header({
  onNotifClick,
  hasUnread,
  user,
  onSearchClick,
  accentStyle,
}: {
  onNotifClick: () => void;
  hasUnread: boolean;
  user: FirebaseUser | null;
  onSearchClick: () => void;
  accentStyle: (typeof import("@/lib/accent").ACCENT_MAP)["purple"];
}) {
  const greeting = getGreeting();
  const displayName = user?.displayName || "Guest";
  const photoURL = user?.photoURL;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.03]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-16">
        <Link href="/profile" className="flex items-center gap-3 active:scale-95 transition-transform duration-150">
          <div className={cn("relative p-[2px] rounded-full bg-gradient-to-tr animate-gradient", accentStyle.gradient)}>
            <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden flex items-center justify-center border-2 border-gray-950">
              {photoURL ? (
                <Image src={photoURL} alt={displayName} width={40} height={40} className="object-cover w-full h-full" unoptimized />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-500">{greeting}</span>
            <span className="text-sm font-bold text-white leading-tight line-clamp-1">{displayName}</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={onNotifClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] active:scale-90 transition-all duration-200"
          >
            <Bell className="w-5 h-5 text-gray-300" />
            {hasUnread && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-950 animate-pulse" />
            )}
          </button>

          <button
            onClick={onSearchClick}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] active:scale-90 transition-all duration-200"
          >
            <Search className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}

function QuickSearchBar({ open, onClose, accentStyle }: { open: boolean; onClose: () => void; accentStyle: any }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-md mx-auto px-4 pt-24">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari manga, manhwa, manhua..."
            className={cn(
              "w-full h-14 bg-gray-900 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none transition-all",
              accentStyle.focusRing,
              "focus:border-transparent"
            )}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Action", "Romance", "Fantasy", "Comedy", "Drama"].map((genre) => (
            <Link
              key={genre}
              href={`/genre/${genre.toLowerCase()}`}
              onClick={onClose}
              className={cn(
                "px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 transition-all",
                accentStyle.hoverSoft,
                accentStyle.text,
                "hover:border-transparent"
              )}
            >
              {genre}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotifPopup({
  open,
  onClose,
  items,
  onMarkRead,
  dbNotifs,
  user,
  accentStyle,
}: {
  open: boolean;
  onClose: () => void;
  items: MangaItem[];
  onMarkRead: () => void;
  dbNotifs: DbNotif[];
  user: FirebaseUser | null;
  accentStyle: any;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"updates" | "activity">("updates");

  if (!open) return null;

  const unreadActivityCount = dbNotifs.filter((n) => !n.isRead).length;

  const handleReadFirebaseNotif = async (notif: DbNotif) => {
    if (!notif.isRead) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
      } catch (error) {
        console.error("Gagal update status notif:", error);
      }
    }
    onClose();
    router.push(`/read/${notif.slug}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-14 left-0 right-0 z-[55] flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="max-w-md w-full bg-gray-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
          <div className="border-b border-white/[0.05] bg-gray-900/50">
            <div className="flex px-2 pt-2">
              <button
                onClick={() => setActiveTab("updates")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold transition-all border-b-2",
                  activeTab === "updates"
                    ? cn("text-white", "border-current")
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
                style={activeTab === "updates" ? { borderColor: "currentColor" } : {}}
              >
                <span className={cn(activeTab === "updates" && accentStyle.text)}>Update</span>
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold transition-all border-b-2 relative",
                  activeTab === "activity"
                    ? cn("text-white", "border-current")
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
                style={activeTab === "activity" ? { borderColor: "currentColor" } : {}}
              >
                <span className={cn(activeTab === "activity" && accentStyle.text)}>Aktivitas</span>
                {unreadActivityCount > 0 && (
                  <span className="absolute top-2 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            </div>

            {activeTab === "updates" && items.length > 0 && (
              <div className="p-2 flex justify-end">
                <button
                  onClick={() => {
                    onMarkRead();
                    onClose();
                  }}
                  className={cn("text-xs px-2 py-1 rounded-md transition", accentStyle.text, "hover:opacity-80")}
                >
                  Tandai semua dibaca
                </button>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {activeTab === "updates" && (
              <>
                {items.slice(0, 8).map((item) => (
                  <Link
                    href={`/detail/${item.slug}`}
                    onClick={() => {
                      onMarkRead();
                      onClose();
                    }}
                    key={item.slug}
                    className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
                  >
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 border border-white/[0.05]">
                      <Image src={item.thumb || "/no-image.png"} alt={item.title} fill unoptimized className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-100 truncate">{item.title}</h4>
                      <p className={cn("text-xs mt-0.5", accentStyle.text)}>{item.latest_chapter}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Belum ada update terbaru</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "activity" && (
              <>
                {!user ? (
                  <div className="text-center py-8">
                    <UserIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Silakan login untuk melihat notifikasi</p>
                  </div>
                ) : dbNotifs.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Belum ada aktivitas</p>
                  </div>
                ) : (
                  dbNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleReadFirebaseNotif(notif)}
                      className={cn(
                        "flex gap-3 items-start p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                        notif.isRead ? "hover:bg-white/[0.04]" : cn(accentStyle.soft, accentStyle.border)
                      )}
                    >
                      <img
                        src={notif.triggerUserPhoto || "/no-avatar.png"}
                        alt="User"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-300 leading-snug">
                          <span className="font-bold text-white">{notif.triggerUserName}</span> {notif.message}
                        </p>
                        <p className={cn("text-[10px] mt-1 flex items-center gap-1", accentStyle.text)}>
                          <MessageCircle className="w-3 h-3" /> Bab {notif.chapter}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", accentStyle.bg)} />}
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

function HeroCarousel({ items, accentStyle }: { items: MangaItem[]; accentStyle: any }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const visible = items.slice(0, 7);
  if (visible.length === 0) return null;

  const active = visible[idx];
  const next = useCallback(() => setIdx((i) => (i + 1) % visible.length), [visible.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + visible.length) % visible.length), [visible.length]);

  useEffect(() => {
    if (visible.length <= 1 || isPaused) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible.length, isPaused, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Link href={`/detail/${active.slug}`} className="block w-full active:scale-[0.98] transition-transform duration-200">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Image src={active.thumb || "/no-image.png"} alt={active.title} fill unoptimized className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("px-2 py-0.5 rounded-md text-white text-[10px] font-bold uppercase tracking-wider", accentStyle.bg)}>
                {active.type}
              </span>
              {active.is_hot && (
                <span className="px-2 py-0.5 rounded-md bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3" /> HOT
                </span>
              )}
              {active.is_colored && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
                  FULL COLOR
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-xl leading-tight truncate mb-1">{active.title}</h2>
            <p className="text-gray-300 text-sm flex items-center gap-2 mb-2">
              {active.rating !== "0" && active.rating !== "?" && (
                <>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" /> {active.rating}
                  </span>
                  <span className="text-gray-600">•</span>
                </>
              )}
              <span>{active.latest_chapter}</span>
            </p>
            <p className="text-xs text-white/50 line-clamp-2 max-w-[90%]">
              {active.synopsis || "Tidak ada sinopsis tersedia."}
            </p>
          </div>
        </div>
      </Link>
      {visible.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === idx ? "w-6 bg-white shadow-lg shadow-white/30" : "w-1.5 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  actionLabel,
  actionHref = "#",
  rightContent,
  accentStyle,
}: {
  title: string;
  icon?: React.ElementType;
  actionLabel?: string;
  actionHref?: string;
  rightContent?: React.ReactNode;
  accentStyle: any;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn("w-5 h-5", accentStyle.text)} />}
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>
      {rightContent ||
        (actionLabel && (
          <Link href={actionHref} className={cn("text-xs font-medium flex items-center gap-0.5 transition-colors hover:opacity-80", accentStyle.text)}>
            {actionLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        ))}
    </div>
  );
}

const MangaCard = memo(function MangaCard({
  item,
  variant = "default",
  index = 0,
  accent,
  accentStyle,
}: {
  item: MangaItem;
  variant?: "default" | "compact" | "project";
  index?: number;
  accent: string;
  accentStyle: any;
}) {
  const isCompact = variant === "compact";
  const thumb = item.thumb;

  return (
    <Link href={`/detail/${item.slug}`} className="group block flex-shrink-0 relative overflow-hidden active:scale-95 transition-transform duration-150">
      <div className="relative overflow-hidden rounded-xl bg-gray-900 border border-white/[0.05] aspect-[3/4] group-hover:shadow-xl transition-shadow duration-300">
        <Image
          src={thumb || "/no-image.png"}
          alt={item.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 33vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/10" />
        <div className="absolute top-2 left-2">
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase", accentStyle.bg)}>
            {item.type}
          </span>
        </div>

        {item.rating !== "0" && item.rating !== "?" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white">{item.rating}</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80">
          <Clock className="w-3 h-3 text-gray-300" />
          <span className="text-[10px] font-bold text-white">{item.latest_chapter}</span>
        </div>
      </div>
      <div className="mt-2">
        <h4
          className={cn(
            "font-semibold text-gray-100 leading-snug line-clamp-2 transition-colors",
            isCompact ? "text-xs" : "text-sm",
            accent === "custom" ? "group-hover:text-[var(--tsuki-custom-hex)]" : accentStyle.text.replace("text-", "group-hover:text-")
          )}
        >
          {item.title}
        </h4>
      </div>
    </Link>
  );
});

const ProjectCard = memo(function ProjectCard({
  item,
  index = 0,
  accent,
  accentStyle,
}: {
  item: MangaItem;
  index?: number;
  accent: string;
  accentStyle: any;
}) {
  const thumb = item.thumb;
  return (
    <Link
      href={`/detail/${item.slug}`}
      className="group flex gap-3 items-start relative overflow-hidden rounded-xl p-2 -m-2 transition-[transform,background-color] duration-150 active:scale-95 hover:bg-white/[0.02]"
    >
      <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900 border border-white/[0.05] group-hover:shadow-lg transition-shadow duration-300">
        <Image
          src={thumb || "/no-image.png"}
          alt={item.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-1 left-1">
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase", accentStyle.bg)}>
            {item.type}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h4 className={cn("text-sm font-bold text-gray-100 line-clamp-2 transition-colors", accent === "custom" ? "group-hover:text-[var(--tsuki-custom-hex)]" : accentStyle.text.replace("text-", "group-hover:text-"))}>
          {item.title}
        </h4>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
          {item.rating !== "0" && item.rating !== "?" && (
            <>
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" /> {item.rating}
              </span>
              <span className="text-gray-600">•</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {item.latest_chapter}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="px-2 py-1 rounded-md bg-red-500/15 text-red-400 text-[10px] font-bold uppercase">UP</span>
          <span className="text-[10px] text-gray-500">Update terbaru</span>
        </div>
        {item.genres.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {item.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-500">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
});

function RecentReads({ reads, accent, accentStyle }: { reads: RecentRead[]; accent: string; accentStyle: any }) {
  if (reads.length === 0) return null;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SectionHeader title="Terakhir Dibaca" icon={History} accentStyle={accentStyle} />
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reads.map((read) => (
          <Link key={read.slug} href={`/read/${read.slug}`} className="flex-shrink-0 w-[120px] group active:scale-95 transition-transform">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 border border-white/[0.05]">
              <Image src={read.thumb || "/no-image.png"} alt={read.title} fill unoptimized className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className={cn("text-[10px] font-medium truncate", accentStyle.text)}>{read.chapter}</p>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <h4 className={cn("mt-1.5 text-xs font-medium text-gray-300 line-clamp-2 transition-colors", accent === "custom" ? "group-hover:text-[var(--tsuki-custom-hex)]" : accentStyle.text.replace("text-", "group-hover:text-"))}>
              {read.title}
            </h4>
          </Link>
        ))}
      </div>
    </section>
  );
}

function GenreChips({ accentStyle }: { accentStyle: any }) {
  const genres = [
    { name: "Action", from: "from-red-500/20", to: "to-orange-500/20", text: "text-red-300", border: "border-red-500/20" },
    { name: "Romance", from: "from-pink-500/20", to: "to-rose-500/20", text: "text-pink-300", border: "border-pink-500/20" },
    { name: "Fantasy", from: "from-violet-500/20", to: "to-purple-500/20", text: "text-violet-300", border: "border-violet-500/20" },
    { name: "Comedy", from: "from-yellow-500/20", to: "to-amber-500/20", text: "text-yellow-300", border: "border-yellow-500/20" },
    { name: "Drama", from: "from-blue-500/20", to: "to-cyan-500/20", text: "text-blue-300", border: "border-blue-500/20" },
    { name: "Horror", from: "from-gray-500/20", to: "to-slate-500/20", text: "text-gray-300", border: "border-gray-500/20" },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SectionHeader title="Jelajahi Genre" icon={Zap} accentStyle={accentStyle} />
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {genres.map((genre) => (
          <Link
            key={genre.name}
            href={`/genre/${genre.name.toLowerCase()}`}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r border text-xs font-semibold active:scale-95 transition-all hover:opacity-80",
              genre.from,
              genre.to,
              genre.text,
              genre.border
            )}
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ScrollToTop({ accentStyle }: { accentStyle: any }) {
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
      className={cn(
        "fixed bottom-20 right-4 z-40 p-3 rounded-full text-white shadow-lg transition active:scale-90",
        accentStyle.bg,
        accentStyle.glow,
        "hover:brightness-110"
      )}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-2 flex-shrink-0 w-[140px]">
      <div className="aspect-[3/4] rounded-xl bg-gray-800/80 animate-pulse" />
      <div className="h-4 rounded bg-gray-800/80 animate-pulse w-3/4" />
      <div className="h-3 rounded bg-gray-800/80 animate-pulse w-1/2" />
    </div>
  );
}

function SkeletonProject() {
  return (
    <div className="flex gap-3">
      <div className="w-24 h-32 rounded-lg bg-gray-800/80 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-4 rounded bg-gray-800/80 animate-pulse w-3/4" />
        <div className="h-3 rounded bg-gray-800/80 animate-pulse w-1/2" />
        <div className="h-3 rounded bg-gray-800/80 animate-pulse w-1/3" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry, accentStyle }: { onRetry: () => void; accentStyle: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-white font-semibold mb-1">Gagal memuat data</h3>
      <p className="text-gray-500 text-sm mb-4">Cek koneksi internet atau coba lagi</p>
      <button
        onClick={onRetry}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all active:scale-95",
          accentStyle.bg,
          accentStyle.glow,
          "hover:brightness-110"
        )}
      >
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs text-red-400">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Koneksi terputus. Menunggu jaringan...</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════

export default function HomePage() {
  const { accent, style: accentStyle } = useAccent();

  const [homeData, setHomeData] = useState<HomeApiResponse | null>(null);
  const [updatesData, setUpdatesData] = useState<UpdatesApiResponse | null>(null);
  const [latestData, setLatestData] = useState<LatestApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentReads, setRecentReads] = useState<RecentRead[]>([]);

  const [hasUnreadManga, setHasUnreadManga] = useState(false);
  const [dbNotifs, setDbNotifs] = useState<DbNotif[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const isOnline = useOnlineStatus();
  const router = useRouter();

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && globalCache.home && now - globalCache.timestamp < CACHE_DURATION) {
      setHomeData(globalCache.home);
      setUpdatesData(globalCache.updates);
      setLatestData(globalCache.latest);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const [home, updates, latest] = await Promise.allSettled([getHome(), getUpdates(1), getLatest(1)]);
      const homeRes = home.status === "fulfilled" ? home.value : null;
      const updatesRes = updates.status === "fulfilled" ? updates.value : null;
      const latestRes = latest.status === "fulfilled" ? latest.value : null;

      if (home.status === "rejected") console.error("Gagal getHome:", home.reason);
      if (updates.status === "rejected") console.error("Gagal getUpdates:", updates.reason);
      if (latest.status === "rejected") console.error("Gagal getLatest:", latest.reason);

      if (!homeRes && !updatesRes && !latestRes) setError(true);

      globalCache = {
        home: homeRes,
        updates: updatesRes,
        latest: latestRes,
        timestamp: Date.now(),
      };

      setHomeData(homeRes);
      setUpdatesData(updatesRes);
      setLatestData(latestRes);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const { pulling, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => {
    await fetchData(true); // Memaksa fetch saat user pull-to-refresh
    setLastRefresh(Date.now());
  });

  // 1. Firebase Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Firestore Notif
  useEffect(() => {
    if (!user) {
      setDbNotifs([]);
      return;
    }
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as DbNotif[];
      setDbNotifs(fetched);
    });
    return () => unsub();
  }, [user]);

  // 3. Fetch Data saat mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Auto-refresh setiap 5 menit jika di-tab aktif
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && document.visibilityState === "visible") fetchData();
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchData, isOnline]);

  useEffect(() => {
    setRecentReads(getRecentReads());
  }, []);

  // ─── Data Transform ───
  const extractData = (res: any, fallback: any) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    if (Array.isArray(fallback)) return fallback;
    return [];
  };

  const popular = useMemo(
    () => (Array.isArray(homeData?.data?.popular_today) ? homeData.data.popular_today : []).map(transformItem),
    [homeData]
  );
  const projects = useMemo(
    () => extractData(updatesData, homeData?.data?.project_update).map(transformItem),
    [updatesData, homeData]
  );
  const latest = useMemo(
    () => extractData(latestData, homeData?.data?.latest_update).map(transformItem),
    [latestData, homeData]
  );

  useEffect(() => {
    if (latest.length === 0) return;
    const seen = getSeenSlugs();
    const currentSlugs = latest.map((i) => i.slug);
    const hasNew = currentSlugs.some((s) => !seen.includes(s));
    setHasUnreadManga(hasNew);
  }, [latest]);

  const markNotifRead = useCallback(() => {
    if (latest.length === 0) return;
    const currentSlugs = latest.map((i) => i.slug);
    saveSeenSlugs(currentSlugs);
    setHasUnreadManga(false);
  }, [latest]);

  const hasUnreadDb = dbNotifs.some((n) => !n.isRead);
  const showBellDot = hasUnreadManga || hasUnreadDb;
  const handleNotifClick = useCallback(() => setNotifOpen((v) => !v), []);

  const staggerClass = "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards";

  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-100 pb-24 touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pulling && (
        <div
          className="fixed top-16 left-0 right-0 z-40 flex justify-center transition-transform"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <div className="bg-gray-900/90 backdrop-blur border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl">
            <RefreshCw className={cn("w-4 h-4", accentStyle.text, pullDistance > 60 && "animate-spin")} />
            <span className="text-xs text-gray-300">{pullDistance > 60 ? "Lepaskan untuk refresh" : "Tarik untuk refresh"}</span>
          </div>
        </div>
      )}

      {!isOnline && <OfflineBanner />}

      <Header onNotifClick={handleNotifClick} hasUnread={showBellDot} user={user} onSearchClick={() => setSearchOpen(true)} accentStyle={accentStyle} />

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

      <main className="max-w-md mx-auto px-4 pt-20 space-y-8">
        {error && !loading ? (
          <ErrorState onRetry={() => fetchData(true)} accentStyle={accentStyle} />
        ) : (
          <>
            <section className={staggerClass}>
              {loading ? <div className="aspect-[4/3] rounded-2xl bg-gray-800/80 animate-pulse" /> : <HeroCarousel items={popular} accentStyle={accentStyle} />}
            </section>

            {!loading && <GenreChips accentStyle={accentStyle} />}
            {!loading && recentReads.length > 0 && <RecentReads reads={recentReads} accent={accent} accentStyle={accentStyle} />}

            <section className={staggerClass} style={{ animationDelay: "100ms" }}>
              <SectionHeader title="Populer Hari Ini" icon={TrendingUp} actionLabel="Lihat Semua" actionHref="/popular" accentStyle={accentStyle} />
              {loading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <div
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {popular.map((item, i) => (
                    <div key={item.slug} className="flex-shrink-0 w-[140px]">
                      <MangaCard item={item} variant="compact" index={i} accent={accent} accentStyle={accentStyle} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={staggerClass} style={{ animationDelay: "200ms" }}>
              <SectionHeader title="Episode Terbaru" icon={Clock} actionLabel="Lihat Semua" actionHref="/latest" accentStyle={accentStyle} />
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonProject key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {latest.slice(0, 6).map((item, i) => (
                    <ProjectCard key={item.slug} item={item} index={i} accent={accent} accentStyle={accentStyle} />
                  ))}
                </div>
              )}
            </section>

            <section className={staggerClass} style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className={cn("w-5 h-5", accentStyle.text)} />
                  <h3 className="text-white font-bold text-lg">Project Update</h3>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-90",
                      viewMode === "grid"
                        ? cn("text-white shadow-lg", accentStyle.bg, accentStyle.glow)
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all active:scale-90",
                      viewMode === "list"
                        ? cn("text-white shadow-lg", accentStyle.bg, accentStyle.glow)
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-3")}>
                  {Array.from({ length: 4 }).map((_, i) =>
                    viewMode === "grid" ? (
                      <div key={i} className="aspect-[3/4] rounded-xl bg-gray-800/80 animate-pulse" />
                    ) : (
                      <SkeletonProject key={i} />
                    )
                  )}
                </div>
              ) : (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {projects.slice(0, 20).map((item, i) =>
                    viewMode === "grid" ? (
                      <MangaCard key={item.slug} item={item} variant="project" index={i} accent={accent} accentStyle={accentStyle} />
                    ) : (
                      <ProjectCard key={item.slug} item={item} index={i} accent={accent} accentStyle={accentStyle} />
                    )
                  )}
                </div>
              )}
            </section>

            <div className="h-8" />
          </>
        )}
      </main>

      <ScrollToTop accentStyle={accentStyle} />
    </div>
  );
}
