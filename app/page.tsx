"use client";

import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Bell, User as UserIcon, Star, Clock, Grid3X3, LayoutList,
  BadgeCheck, MessageCircle, WifiOff, RefreshCw, History, X, ChevronRight,
  AlertCircle, Sparkles, Shuffle, Crown,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

// FIX: Import tipe asli dengan alias, lalu kita extend di bawahnya agar TS tidak error
import { type MangaItem as ImportedMangaItem, getHome } from "@/lib/api";
import { useAccent } from "@/lib/accent";
import { cn } from "@/utils/cn";
import { cleanThumb } from "@/utils/image";
import SmartImage from "@/components/ui/SmartImage";
import HeroCarousel from "@/components/manga/HeroCarousel";

// Extend tipe MangaItem untuk mengakomodasi properti tambahan yang dipakai di komponen ini
type MangaItem = ImportedMangaItem & {
  is_new?: boolean;
  chapters?: any[];
};

type AccentStyle = Record<string, string>;

// FIX: Ubah parameter menjadi any untuk menghindari error overlapping type dari TypeScript
function transformItem(item: any): MangaItem {
  const rawItem = item || {};
  const rawType = (typeof rawItem.type === "string" ? rawItem.type : "MANGA").toUpperCase();
  let typeWithFlag = rawType;
  if (rawType.includes("MANHWA")) typeWithFlag = " " + rawType;
  else if (rawType.includes("MANHUA")) typeWithFlag = " " + rawType;
  else if (rawType.includes("MANGA")) typeWithFlag = " " + rawType;

  const taxonomy = rawItem.taxonomy;
  const genres = taxonomy?.Genre
    ? taxonomy.Genre.map((g: any) => g.name)
    : Array.isArray(rawItem.genres) ? rawItem.genres : [];

  return {
    title: typeof rawItem.title === "string" ? rawItem.title : "Untitled",
    slug: typeof rawItem.slug === "string" ? rawItem.slug : typeof rawItem.manga_id === "string" ? rawItem.manga_id : "",
    thumb: cleanThumb(typeof rawItem.thumb === "string" ? rawItem.thumb : typeof rawItem.cover_image_url === "string" ? rawItem.cover_image_url : ""),
    type: typeWithFlag,
    latest_chapter: typeof rawItem.latest_chapter === "string" ? rawItem.latest_chapter : rawItem.latest_chapter_number ? `Ch. ${rawItem.latest_chapter_number}` : "Ch. ?",
    rating: rawItem.rating && rawItem.rating !== "0" ? String(rawItem.rating) : "0",
    link: typeof rawItem.link === "string" ? rawItem.link : "",
    is_colored: Boolean(rawItem.is_colored),
    is_hot: Boolean(rawItem.is_hot),
    is_new: Boolean(rawItem.is_new),
    synopsis: typeof rawItem.synopsis === "string" ? rawItem.synopsis : typeof rawItem.description === "string" ? rawItem.description : "",
    genres,
    chapters: Array.isArray(rawItem.chapters) ? rawItem.chapters : [],
  } as MangaItem;
}

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

// FIX: Longgarkan tipe array ke any[] agar bebas dari type error saat mapping
interface HomeData {
  data?: {
    popular_today?: any[];
    top_daily?: any[];
    project_update?: any[];
    latest_update?: any[];
    recommended_manhwa?: any[];
    recommendations?: any[];
  };
}

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

let globalCache: { home: HomeData | null; timestamp: number } = { home: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000;

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
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

function Header({ onNotifClick, hasUnread, user, onSearchClick, accentStyle }: {
  onNotifClick: () => void; hasUnread: boolean; user: FirebaseUser | null; onSearchClick: () => void; accentStyle: AccentStyle;
}) {
  const { text: greeting, icon } = getGreeting();
  const displayName = user?.displayName || "Guest";
  const photoURL = user?.photoURL;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.05]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/profile" prefetch={false} className="flex items-center gap-3 active:scale-95 transition-transform duration-150">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#1c1c1c] overflow-hidden flex items-center justify-center ring-1 ring-white/10">
              {photoURL ? <Image src={photoURL} alt={displayName} width={36} height={36} className="object-cover w-full h-full" unoptimized /> : <UserIcon className="w-4 h-4 text-neutral-400" />}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1c1c1c] flex items-center justify-center text-[8px] ring-1 ring-[#0a0a0a]">{icon}</div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{greeting}</span>
            <span className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">{displayName}</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={onNotifClick} className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 hover:bg-[#262626] active:scale-90 transition-all duration-200">
            <Bell className="w-4 h-4" />
            {hasUnread && <span className={cn("absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#0a0a0a]", accentStyle.bg)} />}
          </button>
          <button onClick={onSearchClick} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 hover:bg-[#262626] active:scale-90 transition-all duration-200">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md mx-auto px-4 pt-20">
        <form onSubmit={handleSubmit} className="relative">
          <input ref={inputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari manga, manhwa, manhua..."
            className={cn("w-full h-12 bg-[#141414] border border-white/10 rounded-xl pl-11 pr-11 text-white placeholder-neutral-600 focus:outline-none transition-all focus:border-transparent", accentStyle.focusRing)} />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <button type="button" onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </form>
        <div className="mt-6">
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-3">Genre Populer</p>
          <div className="flex flex-wrap gap-2">
            {["Action", "Romance", "Fantasy", "Comedy", "Drama", "Horror", "Isekai", "Slice of Life"].map((genre) => (
              <Link key={genre} href={`/genre/${genre.toLowerCase().replace(/\s+/g, "-")}`} prefetch={false} onClick={onClose}
                className="px-3 py-2 rounded-lg bg-[#1c1c1c] border border-white/[0.06] text-xs text-neutral-300 hover:bg-[#262626] transition-colors">{genre}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="fixed inset-0 z-[50] bg-black/60" onClick={onClose} />
      <div className="fixed top-14 left-0 right-0 z-[55] flex justify-center px-4 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="max-w-md w-full bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex px-1 border-b border-white/[0.05]">
            <button onClick={() => setActiveTab("updates")} className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === "updates" ? "text-white border-white" : "text-neutral-500 border-transparent hover:text-neutral-300")}>Update</button>
            <button onClick={() => setActiveTab("activity")} className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2 relative", activeTab === "activity" ? "text-white border-white" : "text-neutral-500 border-transparent hover:text-neutral-300")}>
              Aktivitas
              {unreadActivityCount > 0 && <span className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          </div>
          {activeTab === "updates" && items.length > 0 && (
            <div className="p-2 flex justify-end border-b border-white/[0.05]">
              <button onClick={() => { onMarkRead(); onClose(); }} className={cn("text-xs px-2 py-1 rounded-md transition hover:opacity-80", accentStyle.text)}>Tandai semua dibaca</button>
            </div>
          )}
          <div className="overflow-y-auto p-2 space-y-0.5">
            {activeTab === "updates" && (
              <>
                {items.slice(0, 8).map((item) => (
                  <Link href={`/manga/${item.slug}`} prefetch={false} onClick={() => { onMarkRead(); onClose(); }} key={item.slug}
                    className="flex gap-3 items-center p-3 rounded-xl hover:bg-white/[0.03] transition-colors active:scale-[0.98]">
                    <div className="relative w-11 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#1c1c1c]">
                      <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill className="object-cover" sizes="44px" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-200 truncate">{item.title}</h4>
                      <p className={cn("text-xs mt-0.5", accentStyle.text)}>{item.latest_chapter}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                  </Link>
                ))}
                {items.length === 0 && <div className="text-center py-10"><Clock className="w-6 h-6 text-neutral-600 mx-auto mb-2" /><p className="text-neutral-500 text-xs">Belum ada update terbaru</p></div>}
              </>
            )}
            {activeTab === "activity" && (
              <>
                {!user ? (
                  <div className="text-center py-10"><UserIcon className="w-6 h-6 text-neutral-600 mx-auto mb-2" /><p className="text-neutral-500 text-xs">Silakan login untuk melihat notifikasi</p></div>
                ) : dbNotifs.length === 0 ? (
                  <div className="text-center py-10"><MessageCircle className="w-6 h-6 text-neutral-600 mx-auto mb-2" /><p className="text-neutral-500 text-xs">Belum ada aktivitas</p></div>
                ) : (
                  dbNotifs.map((notif) => (
                    <div key={notif.id} onClick={() => handleReadFirebaseNotif(notif)} className={cn("flex gap-3 items-start p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]", notif.isRead ? "hover:bg-white/[0.03]" : cn("bg-white/[0.02]", accentStyle.border))}>
                      <img src={notif.triggerUserPhoto || "/no-avatar.png"} alt="User" className="w-9 h-9 rounded-full object-cover shrink-0 bg-[#1c1c1c]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-300 leading-snug"><span className="font-medium text-white">{notif.triggerUserName}</span> {notif.message}</p>
                        <p className={cn("text-[11px] mt-1 flex items-center gap-1", accentStyle.text)}><MessageCircle className="w-3 h-3" /> Bab {notif.chapter}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-2", accentStyle.bg)} />}
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

function SectionHeader({ title, icon: Icon, actionLabel, actionHref = "#", rightContent, accentStyle, subtitle, badge }: {
  title: string; icon?: React.ElementType; actionLabel?: string; actionHref?: string;
  rightContent?: React.ReactNode; accentStyle: AccentStyle; subtitle?: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", accentStyle.bg)}><Icon className="w-3 h-3 text-white" /></div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2"><h3 className="text-white font-semibold text-base leading-tight tracking-tight">{title}</h3>{badge}</div>
          {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {rightContent || (actionLabel && <Link href={actionHref} prefetch={false} className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center gap-0.5 shrink-0">{actionLabel} <ChevronRight className="w-3 h-3" /></Link>)}
    </div>
  );
}

const MangaCard = memo(function MangaCard({ item, variant = "default", accentStyle }: {
  item: MangaItem; variant?: "default" | "compact" | "project"; index?: number; accent?: string; accentStyle: AccentStyle;
}) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block h-full active:scale-95 transition-transform duration-150">
      <div className="flex flex-col h-full">
        <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2">
          <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" decoding="async" className="object-cover" sizes="(max-width: 768px) 33vw, 20vw" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
            <div className="px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-medium text-white/90 uppercase max-w-[55%] truncate">{item.type}</div>
            {item.rating !== "0" && item.rating !== "?" && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 shrink-0">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" /><span className="text-[9px] font-bold text-white">{item.rating}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 pointer-events-none z-10">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 min-w-0">
              <Clock className="w-2.5 h-2.5 text-neutral-300 shrink-0" /><span className="text-[9px] font-medium text-white truncate">{item.latest_chapter}</span>
            </div>
            <div className="shrink-0 flex gap-1">
              {item.is_hot && <span className="px-1.5 py-0.5 rounded bg-red-500 text-[9px] font-bold text-white uppercase">HOT</span>}
              {item.is_new && !item.is_hot && <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[9px] font-bold text-white uppercase">NEW</span>}
            </div>
          </div>
        </div>
        <h4 className={cn("text-xs font-medium text-neutral-300 leading-snug line-clamp-2", variant === "default" ? "min-h-[2.5rem]" : "")}>{item.title}</h4>
      </div>
    </Link>
  );
});

const NewReleaseCard = memo(function NewReleaseCard({ item, accentStyle }: { item: MangaItem; accent?: string; accentStyle: AccentStyle }) {
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="block flex-shrink-0 w-[150px] active:scale-95 transition-transform duration-150">
      <div className="relative overflow-hidden rounded-xl bg-[#141414] aspect-[2/3] mb-2">
        <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" decoding="async" className="object-cover" sizes="150px" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 z-10"><div className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase", accentStyle.bg)}>NEW</div></div>
        <div className="absolute top-2 left-2 z-10"><span className="px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-medium text-white/90 uppercase">{item.type}</span></div>
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="flex items-center gap-1">
            {item.rating !== "0" && item.rating !== "?" && (<><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-[10px] font-bold text-white">{item.rating}</span><span className="text-neutral-600 text-[10px]">•</span></>)}
            <span className={cn("text-[10px] font-medium", accentStyle.text)}>{item.latest_chapter}</span>
          </div>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug">{item.title}</h4>
    </Link>
  );
});

const ProjectCard = memo(function ProjectCard({ item, accentStyle }: { item: MangaItem; index?: number; accent?: string; accentStyle: AccentStyle }) {
  const latestChapter = (item.chapters as { released_time?: string }[])?.[0] || null;
  return (
    <Link href={`/manga/${item.slug}`} prefetch={false} className="flex gap-3 items-center p-2 -mx-2 rounded-xl active:scale-[0.98] transition-transform duration-150">
      <div className="relative w-16 h-[88px] flex-shrink-0 overflow-hidden rounded-lg bg-[#141414]">
        <SmartImage src={item.thumb || "/no-image.png"} alt={item.title} title={item.title} fill loading="lazy" decoding="async" className="object-cover" sizes="64px" unoptimized />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5">
          {item.is_hot && <span className="px-1 py-[1px] rounded bg-red-500 text-[8px] font-bold text-white uppercase">HOT</span>}
          {item.is_new && !item.is_hot && <span className="px-1 py-[1px] rounded bg-emerald-500 text-[8px] font-bold text-white uppercase">NEW</span>}
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug mb-1">{item.title}</h4>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
          <span className="px-1 py-[1px] rounded bg-white/[0.06] text-[9px] font-medium text-neutral-400 uppercase shrink-0">{item.type}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.latest_chapter}</span>
          {item.rating !== "0" && item.rating !== "?" && <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-500" /> {item.rating}</span>}
        </div>
        {latestChapter && (
          <div className="flex items-center gap-1.5">
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium text-white uppercase", accentStyle.bg)}>UP</span>
            <span className="text-[10px] text-neutral-500">{latestChapter.released_time || "Baru saja"}</span>
          </div>
        )}
        {item.genres && item.genres.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {item.genres.slice(0, 2).map((genre: string) => <span key={genre} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] text-neutral-500">{genre}</span>)}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-700 shrink-0 mt-6" />
    </Link>
  );
});

function RecentReads({ reads, accentStyle }: { reads: RecentRead[]; accent?: string; accentStyle: AccentStyle }) {
  if (reads.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Lanjutkan Membaca" icon={History} accentStyle={accentStyle} subtitle={`${reads.length} komik`} />
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {reads.slice(0, 10).map((read) => {
          const progress = read.progress || Math.floor(Math.random() * 70) + 20;
          return (
            <Link key={`${read.slug}-${read.timestamp}`} href={`/manga/${read.slug}`} prefetch={false} className="flex-shrink-0 w-[120px] active:scale-95 transition-transform">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] mb-2">
                <SmartImage src={read.thumb || "/no-image.png"} alt={read.title} title={read.title} fill loading="lazy" decoding="async" sizes="120px" className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mb-1.5"><div className={cn("h-full rounded-full", accentStyle.bg)} style={{ width: `${progress}%` }} /></div>
                  <p className={cn("text-[10px] font-medium truncate", accentStyle.text)}>{read.chapter}</p>
                </div>
              </div>
              <h4 className="text-xs font-medium text-neutral-300 line-clamp-2 leading-snug">{read.title}</h4>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ScrollToTop({ accentStyle }: { accentStyle: AccentStyle }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={cn("fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full border border-white/[0.08] text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:brightness-110", accentStyle.bg)}>
      ↑
    </button>
  );
}

function RandomPickButton({ items }: { items: MangaItem[] }) {
  const router = useRouter();
  return (
    <button onClick={() => { if (items.length === 0) return; router.push(`/manga/${items[Math.floor(Math.random() * items.length)].slug}`); }}
      className="fixed bottom-20 left-4 z-40 w-10 h-10 rounded-full bg-[#1c1c1c] border border-white/[0.08] text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-[#262626]">
      <Shuffle className="w-4 h-4" />
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[132px] space-y-2">
      <div className="aspect-[2/3] rounded-xl bg-[#1c1c1c] animate-pulse" />
      <div className="h-3 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
    </div>
  );
}

function SkeletonProject() {
  return (
    <div className="flex gap-3 p-2 -mx-2">
      <div className="w-16 h-[88px] rounded-lg bg-[#1c1c1c] flex-shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded bg-[#1c1c1c] w-3/4 animate-pulse" />
        <div className="h-3 rounded bg-[#1c1c1c] w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function HomeErrorState({ onRetry, accentStyle }: { onRetry: () => void; accentStyle: AccentStyle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-10 h-10 text-neutral-600 mb-3" />
      <h3 className="text-white font-semibold text-base mb-1">Gagal memuat data</h3>
      <p className="text-neutral-500 text-sm mb-5">Cek koneksi internet atau coba lagi</p>
      <button onClick={onRetry} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all active:scale-95", accentStyle.bg)}>
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs text-red-400">
        <WifiOff className="w-3.5 h-3.5" /><span>Koneksi terputus. Menunggu jaringan...</span>
      </div>
    </div>
  );
}

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
      const homeRes = await getHome() as HomeData;
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

  const popular = useMemo(() => (homeData?.data?.popular_today || homeData?.data?.top_daily || []).map(transformItem), [homeData]);
  const projects = useMemo(() => (homeData?.data?.project_update || []).map(transformItem), [homeData]);
  const latest = useMemo(() => (homeData?.data?.latest_update || homeData?.data?.recommended_manhwa || []).map(transformItem), [homeData]);
  const recommendations = useMemo(() => (homeData?.data?.recommendations || []).map(transformItem), [homeData]);

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

  const allItems = useMemo(() => [...popular, ...latest, ...projects, ...recommendations], [popular, latest, projects, recommendations]);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 touch-pan-y relative overflow-x-hidden"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {pulling && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center transition-transform" style={{ transform: `translateY(${pullDistance}px)` }}>
          <div className="bg-[#141414] border border-white/[0.08] rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <RefreshCw className={cn("w-4 h-4", accentStyle.text, pullDistance > 60 && "animate-spin")} />
            <span className="text-xs text-neutral-400">{pullDistance > 60 ? "Lepaskan untuk refresh" : "Tarik untuk refresh"}</span>
          </div>
        </div>
      )}
      {!isOnline && <OfflineBanner />}
      <Header onNotifClick={handleNotifClick} hasUnread={showBellDot} user={user} onSearchClick={() => setSearchOpen(true)} accentStyle={accentStyle} />
      <QuickSearchBar open={searchOpen} onClose={() => setSearchOpen(false)} accentStyle={accentStyle} />
      <NotifPopup open={notifOpen} onClose={() => setNotifOpen(false)} items={latest} onMarkRead={markNotifRead} dbNotifs={dbNotifs} user={user} accentStyle={accentStyle} />

      <main className="relative max-w-md mx-auto px-4 pt-16 space-y-6 z-10">
        {error && !loading ? (
          <HomeErrorState onRetry={() => fetchData(true)} accentStyle={accentStyle} />
        ) : (
          <>
            <section>
              {loading ? <div className="aspect-[4/3] rounded-2xl bg-[#1c1c1c] animate-pulse" /> : <HeroCarousel items={popular} accentStyle={accentStyle} />}
            </section>

            {!loading && recentReads.length > 0 && <RecentReads reads={recentReads} accent={accent} accentStyle={accentStyle} />}

            <section>
              <SectionHeader title="Populer Hari Ini" icon={Star} actionLabel="Lihat Semua" actionHref="/popular" accentStyle={accentStyle} subtitle="Paling banyak dibaca" />
              {loading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {popular.map((item, i) => <div key={`${item.slug}-${i}`} className="flex-shrink-0 w-[132px]"><MangaCard item={item} variant="compact" index={i} accent={accent} accentStyle={accentStyle} /></div>)}
                </div>
              )}
            </section>

            {!loading && editorsPick.length > 0 && (
              <section>
                <SectionHeader title="Pilihan Editor" icon={Crown} accentStyle={accentStyle} subtitle="Rating tertinggi minggu ini"
                  badge={<span className="px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-bold uppercase shrink-0">TOP</span>} />
                <div className="grid grid-cols-3 gap-3">
                  {editorsPick.map((item, i) => <div key={`${item.slug}-${i}`} className="h-full"><MangaCard item={item} variant="default" index={i} accent={accent} accentStyle={accentStyle} /></div>)}
                </div>
              </section>
            )}

            {!loading && newReleases.length > 0 && (
              <section>
                <SectionHeader title="Baru Rilis" icon={Sparkles} accentStyle={accentStyle} subtitle="Update terbaru"
                  badge={<span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase">NEW</span>} />
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {newReleases.map((item, i) => <NewReleaseCard key={`${item.slug}-${i}`} item={item} accent={accent} accentStyle={accentStyle} />)}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title="Episode Terbaru" icon={Clock} actionLabel="Lihat Semua" actionHref="/latest" accentStyle={accentStyle} subtitle="Update real-time" />
              {loading ? (
                <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonProject key={i} />)}</div>
              ) : (
                <div className="space-y-1">{latest.slice(0, 6).map((item, i) => <ProjectCard key={`${item.slug}-${i}`} item={item} index={i} accent={accent} accentStyle={accentStyle} />)}</div>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", accentStyle.bg)}><BadgeCheck className="w-3 h-3 text-white" /></div>
                  <div>
                    <h3 className="text-white font-semibold text-base leading-tight tracking-tight">Project Update</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{projects.length} komik aktif</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#141414] border border-white/[0.06] rounded-lg p-0.5">
                  <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-all active:scale-90", viewMode === "grid" ? cn("text-white", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-all active:scale-90", viewMode === "list" ? cn("text-white", accentStyle.bg) : "text-neutral-500 hover:text-neutral-300")}><LayoutList className="w-4 h-4" /></button>
                </div>
              </div>
              {loading ? (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {Array.from({ length: 4 }).map((_, i) => viewMode === "grid" ? <div key={i} className="aspect-[2/3] rounded-xl bg-[#1c1c1c] animate-pulse" /> : <SkeletonProject key={i} />)}
                </div>
              ) : (
                <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-1")}>
                  {projects.slice(0, 10).map((item, i) => viewMode === "grid"
                    ? <MangaCard key={`${item.slug}-${i}`} item={item} variant="project" index={i} accent={accent} accentStyle={accentStyle} />
                    : <ProjectCard key={`${item.slug}-${i}`} item={item} index={i} accent={accent} accentStyle={accentStyle} />)}
                </div>
              )}
            </section>

            <div className="h-4" />
          </>
        )}
      </main>

      <ScrollToTop accentStyle={accentStyle} />
      {!loading && allItems.length > 0 && <RandomPickButton items={allItems} />}
    </div>
  );
}
