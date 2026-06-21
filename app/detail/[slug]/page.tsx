// app/detail/[slug]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDetail } from "@/lib/api";
import { useAccent } from "@/lib/accent";
import {
  ArrowLeft,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  BookOpen,
  Bookmark,
  Star,
  Activity,
  Layers,
  User,
  Users,
  Paintbrush,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Share2,
  Heart,
  TrendingUp,
  Eye,
  Play,
  Sparkles,
  Info,
  Calendar,
  Hash,
  Zap,
  Flame,
  Trophy,
  BookmarkCheck,
  X,
  Copy,
  CheckCircle2,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Search,
  Monitor,
  ImageIcon,
  Check,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

/* ─── Tipe Data ─── */
interface ChapterItem {
  index?: number;
  chapter_url?: string;
  chapter_number: string;
  release_date?: string;
  slug: string;
  views?: string;
  pages?: number;
}

interface MangaDetail {
  title: string;
  alternative_title?: string;
  thumb: string;
  rating?: string;
  status?: string;
  type?: string;
  author?: string;
  authors?: string[];
  artist?: string;
  artists?: string[];
  genres?: (string | { name: string; url?: string })[];
  synopsis: string;
  chapters: ChapterItem[];
  views?: string;
  followers?: string;
  release_year?: string;
  total_chapters?: number;
  updated_at?: string;
  related_series?: {
    title: string;
    slug: string;
    thumb: string;
    type: string;
    latest_chapter?: string;
    rating?: string;
    link?: string;
  }[];
}

const READ_CHAPTERS_KEY = "tsukinest_read_chapters";
const THEME_KEY = "tsukinest_theme";

/* ─── Utils ─── */
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  if (finalUrl.startsWith("http") && !finalUrl.includes("wsrv.nl")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=600&output=webp&q=85`;
  }
  return finalUrl;
}

function getOriginalUrl(url: string): string {
  if (!url) return "";
  try {
    if (url.includes("wsrv.nl")) {
      const urlObj = new URL(url);
      const originalUrl = urlObj.searchParams.get("url");
      if (originalUrl) return decodeURIComponent(originalUrl);
    }
  } catch {
    // ignore
  }
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  return finalUrl;
}

/* ─── Click Outside Hook ─── */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/* ─── Scroll Animation Hook ─── */
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ─── Fade In Component ─── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out transform-gpu",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Card ─── */
function Card({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-[#141414] border border-white/[0.05] rounded-2xl",
        hover && "hover:border-white/[0.1] transition-colors duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── Badge ─── */
function Badge({
  children,
  variant = "default",
  icon,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
  className?: string;
}) {
  const { style: accentStyle } = useAccent();
  const variants = {
    default: "bg-[#1c1c1c] text-neutral-400 border-white/[0.05]",
    primary: cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent"),
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/10",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/10",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/10",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border", variants[variant], className)}>
      {icon}
      {children}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  const { style: accentStyle } = useAccent();
  const colorMap: Record<string, string> = {
    primary: cn(accentStyle.text, accentStyle.bg + "/10"),
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    sky: "text-sky-400 bg-sky-500/10",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", colorMap[color] || colorMap.primary)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-neutral-200 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─── Smart Image ─── */
function SmartImage({
  src,
  alt,
  title,
  fill,
  className = "",
  priority,
  ...props
}: {
  src: string;
  alt: string;
  title: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}) {
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [hasTriedOriginal, setHasTriedOriginal] = useState(false);
  const [hasTriedAniList, setHasTriedAniList] = useState(false);

  const fetchAniListFallback = async () => {
    if (hasTriedAniList) return;
    setHasTriedAniList(true);

    try {
      const cleanTitle = title.split(/[-–—~,|:]/)[0].replace(/[★☆]/g, " ").trim();
      const query = `
        query ($search: String) {
          Media (search: $search, type: MANGA) {
            coverImage {
              extraLarge
              large
            }
          }
        }
      `;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search: cleanTitle } })
      });

      if (!res.ok) {
        setImgSrc("/no-image.png");
        return;
      }

      const json = await res.json();
      const coverImage = json?.data?.Media?.coverImage;
      const altPoster = coverImage?.extraLarge || coverImage?.large;

      if (altPoster) {
        setImgSrc(altPoster);
      } else {
        setImgSrc("/no-image.png");
      }
    } catch (error) {
      setImgSrc("/no-image.png");
    }
  };

  useEffect(() => {
    const isPlaceholder = 
      !src || 
      src.includes("via.placeholder.com") || 
      src.includes("no-image.png") ||
      title?.toLowerCase().includes("lookism");

    if (isPlaceholder) {
      fetchAniListFallback();
    } else {
      setImgSrc(src);
      setHasTriedOriginal(false);
      setHasTriedAniList(false);
    }
  }, [src, title]);

  const handleError = () => {
    if (imgSrc.includes("wsrv.nl") && !hasTriedOriginal) {
      setHasTriedOriginal(true);
      const original = getOriginalUrl(imgSrc);
      if (original && original !== imgSrc) {
        setImgSrc(original);
        return;
      }
    }
    fetchAniListFallback();
  };

  if (imgSrc === "/no-image.png") {
    return (
      <div
        className={cn(
          "bg-[#1c1c1c] flex flex-col items-center justify-center text-center p-2",
          fill ? "absolute inset-0 w-full h-full" : "w-full h-full",
          className
        )}
      >
        <ImageIcon className="text-neutral-600 w-6 h-6 mb-1" />
        <span className="text-[10px] text-neutral-500 font-medium line-clamp-2 px-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn(fill ? "absolute inset-0 w-full h-full object-cover" : "", className)}
      onError={handleError}
      {...(priority ? { fetchPriority: "high" as any } : {})}
      {...props}
    />
  );
}


/* ─── Main Page ─── */
export default function DetailPage() {
  const { accent, style: accentStyle } = useAccent();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "info" | "related">("chapters");
  const [chapterFilter, setChapterFilter] = useState("");
  const [chapterSort, setChapterSort] = useState<"newest" | "oldest">("newest");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal" | "webtoon">("vertical");
  const [imageQuality, setImageQuality] = useState<"high" | "medium" | "low">("high");
  const [showNotification, setShowNotification] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<string | null>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);

  useClickOutside(settingsRef, () => setShowSettings(false));

  /* ─── Auth ─── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  /* ─── Load Local Data ─── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_CHAPTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReadChapters(parsed);
        if (parsed.length > 0) setLastReadChapter(parsed[parsed.length - 1]);
      }
      const storedMode = localStorage.getItem(THEME_KEY);
      if (storedMode) setReadingMode(storedMode as any);
    } catch {
      // ignore
    }
  }, []);

  /* ─── Check Bookmark ─── */
  useEffect(() => {
    if (!user || !slug) return;
    const checkBookmark = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "bookmarks", slug);
        const snap = await getDoc(docRef);
        setIsBookmarked(snap.exists());
      } catch (err) {
        console.error("Gagal cek bookmark:", err);
      }
    };
    checkBookmark();
  }, [user, slug]);

  /* ─── Fetch Detail ─── */
  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getDetail(slug);
        if (!res?.success || !res.data) {
          setError("Gagal memuat informasi seri.");
          return;
        }

        const raw = res.data as any;
        const normalized: MangaDetail = {
          title: raw.title || "Judul Tidak Tersedia",
          alternative_title: raw.alternative_title,
          thumb: cleanThumb(raw.thumb || raw.thumbnail || ""),
          rating: raw.rating,
          status: raw.status,
          type: raw.type,
          author: raw.author || raw.authors?.[0],
          artist: raw.artist || raw.artists?.[0],
          genres: raw.genres || [],
          synopsis: raw.synopsis || "Sinopsis belum tersedia untuk seri ini.",
          chapters: (raw.chapters || []).map((c: any, idx: number) => ({
            index: c.index ?? idx,
            chapter_url: c.chapter_url || c.link,
            chapter_number: c.chapter_number || c.chapter || `Ch. ${idx + 1}`,
            release_date: c.release_date,
            slug: c.slug || c.chapter_slug || "",
            views: c.views || "0",
            pages: c.pages || 0,
          })),
          views: raw.views || "0",
          followers: raw.followers || "0",
          release_year: raw.release_year || raw.year || raw.released,
          total_chapters: raw.total_chapters,
          updated_at: raw.updated_at || raw.last_updated || raw.updated_on,
          related_series: raw.related_series || raw.recommendations || [],
        };

        setData(normalized);
      } catch {
        setError("Terjadi kesalahan sistem saat memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  /* ─── Auto Scroll to Last Read ─── */
  useEffect(() => {
    if (activeTab === "chapters" && lastReadChapter) {
      setTimeout(() => {
        const chapterElement = document.getElementById(`chapter-${lastReadChapter}`);
        if (chapterElement) {
          chapterElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [activeTab, showAllChapters, lastReadChapter]);

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
    } catch (err) {
      console.error("Gagal bookmark:", err);
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleBack = useCallback(() => {
    const from = searchParams.get("from");
    if (from && from.startsWith("/")) {
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
          text: `Baca ${data.title} di TsukiNime!`,
          url: window.location.href,
        });
      } catch {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── Chapter Number Extractor ─── */
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

  /* ─── Filter & Sort Chapters ─── */
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
    return [...data.chapters].sort((a, b) => getChapterNumberValue(b) - getChapterNumberValue(a))[0];
  }, [data, getChapterNumberValue]);

  const continueReadingChapter = lastReadChapter
    ? data?.chapters.find((ch) => ch.slug === lastReadChapter)
    : null;

  /* ─── FIX: Total chapters (Smart Parsing) ─── */
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

  const shownChapters = showAllChapters ? sortedChapters : sortedChapters.slice(0, 15);

  /* ─── Derived Data ─── */
  const genres: string[] = useMemo(
    () => (data?.genres || []).map((g: any) => (typeof g === "string" ? g : g.name)).filter(Boolean),
    [data]
  );
  const authors = data?.author ? [data.author] : data?.authors || [];
  const artists = data?.artist ? [data.artist] : data?.artists || [];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="relative h-[45vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-[#141414] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
        <div className="px-4 -mt-32 relative z-10 max-w-4xl mx-auto space-y-4">
          <div className="flex gap-5">
            <div className="w-36 md:w-48 aspect-[3/4] rounded-2xl bg-[#141414] animate-pulse" />
            <div className="flex-1 space-y-3 pt-16">
              <div className="h-8 bg-[#141414] rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-[#141414] rounded-lg w-1/2 animate-pulse" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-20 bg-[#141414] rounded-full animate-pulse" />
                <div className="h-6 w-24 bg-[#141414] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-32 bg-[#141414] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#141414] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md w-full border-none shadow-none">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-red-400 w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Gagal Memuat</h3>
          <p className="text-red-400/80 mb-6 text-sm">{error || "Data tidak ditemukan."}</p>
          <button
            onClick={handleBack}
            className="w-full py-3 bg-[#1c1c1c] hover:bg-[#262626] rounded-xl transition font-semibold flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-100 selection:bg-white/10 pb-24 overflow-x-hidden">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-[#141414] border border-white/5 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3">
            <Info className={cn("w-5 h-5", accentStyle.text)} />
            <span className="text-sm font-medium">Silakan login untuk menyimpan ke koleksi</span>
            <button onClick={() => setShowNotification(false)} className="ml-2 hover:text-white text-neutral-400">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">Bagikan Seri</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-[#1c1c1c] rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#262626] transition border border-white/5"
              >
                {copied ? <CheckCircle2 className="text-emerald-400" size={18} /> : <Copy size={18} className="text-neutral-400" />}
                <span className="text-sm font-medium">{copied ? "Tersalin!" : "Salin Link"}</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[45vh] md:h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage
            src={data.thumb || "/no-image.png"}
            alt={data.title}
            title={data.title}
            fill
            className="object-cover opacity-55 scale-100 blur-xl transform-gpu"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm border transition active:scale-95",
                isLiked
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-500"
                  : "bg-[#141414]/80 border-white/5 hover:bg-[#1c1c1c] text-white"
              )}
            >
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
            >
              <Share2 size={16} className="text-white" />
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1c1c1c] transition active:scale-95"
              >
                <MoreHorizontal size={16} className="text-white" />
              </button>
              {showSettings && (
                <div className="absolute top-12 right-0 z-30 w-56 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Card className="p-4 space-y-4 shadow-2xl">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Mode Baca</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { mode: "vertical" as const, icon: ArrowDown, label: "Vertikal" },
                          { mode: "horizontal" as const, icon: ArrowLeftIcon, label: "Horizontal" },
                          { mode: "webtoon" as const, icon: Monitor, label: "Webtoon" },
                        ].map(({ mode, icon: Icon, label }) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setReadingMode(mode);
                              localStorage.setItem(THEME_KEY, mode);
                            }}
                            className={cn(
                              "p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition border",
                              readingMode === mode
                                ? cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent")
                                : "bg-[#1c1c1c] text-neutral-400 border-white/5 hover:bg-[#262626]"
                            )}
                          >
                            <Icon size={14} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Kualitas</p>
                      <div className="flex gap-1.5">
                        {(["high", "medium", "low"] as const).map((q) => (
                          <button
                            key={q}
                            onClick={() => setImageQuality(q)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-bold transition border",
                              imageQuality === q
                                ? cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent")
                                : "bg-[#1c1c1c] text-neutral-400 border-white/5 hover:bg-[#262626]"
                            )}
                          >
                            {q === "high" ? "Tinggi" : q === "medium" ? "Sedang" : "Rendah"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-4 -mt-28 md:-mt-36 relative z-10 max-w-4xl mx-auto space-y-5">
        {/* Profile Card */}
        <FadeIn delay={100}>
          <div className="flex gap-4 md:gap-6 items-end">
            <div className="shrink-0 w-32 md:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/5 relative bg-[#141414] z-20 group">
              <SmartImage
                src={data.thumb || "/no-image.png"}
                alt={data.title}
                title={data.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {data.type && (
                <div className="absolute top-2.5 left-2.5 z-30">
                  <Badge variant="primary" icon={<Zap size={10} />}>{data.type}</Badge>
                </div>
              )}
              {data.rating && data.rating !== "0" && data.rating !== "N/A" && (
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-[#141414]/90 backdrop-blur-sm border border-white/5 px-2 py-1 rounded-lg z-30">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-white">{data.rating}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {data.status && (
                  <Badge variant="success" icon={<Activity size={10} />}>{data.status}</Badge>
                )}
                {data.release_year && (
                  <Badge variant="info" icon={<Calendar size={10} />}>{data.release_year}</Badge>
                )}
              </div>

              <h1 className="text-xl md:text-3xl font-extrabold leading-tight text-white tracking-tight">
                {data.title}
              </h1>

              {data.alternative_title && (
                <p className="text-xs text-neutral-500 mt-1.5 line-clamp-1 font-medium">{data.alternative_title}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-3">
                {data.views && data.views !== "0" && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Eye size={13} className={accentStyle.text} />
                    <span className="font-semibold">{data.views}</span>
                    <span className="text-neutral-600">dilihat</span>
                  </div>
                )}
                {data.followers && data.followers !== "0" && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Users size={13} className="text-rose-400" />
                    <span className="font-semibold">{data.followers}</span>
                    <span className="text-neutral-600">pengikut</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Action Buttons */}
        <FadeIn delay={150}>
          <div className="flex gap-2.5">
            {continueReadingChapter ? (
              <Link
                href={`/read/${continueReadingChapter.slug}`}
                prefetch={false}
                onClick={() => markChapterAsRead(continueReadingChapter.slug)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition active:scale-[0.98]",
                  accentStyle.bg
                )}
              >
                <Play size={17} fill="white" /> Lanjutkan {continueReadingChapter.chapter_number}
              </Link>
            ) : latestChapter ? (
              <Link
                href={`/read/${latestChapter.slug}`}
                prefetch={false}
                onClick={() => markChapterAsRead(latestChapter.slug)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition active:scale-[0.98]",
                  accentStyle.bg
                )}
              >
                <BookOpen size={17} /> Baca Sekarang
              </Link>
            ) : (
              <div className="flex-1 py-3.5 rounded-xl bg-[#141414] text-neutral-500 font-bold text-center text-sm border border-white/5">
                Tidak ada bab
              </div>
            )}

            <button
              onClick={toggleBookmark}
              className={cn(
                "w-12 flex items-center justify-center rounded-xl border transition active:scale-95",
                isBookmarked
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                  : "bg-[#141414] border-white/5 text-neutral-400 hover:bg-[#1c1c1c]"
              )}
            >
              {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={200}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <StatCard icon={<User size={15} />} label="Penulis" value={authors[0] || "-"} color="primary" />
            <StatCard icon={<Paintbrush size={15} />} label="Ilustrator" value={artists[0] || "-"} color="emerald" />
            <StatCard icon={<Hash size={15} />} label="Total Bab" value={String(displayTotalChapters)} color="amber" />
            <StatCard icon={<Clock size={15} />} label="Update" value={data.updated_at || "Baru saja"} color="sky" />
          </div>
        </FadeIn>

        {/* Synopsis */}
        <FadeIn delay={250}>
          <Card hover>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
                  <BookOpen size={14} className={accentStyle.text} />
                </div>
                <h2 className="text-sm font-bold text-neutral-200">Sinopsis</h2>
              </div>

              <div className="relative">
                <p className={cn(
                  "text-sm text-neutral-400 leading-relaxed font-medium",
                  !showFullSynopsis && data.synopsis.length > 180 && "line-clamp-4"
                )}>
                  {data.synopsis}
                </p>
                {!showFullSynopsis && data.synopsis.length > 180 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#141414] to-transparent" />
                )}
              </div>

              {data.synopsis.length > 180 && (
                <button
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className={cn("mt-3 text-xs font-bold flex items-center gap-1 transition", accentStyle.text)}
                >
                  {showFullSynopsis ? "Sembunyikan" : "Baca Selengkapnya"}
                  {showFullSynopsis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </Card>
        </FadeIn>

        {/* Genres */}
        {genres.length > 0 && (
          <FadeIn delay={300}>
            <Card hover>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
                    <Tag size={14} className={accentStyle.text} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-200">Genre</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-white/5 text-xs font-semibold text-neutral-400 hover:bg-[#262626] hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Tabs */}
        <FadeIn delay={350}>
          <div className="flex gap-1 p-1 bg-[#141414] rounded-xl border border-white/5">
            {[
              { id: "chapters" as const, label: "Daftar Bab", icon: Layers },
              { id: "info" as const, label: "Detail", icon: Info },
              { id: "related" as const, label: "Serupa", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? cn(accentStyle.bg + "/10", accentStyle.text, "border-transparent bg-[#1c1c1c]")
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-[#1c1c1c]"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <FadeIn>
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141414]">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accentStyle.bg + "/10")}>
                    <Layers size={14} className={accentStyle.text} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-200">Daftar Bab</h2>
                    <p className="text-[10px] text-neutral-500">{displayTotalChapters} bab tersedia</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Cari bab..."
                      value={chapterFilter}
                      onChange={(e) => setChapterFilter(e.target.value)}
                      className="pl-8 pr-3 py-2 bg-[#1c1c1c] border border-white/5 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-white/10 transition w-36"
                    />
                  </div>
                  <button
                    onClick={() => setChapterSort(chapterSort === "newest" ? "oldest" : "newest")}
                    className="p-2 rounded-lg bg-[#1c1c1c] border border-white/5 hover:bg-[#262626] transition text-neutral-400 hover:text-white"
                    title={chapterSort === "newest" ? "Terbaru" : "Terlama"}
                  >
                    {chapterSort === "newest" ? <SortDesc size={15} /> : <SortAsc size={15} />}
                  </button>
                </div>
              </div>

              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a]" ref={chapterListRef}>
                {shownChapters.length === 0 ? (
                  <div className="p-8 text-center text-neutral-600 text-sm">Tidak ada bab yang cocok</div>
                ) : (
                  shownChapters.map((ch, idx) => {
                    const isRead = readChapters.includes(ch.slug);
                    const isLatest = chapterSort === "newest" && idx === 0 && !chapterFilter;
                    const isLastRead = lastReadChapter === ch.slug;

                    return (
                      <Link
                        key={`${ch.slug}-${idx}`}
                        id={`chapter-${ch.slug}`}
                        href={`/read/${ch.slug}`}
                        prefetch={false}
                        onClick={() => markChapterAsRead(ch.slug)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3.5 transition border-b border-white/[0.02] last:border-0 group relative",
                          isRead ? "bg-[#0a0a0a]" : "bg-[#141414] hover:bg-[#1c1c1c]",
                          isLastRead && "bg-[#1c1c1c]"
                        )}
                      >
                        {isLastRead && <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", accentStyle.bg)} />}

                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            isRead ? "bg-neutral-700" : isLatest ? cn(accentStyle.bg, "animate-pulse") : "bg-neutral-600"
                          )} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn(
                                "text-sm font-semibold transition truncate",
                                isRead ? "text-neutral-500" : "text-neutral-300 group-hover:text-white"
                              )}>
                                {ch.chapter_number}
                              </p>
                              {isLatest && <Badge variant="primary" icon={<Flame size={8} />}>Baru</Badge>}
                              {isLastRead && <Badge variant="warning" icon={<Bookmark size={8} />}>Terakhir</Badge>}
                              {isRead && <Badge variant="success" icon={<Check size={8} />}>Selesai</Badge>}
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                              {ch.release_date && (
                                <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                                  <Calendar size={10} /> {ch.release_date}
                                </span>
                              )}
                              {ch.views && String(ch.views) !== "0" && (
                                <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                                  <Eye size={10} /> {ch.views}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={16} className={cn(
                          "shrink-0 transition text-neutral-600",
                          !isRead && "group-hover:translate-x-0.5"
                        )} />
                      </Link>
                    );
                  })
                )}
              </div>

              {sortedChapters.length > 15 && (
                <button
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className={cn(
                    "w-full py-3.5 text-xs font-bold uppercase tracking-wide transition border-t border-white/5 flex items-center justify-center gap-1.5",
                    accentStyle.text,
                    "bg-[#141414] hover:bg-[#1c1c1c]"
                  )}
                >
                  {showAllChapters ? (
                    <>Tampilkan Lebih Sedikit <ChevronUp size={14} /></>
                  ) : (
                    <>Muat Semua Bab ({sortedChapters.length}) <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </Card>
          </FadeIn>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <FadeIn>
            <div className="space-y-4">
              <Card hover className="p-5">
                <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2">
                  <Info size={15} className={accentStyle.text} /> Detail Seri
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Judul", value: data.title },
                    { label: "Alternatif", value: data.alternative_title || "-" },
                    { label: "Status", value: data.status || "-" },
                    { label: "Tipe", value: data.type || "-" },
                    { label: "Tahun", value: data.release_year || "-" },
                    { label: "Total Bab", value: String(displayTotalChapters) },
                    { label: "Penulis", value: authors.join(", ") || "-" },
                    { label: "Ilustrator", value: artists.join(", ") || "-" },
                    { label: "Genre", value: genres.join(", ") || "-" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-start py-2 border-b border-white/[0.02] last:border-0">
                      <span className="text-[11px] text-neutral-600 font-bold uppercase">{item.label}</span>
                      <span className="text-sm text-neutral-400 font-medium text-right max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {readChapters.length > 0 && (
                <Card hover className="p-5">
                  <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2">
                    <Trophy size={15} className="text-amber-400" /> Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>{readChapters.length} dari {displayTotalChapters} bab</span>
                      <span className={cn("font-bold", accentStyle.text)}>
                        {Math.round((readChapters.length / Math.max(displayTotalChapters, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", accentStyle.bg)}
                        style={{ width: `${(readChapters.length / Math.max(displayTotalChapters, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* Related Tab */}
        {activeTab === "related" && (
          <FadeIn>
            {data.related_series && data.related_series.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {data.related_series.map((item, i) => (
                  <Link
                    key={item.slug || i}
                    href={`/detail/${item.slug}`}
                    prefetch={false}
                    className="group flex gap-3 p-3 rounded-xl bg-[#141414] border border-white/5 hover:bg-[#1c1c1c] active:scale-[0.98] transition"
                  >
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c]">
                      <SmartImage
                        src={cleanThumb(item.thumb || "")}
                        alt={item.title}
                        title={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.type && (
                        <span className={cn("absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase", accentStyle.bg)}>
                          {item.type}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-sm font-bold text-neutral-300 line-clamp-2 group-hover:text-white transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                        {item.latest_chapter && (
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} /> {item.latest_chapter}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star size={12} className="fill-amber-500" /> {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-neutral-700 self-center" />
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-none">
                <Sparkles className={cn("w-8 h-8 mx-auto mb-3", accentStyle.text)} />
                <h3 className="text-base font-bold text-white mb-1">Tidak Ada Rekomendasi</h3>
                <p className="text-sm text-neutral-600">Seri serupa belum tersedia untuk saat ini</p>
              </Card>
            )}
          </FadeIn>
        )}
      </div>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
        {latestChapter && (
          <Link
            href={`/read/${latestChapter.slug}`}
            prefetch={false}
            onClick={() => markChapterAsRead(latestChapter.slug)}
            className={cn(
              "flex items-center gap-2 px-6 py-3.5 text-white font-bold text-sm rounded-full shadow-2xl transition active:scale-95",
              accentStyle.bg
            )}
          >
            <BookOpen size={17} /> Baca Sekarang
          </Link>
        )}
      </div>
    </main>
  );
}
