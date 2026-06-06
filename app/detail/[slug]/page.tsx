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
} from "lucide-react";

// ─── IMPORT FIREBASE ───
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

/* ─── Tipe Data Lokal ─── */
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
}

/* ─── Kunci Penyimpanan Lokal ─── */
const READ_CHAPTERS_KEY = "tsukinest_read_chapters";
const THEME_KEY = "tsukinest_theme";

/* ─── Utilitas ─── */
function cleanThumb(url: string): string {
  if (!url) return "";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  if (
    finalUrl.startsWith("http") &&
    !finalUrl.includes("wsrv.nl") &&
    !finalUrl.includes("placehold")
  ) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=600&output=webp&q=85`;
  }
  return finalUrl;
}

function cleanThumbHero(url: string): string {
  if (!url) return "";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  if (
    finalUrl.startsWith("http") &&
    !finalUrl.includes("wsrv.nl") &&
    !finalUrl.includes("placehold")
  ) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=1200&output=webp&q=80&blur=5`;
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
  } catch (e) {
    // Abaikan jika error parsing
  }
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  return finalUrl;
}

/* ─── Hook untuk Animasi Scroll ─── */
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
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ─── Komponen Animasi Masuk ─── */
function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();
  const directionStyles = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directionStyles[direction]}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Komponen Glass ─── */
function Glass({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={`bg-[#16161e]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 ${
        hover ? "hover:border-white/[0.12] transition-all duration-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Badge Component ─── */
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
    default: "bg-white/5 text-gray-400 border-white/10",
    primary: `${accentStyle.soft} ${accentStyle.text} border border-transparent`,
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border ${variants[variant]} ${className}`}
    >
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
    primary: `${accentStyle.text} ${accentStyle.soft}`,
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
    sky: "text-sky-400 bg-sky-500/10",
  };

  return (
    <FadeIn>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-gray-200">{value}</p>
        </div>
      </div>
    </FadeIn>
  );
}

/* ─── Image With Fallback ─── */
function SafeImage({
  src,
  alt,
  fill,
  className = "",
  priority,
  onError,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (!failed) {
      if (imgSrc.includes("wsrv.nl")) {
        const original = getOriginalUrl(imgSrc);
        if (original && original !== imgSrc) {
          setImgSrc(original);
          return;
        }
      }
      setFailed(true);
      onError?.();
    }
  };

  if (failed) {
    return (
      <div
        className={`bg-[#1c1c24] flex flex-col items-center justify-center text-center p-2 ${
          fill ? "absolute inset-0 w-full h-full" : "w-full h-full"
        } ${className}`}
      >
        <ImageIcon className="text-gray-600 w-8 h-8 mb-2" />
        <span className="text-[10px] text-gray-500 font-medium line-clamp-2 px-1 leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${fill ? "absolute inset-0 w-full h-full" : ""} ${className}`}
      onError={handleError}
      {...(priority ? { fetchPriority: "high" as any } : {})}
    />
  );
}

/* ─── Halaman Utama ─── */
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

  // ─── Helper: Ekstrak nilai numerik dari chapter_number (ABAIKAN index) ───
  const getChapterNumberValue = useCallback((chapter: ChapterItem): number => {
    // Ekstrak angka (bisa desimal) dari string seperti "Chapter 179.2", "Chapter 179 END", "Chapter 01"
    const match = chapter.chapter_number?.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[0]);
    return 0;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_CHAPTERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReadChapters(parsed);
        if (parsed.length > 0) {
          setLastReadChapter(parsed[parsed.length - 1]);
        }
      }
      const storedMode = localStorage.getItem(THEME_KEY);
      if (storedMode) {
        setReadingMode(storedMode as any);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat bab lokal:", err);
    }
  }, []);

  useEffect(() => {
    if (!user || !slug) return;
    const checkBookmark = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "bookmarks", slug);
        const snap = await getDoc(docRef);
        setIsBookmarked(snap.exists());
      } catch (err) {
        console.error("Gagal memverifikasi markah:", err);
      }
    };
    checkBookmark();
  }, [user, slug]);

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
          thumb: cleanThumb(raw.thumb),
          rating: raw.rating,
          status: raw.status,
          type: raw.type,
          author: raw.author || raw.authors?.[0],
          artist: raw.artist || raw.artists?.[0],
          genres: raw.genres || [],
          synopsis: raw.synopsis || "Sinopsis belum tersedia untuk seri ini.",
          chapters: (raw.chapters || []).map((c: any) => ({
            index: c.index,
            chapter_url: c.chapter_url || c.link,
            chapter_number: c.chapter_number || c.chapter,
            release_date: c.release_date,
            slug: c.slug,
            views: c.views || "0",
            pages: c.pages || 0,
          })),
          views: raw.views || "0",
          followers: raw.followers || "0",
          release_year: raw.release_year || raw.year,
          total_chapters: raw.total_chapters || (raw.chapters || []).length,
          updated_at: raw.updated_at || raw.last_updated,
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
        const payload = {
          id: slug,
          slug: slug,
          title: data.title,
          thumb: data.thumb,
          type: data.type || "MANHWA",
          rating: data.rating || "0",
          latest_chapter: data.chapters[0]?.chapter_number || "Ch. ?",
          savedAt: Date.now(),
        };
        await setDoc(docRef, payload);
      }
    } catch (err) {
      console.error("Gagal menyimpan markah:", err);
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

  // Filter dan sorting chapters (di-memo)
  const filteredChapters = useMemo(() => {
    if (!data) return [];
    return data.chapters.filter(
      (ch) =>
        ch.chapter_number.toLowerCase().includes(chapterFilter.toLowerCase()) ||
        (ch.release_date && ch.release_date.toLowerCase().includes(chapterFilter.toLowerCase()))
    );
  }, [data, chapterFilter]);

  const sortedChapters = useMemo(() => {
    return [...filteredChapters].sort((a, b) => {
      const aVal = getChapterNumberValue(a);
      const bVal = getChapterNumberValue(b);
      if (chapterSort === "newest") {
        return bVal - aVal;
      }
      return aVal - bVal;
    });
  }, [filteredChapters, chapterSort, getChapterNumberValue]);

  // Bab terbaru (untuk tombol utama)
  const latestChapter = useMemo(() => {
    if (!data || data.chapters.length === 0) return null;
    const allSorted = [...data.chapters].sort((a, b) => {
      return getChapterNumberValue(b) - getChapterNumberValue(a);
    });
    return allSorted[0];
  }, [data, getChapterNumberValue]);

  // ─── Kalkulasi Total Bab Realistis ───
  const displayTotalChapters = useMemo(() => {
    if (!data) return 0;
    if (latestChapter) {
      const maxVal = getChapterNumberValue(latestChapter);
      // Gunakan nilai terbesar: apakah jumlah array (misal ada chapter bonus/0) atau nomor chapter tertinggi (agar Fix)
      return Math.max(maxVal, data.chapters.length);
    }
    return data.total_chapters || data.chapters.length;
  }, [data, latestChapter, getChapterNumberValue]);

  const shownChapters = showAllChapters ? sortedChapters : sortedChapters.slice(0, 15);

  const continueReadingChapter = lastReadChapter ? data?.chapters.find((ch) => ch.slug === lastReadChapter) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>
        <div className="px-4 -mt-32 relative z-10 max-w-4xl mx-auto space-y-4">
          <div className="flex gap-6">
            <div className="w-40 md:w-52 aspect-[3/4] rounded-2xl bg-[#1c1c24] animate-pulse shadow-2xl" />
            <div className="flex-1 space-y-3 pt-16">
              <div className="h-8 bg-[#1c1c24] rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-[#1c1c24] rounded-lg w-1/2 animate-pulse" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-20 bg-[#1c1c24] rounded-full animate-pulse" />
                <div className="h-6 w-24 bg-[#1c1c24] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-32 bg-[#1c1c24]/80 rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#1c1c24]/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <Glass className="p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
            <Sparkles className="text-red-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Oops!</h3>
          <p className="text-red-400/80 mb-8 font-medium">{error || "Informasi seri tidak ditemukan."}</p>
          <button
            onClick={handleBack}
            className="w-full py-3.5 bg-white/10 hover:bg-white/15 rounded-xl transition font-bold flex items-center justify-center gap-2 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
        </Glass>
      </div>
    );
  }

  const genres: string[] = (data.genres || []).map((g: any) => (typeof g === "string" ? g : g.name));
  const authors = data.author ? [data.author] : data.authors || [];
  const artists = data.artist ? [data.artist] : data.artists || [];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100 selection:bg-white/10 font-sans pb-24 overflow-x-hidden">
      {/* ═══ Notification Toast ═══ */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1c1c24]/95 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 shadow-2xl flex items-center gap-3">
            <Info className={`w-5 h-5 ${accentStyle.text}`} />
            <span className="text-sm font-medium">Silakan login untuk menyimpan ke koleksi</span>
            <button onClick={() => setShowNotification(false)} className="ml-2 hover:text-white text-gray-400">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Share Modal ═══ */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Glass className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Bagikan Seri</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5"
              >
                {copied ? <CheckCircle2 className="text-emerald-400" size={20} /> : <Copy size={20} className="text-gray-400" />}
                <span className="font-medium">{copied ? "Tersalin!" : "Salin Link"}</span>
              </button>
              <div className="grid grid-cols-3 gap-3">
                {["Twitter", "Facebook", "WhatsApp"].map((platform) => (
                  <button
                    key={platform}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 text-xs font-bold"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </Glass>
        </div>
      )}

      {/* ═══ Latar Belakang Cover (Hero) ═══ */}
      <section className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={cleanThumbHero(data.thumb) || "/no-image.png"}
            alt={data.title}
            fill
            className="object-cover object-center scale-110 blur-xl opacity-40"
            priority
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-black/40 via-transparent to-transparent" />

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse delay-700" />
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000" />
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
          <button
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition active:scale-95 shadow-lg group"
          >
            <ArrowLeft size={20} className="text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border transition active:scale-95 shadow-lg ${
                isLiked ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-black/40 border-white/10 hover:bg-white/10 text-white"
              }`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={handleShare}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition active:scale-95 shadow-lg"
            >
              <Share2 size={18} className="text-white" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition active:scale-95 shadow-lg"
            >
              <MoreHorizontal size={18} className="text-white" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="absolute top-16 right-4 z-30 animate-in slide-in-from-top-2 fade-in duration-200">
            <Glass className="w-64 p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mode Baca</p>
                <div className="grid grid-cols-3 gap-2">
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
                      className={`p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                        readingMode === mode
                          ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}`
                          : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kualitas Gambar</p>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setImageQuality(q)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition ${
                        imageQuality === q ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}` : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {q === "high" ? "Tinggi" : q === "medium" ? "Sedang" : "Rendah"}
                    </button>
                  ))}
                </div>
              </div>
            </Glass>
          </div>
        )}
      </section>

      {/* ═══ Konten Utama ═══ */}
      <div className="px-4 -mt-36 md:-mt-48 relative z-10 max-w-4xl mx-auto space-y-6">
        {/* ── Profile Card ── */}
        <FadeIn delay={100}>
          <div className="flex gap-5 md:gap-8 items-end">
            <div className="shrink-0 w-36 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ring-2 ring-white/10 relative bg-[#1e1e24] z-20 group">
              <SafeImage src={data.thumb || "/no-image.png"} alt={data.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {data.type && (
                <div className="absolute top-3 left-3 z-30">
                  <Badge variant="primary" icon={<Zap size={10} />}>
                    {data.type}
                  </Badge>
                </div>
              )}

              {data.rating && data.rating !== "0" && data.rating !== "N/A" ? (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg z-30">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white">{data.rating}</span>
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 mb-2">
                {data.status && (
                  <Badge variant="success" icon={<Activity size={10} />}>
                    {data.status}
                  </Badge>
                )}
                {data.release_year && (
                  <Badge variant="info" icon={<Calendar size={10} />}>
                    {data.release_year}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black leading-tight text-white drop-shadow-lg tracking-tight">{data.title}</h1>

              {data.alternative_title && (
                <p className="text-xs md:text-sm text-gray-400 mt-2 line-clamp-1 font-medium">{data.alternative_title}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                {data.views && data.views !== "0" ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Eye size={14} className={accentStyle.text} />
                    <span className="font-bold">{data.views}</span>
                    <span className="text-gray-600">x dilihat</span>
                  </div>
                ) : null}
                {data.followers && data.followers !== "0" ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users size={14} className="text-rose-400" />
                    <span className="font-bold">{data.followers}</span>
                    <span className="text-gray-600">pengikut</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Action Buttons ── */}
        <FadeIn delay={200}>
          <div className="flex gap-3 mt-2">
            {continueReadingChapter ? (
              <Link
                href={`/read/${continueReadingChapter.slug}`}
                onClick={() => markChapterAsRead(continueReadingChapter.slug)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r ${accentStyle.gradient} text-white font-bold transition shadow-lg ${accentStyle.glow} active:scale-[0.98] group`}
              >
                <Play size={18} className="group-hover:scale-110 transition-transform" />
                Lanjutkan {continueReadingChapter.chapter_number}
              </Link>
            ) : latestChapter ? (
              <Link
                href={`/read/${latestChapter.slug}`}
                onClick={() => markChapterAsRead(latestChapter.slug)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r ${accentStyle.gradient} text-white font-bold transition shadow-lg ${accentStyle.glow} active:scale-[0.98] group`}
              >
                <BookOpen size={18} />
                Mulai Membaca
              </Link>
            ) : (
              <div className="flex-1 py-4 rounded-xl bg-white/5 text-gray-500 font-bold text-center">Tidak ada bab tersedia</div>
            )}

            <button
              onClick={toggleBookmark}
              className={`flex-shrink-0 w-14 flex items-center justify-center rounded-xl border transition active:scale-95 ${
                isBookmarked
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
            >
              {isBookmarked ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex-shrink-0 w-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition active:scale-95"
            >
              <Share2 size={20} />
            </button>
          </div>
        </FadeIn>

        {/* ── Stats Grid ── */}
        <FadeIn delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<User size={16} />} label="Penulis" value={authors[0] || "-"} color="primary" />
            <StatCard icon={<Paintbrush size={16} />} label="Ilustrator" value={artists[0] || "-"} color="emerald" />
            <StatCard icon={<Hash size={16} />} label="Total Bab" value={String(displayTotalChapters)} color="amber" />
            <StatCard icon={<Clock size={16} />} label="Diperbarui" value={data.updated_at || "Baru saja"} color="sky" />
          </div>
        </FadeIn>

        {/* ── Synopsis ── */}
        <FadeIn delay={400}>
          <Glass hover>
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-lg ${accentStyle.soft} flex items-center justify-center`}>
                  <BookOpen size={16} className={accentStyle.text} />
                </div>
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Sinopsis</h2>
              </div>

              <div className="relative">
                <p className={`text-sm text-gray-300 leading-[1.8] font-medium ${!showFullSynopsis && data.synopsis.length > 200 ? "line-clamp-4" : ""}`}>{data.synopsis}</p>

                {!showFullSynopsis && data.synopsis.length > 200 && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#16161e] to-transparent" />}
              </div>

              {data.synopsis.length > 200 && (
                <button
                  onClick={() => setShowFullSynopsis((s) => !s)}
                  className={`mt-4 text-xs font-bold ${accentStyle.text} hover:brightness-125 transition flex items-center gap-1.5 group`}
                >
                  {showFullSynopsis ? "Sembunyikan" : "Baca Selengkapnya"}
                  {showFullSynopsis ? (
                    <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  ) : (
                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  )}
                </button>
              )}
            </div>
          </Glass>
        </FadeIn>

        {/* ── Genres ── */}
        {genres.length > 0 ? (
          <FadeIn delay={500}>
            <Glass hover>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${accentStyle.soft} flex items-center justify-center`}>
                    <Tag size={16} className={accentStyle.text} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Genre</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {genres.map((g, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </Glass>
          </FadeIn>
        ) : null}

        {/* ── Tabs Navigation ── */}
        <FadeIn delay={600}>
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            {[
              { id: "chapters" as const, label: "Daftar Bab", icon: Layers },
              { id: "info" as const, label: "Informasi", icon: Info },
              { id: "related" as const, label: "Seri Serupa", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}`
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* ── Chapters Tab ── */}
        {activeTab === "chapters" && (
          <FadeIn delay={100}>
            <Glass className="overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${accentStyle.soft} flex items-center justify-center`}>
                    <Layers size={16} className={accentStyle.text} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Daftar Bab</h2>
                    <p className="text-[10px] text-gray-500 font-medium">{displayTotalChapters} bab tersedia</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Cari bab..."
                      value={chapterFilter}
                      onChange={(e) => setChapterFilter(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition w-40 md:w-48"
                    />
                  </div>

                  <button
                    onClick={() => setChapterSort(chapterSort === "newest" ? "oldest" : "newest")}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition text-gray-400 hover:text-white"
                    title={chapterSort === "newest" ? "Terbaru" : "Terlama"}
                  >
                    {chapterSort === "newest" ? <SortDesc size={16} /> : <SortAsc size={16} />}
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                {shownChapters.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Tidak ada bab yang cocok dengan pencarian</div>
                ) : (
                  shownChapters.map((ch, idx) => {
                    const isRead = readChapters.includes(ch.slug);
                    const isLatest = chapterSort === "newest" && idx === 0;
                    const isLastRead = lastReadChapter === ch.slug;

                    return (
                      <Link
                        key={ch.slug || idx}
                        href={`/read/${ch.slug}`}
                        onClick={() => markChapterAsRead(ch.slug)}
                        className={`flex items-center justify-between px-5 py-4 transition border-b border-white/[0.04] last:border-0 group relative ${
                          isRead ? "bg-black/20" : "hover:bg-white/[0.03] active:bg-white/[0.05]"
                        } ${isLastRead ? `${accentStyle.soft} opacity-80` : ""}`}
                      >
                        {isLastRead && <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accentStyle.bg}`} />}

                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isRead
                                ? "bg-gray-600"
                                : isLatest
                                ? `${accentStyle.bg} shadow-lg ${accentStyle.glow} animate-pulse`
                                : "bg-white/30"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold transition truncate ${isRead ? "text-gray-500" : "text-gray-200 group-hover:text-white"}`}>{ch.chapter_number}</p>

                              {isLatest && (
                                <Badge variant="primary" icon={<Flame size={8} />}>
                                  Terbaru
                                </Badge>
                              )}

                              {isLastRead && (
                                <Badge variant="warning" icon={<Bookmark size={8} />}>
                                  Terakhir Dibaca
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                              {ch.release_date ? (
                                <span className={`text-[10px] font-medium flex items-center gap-1 ${isRead ? "text-gray-600" : "text-gray-500"}`}>
                                  <Calendar size={10} />
                                  {ch.release_date}
                                </span>
                              ) : null}
                              {ch.views && String(ch.views) !== "0" ? (
                                <span className={`text-[10px] font-medium flex items-center gap-1 ${isRead ? "text-gray-600" : "text-gray-500"}`}>
                                  <Eye size={10} />
                                  {ch.views}
                                </span>
                              ) : null}
                              {ch.pages && ch.pages > 0 ? (
                                <span className={`text-[10px] font-medium flex items-center gap-1 ${isRead ? "text-gray-600" : "text-gray-500"}`}>
                                  <BookOpen size={10} />
                                  {ch.pages} hal
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isRead && (
                            <span className="text-[10px] font-bold text-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                              Selesai
                            </span>
                          )}
                          <ChevronRight
                            size={18}
                            className={`shrink-0 transition ${
                              isRead
                                ? "text-gray-600"
                                : `text-gray-500 ${
                                    accent === "custom"
                                      ? "group-hover:text-[var(--tsuki-custom-hex)]"
                                      : accentStyle.text.replace("text-", "group-hover:text-")
                                  } group-hover:translate-x-1`
                            }`}
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {sortedChapters.length > 15 ? (
                <button
                  onClick={() => setShowAllChapters((s) => !s)}
                  className={`w-full py-4 text-xs font-bold ${accentStyle.text} hover:brightness-125 bg-white/[0.02] hover:bg-white/[0.04] transition border-t border-white/[0.06] flex items-center justify-center gap-2 uppercase tracking-widest group`}
                >
                  {showAllChapters ? (
                    <>
                      <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                      Tampilkan Lebih Sedikit
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                      Muat Semua Bab ({sortedChapters.length})
                    </>
                  )}
                </button>
              ) : null}
            </Glass>
          </FadeIn>
        )}

        {/* ── Info Tab ── */}
        {activeTab === "info" && (
          <FadeIn delay={100}>
            <div className="space-y-4">
              <Glass hover className="p-5 md:p-6">
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info size={16} className={accentStyle.text} />
                  Detail Seri
                </h3>

                <div className="space-y-4">
                  {[
                    { label: "Judul", value: data.title },
                    { label: "Judul Alternatif", value: data.alternative_title || "-" },
                    { label: "Status", value: data.status || "-" },
                    { label: "Tipe", value: data.type || "-" },
                    { label: "Tahun Rilis", value: data.release_year || "-" },
                    { label: "Total Bab", value: String(displayTotalChapters) },
                    { label: "Penulis", value: authors.join(", ") || "-" },
                    { label: "Ilustrator", value: artists.join(", ") || "-" },
                    { label: "Genre", value: genres.join(", ") || "-" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-sm text-gray-300 font-medium text-right max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Glass>

              {readChapters.length > 0 ? (
                <Glass hover className="p-5 md:p-6">
                  <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    Progress Membaca
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>
                        {readChapters.length} dari {displayTotalChapters} bab
                      </span>
                      <span className={`font-bold ${accentStyle.text}`}>{Math.round((readChapters.length / displayTotalChapters) * 100)}%</span>
                    </div>

                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${accentStyle.gradient} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${(readChapters.length / displayTotalChapters) * 100}%` }}
                      />
                    </div>
                  </div>
                </Glass>
              ) : null}
            </div>
          </FadeIn>
        )}

        {/* ── Related Tab (Placeholder) ── */}
        {activeTab === "related" && (
          <FadeIn delay={100}>
            <Glass className="p-8 text-center">
              <div className={`w-16 h-16 ${accentStyle.soft} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Sparkles className={`w-8 h-8 ${accentStyle.text}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Segera Hadir</h3>
              <p className="text-sm text-gray-500">Fitur rekomendasi seri serupa akan segera tersedia</p>
            </Glass>
          </FadeIn>
        )}
      </div>

      {/* ═══ Floating Action Button (Mobile) ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
        {latestChapter ? (
          <Link
            href={`/read/${latestChapter.slug}`}
            onClick={() => markChapterAsRead(latestChapter.slug)}
            className={`flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r ${accentStyle.gradient} text-white font-bold rounded-full shadow-2xl ${accentStyle.glow} active:scale-95 transition`}
          >
            <BookOpen size={18} />
            Baca Sekarang
          </Link>
        ) : null}
      </div>
    </main>
  );
}
