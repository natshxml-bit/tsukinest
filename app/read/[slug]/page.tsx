'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getRead, getDetail } from '@/lib/api';
import { useAccent } from '@/lib/accent';

import { auth, db } from '@/lib/firebase';
import { 
  doc, setDoc, collection, addDoc, query, where, orderBy, 
  onSnapshot, updateDoc, serverTimestamp, Timestamp, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { X, MessageCircle, Settings, ChevronLeft, ChevronRight, Home, Menu, ImageIcon, Send, Trash2, Edit3, Reply, AlertTriangle, BookOpen } from 'lucide-react';

/* ─── Types ─── */
interface ChapterImage {
  index: number;
  url: string;
  alt: string;
}

interface ChapterItem {
  slug: string;
  number: string;
  url?: string;
}

interface ReadData {
  title: string;
  chapter_number: string | number;
  series_title: string;
  series_slug: string;
  prev_chapter: string | null;
  next_chapter: string | null;
  images: ChapterImage[];
  chapters: ChapterItem[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  imageUrl?: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  parentId: string | null;
}

/* ─── Helpers ─── */
const fixUrl = (url: string) => url?.replace(/^http:\/\//i, 'https://') || '';
const formatDate = (ts: Timestamp | null) => {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch { return ''; }
};

/* ─── Memoized Sub-Components ─── */
const CommentNode = memo(function CommentNode({ 
  comment, user, accentStyle, accent, onReply, onEdit, onDelete, allComments 
}: {
  comment: Comment;
  user: FirebaseUser | null;
  accentStyle: any;
  accent: string;
  onReply: (c: Comment) => void;
  onEdit: (c: Comment) => void;
  onDelete: (id: string) => void;
  allComments: Comment[];
}) {
  const canEdit = user?.uid === comment.userId && comment.createdAt && (Date.now() - comment.createdAt.toMillis() <= 15 * 60 * 1000);
  const replies = useMemo(() => allComments.filter(c => c.parentId === comment.id), [allComments, comment.id]);
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex gap-3 p-3 -mx-2 rounded-2xl transition-colors hover:bg-white/[0.02] group">
        <img 
          src={comment.userPhoto || '/no-avatar.png'} 
          alt={comment.userName} 
          className="w-9 h-9 rounded-full bg-gray-800 object-cover ring-1 ring-white/5 shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-200 truncate">{comment.userName}</span>
            <span className="text-[10px] text-gray-600">{formatDate(comment.createdAt)}</span>
            {comment.updatedAt && <span className="text-[10px] text-gray-600 italic">· diedit</span>}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">{comment.text}</p>
          {comment.imageUrl && (
            <img 
              src={comment.imageUrl} 
              alt="Attachment" 
              className="mt-2 max-w-[200px] max-h-[220px] object-cover rounded-xl border border-white/5 cursor-zoom-in hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          )}
          <div className="flex items-center gap-4 mt-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={() => onReply(comment)} className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
              <Reply className="w-3 h-3" /> Balas
            </button>
            {canEdit && (
              <>
                <button onClick={() => onEdit(comment)} className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => onDelete(comment.id)} className="text-[11px] text-red-500/60 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="ml-11 pl-3 border-l border-white/5 space-y-3 mt-1">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 group/reply">
              <img src={reply.userPhoto || '/no-avatar.png'} alt={reply.userName} className="w-7 h-7 rounded-full bg-gray-800 object-cover shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs text-gray-300">{reply.userName}</span>
                  <span className="text-[10px] text-gray-600">{formatDate(reply.createdAt)}</span>
                  {reply.updatedAt && <span className="text-[10px] text-gray-600 italic">· diedit</span>}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed break-words whitespace-pre-wrap">{reply.text}</p>
                {reply.imageUrl && (
                  <img src={reply.imageUrl} className="mt-1.5 max-w-[150px] max-h-[160px] object-cover rounded-lg border border-white/5" loading="lazy" />
                )}
                <div className="flex items-center gap-3 mt-1.5 opacity-100 md:opacity-0 md:group-hover/reply:opacity-100 transition-opacity">
                  <button onClick={() => onReply(reply)} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Balas</button>
                  {user?.uid === reply.userId && reply.createdAt && (Date.now() - reply.createdAt.toMillis() <= 15 * 60 * 1000) && (
                    <>
                      <button onClick={() => onEdit(reply)} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Edit</button>
                      <button onClick={() => onDelete(reply.id)} className="text-[11px] text-red-500/60 hover:text-red-400 transition-colors">Hapus</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/* ─── Main Page ─── */
export default function ReadPage() {
  const { accent, style: accentStyle } = useAccent();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  /* State */
  const [data, setData] = useState<ReadData | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [fit, setFit] = useState<'height' | 'width' | 'original'>('height');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const currentChapterBtnRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [chapterSearch, setChapterSearch] = useState('');

  /* Derived */
  const progress = useMemo(() => {
    if (!data) return 0;
    return mode === 'vertical' ? scrollProgress : ((page + 1) / data.images.length) * 100;
  }, [mode, scrollProgress, page, data]);

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    if (!chapterSearch.trim()) return data.chapters;
    const q = chapterSearch.toLowerCase();
    return data.chapters.filter(ch => ch.number.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q));
  }, [data, chapterSearch]);

  const parentComments = useMemo(() => comments.filter(c => !c.parentId), [comments]);

  /* Effects */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    window.scrollTo(0, 0); 
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res: any = await getRead(slug);
        const ch = res?.data || res;
        if (!ch?.images?.length) throw new Error('No images');

        const images = ch.images.map((img: any, i: number) => 
          typeof img === 'string' 
            ? { index: i, url: img, alt: `Halaman ${i + 1}` }
            : { index: img.index ?? i, url: img.url, alt: img.alt || `Halaman ${i + 1}` }
        );

        let seriesTitle = ch.series_title || '';
        let chapterNum = ch.chapter_number || '';
        let seriesSlug = ch.series_slug || '';

        if (!seriesTitle || !chapterNum) {
          const m = ch.title?.match(/(.*?)\s+(?:Chapter|Ch\.?|Bab)\s*(\d+(?:\.\d+)?)/i);
          if (m) { seriesTitle ||= m[1].trim(); chapterNum ||= m[2]; }
          else seriesTitle ||= ch.title?.replace(/-.*/, '').trim() || 'Membaca Komik';
        }
        seriesSlug ||= slug.replace(/-(?:chapter|ch|bab)-?\d+(?:-\d+)?$/i, '');
        chapterNum ||= slug.match(/\d+(?:-\d+)?$/)?.[0].replace('-', '.') || '?';

        const prev = ch.prev_chapter && ch.prev_chapter !== 'null' ? ch.prev_chapter : null;
        const next = ch.next_chapter && ch.next_chapter !== 'null' ? ch.next_chapter : null;

        const rawChapters: ChapterItem[] = ch.chapters || [];
        const seen = new Set<string>();
        const uniqueChapters = rawChapters.filter(c => {
          if (seen.has(c.slug)) return false;
          seen.add(c.slug);
          return true;
        });

        if (!cancelled) {
          setData({
            title: ch.title || `Chapter ${chapterNum}`,
            chapter_number: chapterNum,
            series_title: seriesTitle,
            series_slug: seriesSlug,
            prev_chapter: prev,
            next_chapter: next,
            images,
            chapters: uniqueChapters,
          });
          setPage(0);
          setBrokenImages(new Set());
          setImgLoaded(false);
          setTimeout(() => window.scrollTo(0, 0), 100);
        }

        if (seriesSlug) {
          try {
            const dres: any = await getDetail(seriesSlug);
            if (!cancelled) setDetailData(dres?.data || dres);
          } catch { /* silent */ }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!user || !data) return;
    const save = async () => {
      try {
        const id = data.series_slug || slug;
        const ref = doc(db, 'users', user.uid, 'history', id);
        const chStr = String(data.chapter_number).toLowerCase().includes('ch') ? String(data.chapter_number) : `Ch. ${data.chapter_number}`;
        await setDoc(ref, {
          id, slug: data.series_slug || slug, chapter_slug: slug,
          title: data.series_title || data.title,
          lastReadChapter: chStr, latest_chapter: chStr,
          savedAt: Date.now(), lastReadAt: Date.now(),
          thumb: detailData?.thumbnail || detailData?.thumb || '',
          type: detailData?.type || 'MANGA',
          status: detailData?.status || '',
        }, { merge: true });
      } catch (err) { console.error('History error:', err); }
    };
    save();
  }, [user, data, detailData, slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const key = 'tsukinest_read_chapters';
      const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[];
      const filtered = arr.filter(c => c !== slug);
      filtered.push(slug);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (err) { console.error(err); }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const q = query(collection(db, 'comments'), where('slug', '==', slug), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    });
  }, [slug]);

  useEffect(() => {
    if (!data || mode !== 'horizontal') return;
    [page - 1, page + 1].forEach(idx => {
      if (idx >= 0 && idx < data.images.length) {
        const img = new Image();
        img.src = fixUrl(data.images[idx].url);
      }
    });
    setImgLoaded(false);
  }, [page, mode, data]);

  useEffect(() => {
    if (showChapterList) {
      setTimeout(() => currentChapterBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    }
  }, [showChapterList]);

  /* ─── FIX LOGIKA NAVIGASI ─── */
  const handleNavigation = useCallback((targetSlug: string | null) => {
    if (!targetSlug || targetSlug === 'null') return;
    const cleanSlug = targetSlug.replace(/^\/+|\/+$/g, '').split('/').pop();
    if (cleanSlug) {
      // 1. Kosongkan data langsung biar layarnya otomatis jadi Spinner Loading
      // Ini menghancurkan tombol sebelumnya, jadi user ga bisa nge-spam klik berkali-kali!
      setData(null);
      setLoading(true);
      
      // 2. Paksa scroll window balik ke titik paling atas
      // Ini ngebunuh fitur Next.js yang suka nge-restore scroll lama di chapter yang udh dibaca
      window.scrollTo(0, 0);
      
      // 3. Baru suruh Next.js pindah route
      router.push(`/read/${cleanSlug}`);
    }
  }, [router]);

  const nextPage = useCallback(() => {
    if (!data) return;
    if (page < data.images.length - 1) {
      setPage(p => p + 1);
    } else if (data.next_chapter) {
      handleNavigation(data.next_chapter);
    }
  }, [data, page, handleNavigation]);

  const prevPage = useCallback(() => {
    if (!data) return;
    if (page > 0) {
      setPage(p => p - 1);
    } else if (data.prev_chapter) {
      handleNavigation(data.prev_chapter);
    }
  }, [data, page, handleNavigation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === ' ') nextPage();
      if (e.key === 'ArrowLeft' || e.key === 'a') prevPage();
      if (e.key === 'Escape') {
        setShowSettings(false); setShowChapterList(false); setShowComments(false); setZoomedImage(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextPage, prevPage]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || touchY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (mode === 'horizontal' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? nextPage() : prevPage();
    }
    touchX.current = null; touchY.current = null;
  };

  const onImageError = (index: number) => setBrokenImages(prev => new Set(prev).add(index));

  /* Comment Actions */
  const uploadToImgBB = async (file: File) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '0e53ba0934dfb307272937939c2c4ac1';
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: formData });
      const d = await res.json();
      if (d.success) setCommentImage(d.data.url);
      else alert('Gagal upload gambar.');
    } catch { alert('Error upload.'); }
    finally { setIsUploadingImage(false); }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!commentText.trim() && !commentImage) || isUploadingImage) return;
    try {
      if (editCommentId) {
        await updateDoc(doc(db, 'comments', editCommentId), {
          text: commentText.trim(), imageUrl: commentImage || null, updatedAt: serverTimestamp()
        });
        setEditCommentId(null);
      } else {
        await addDoc(collection(db, 'comments'), {
          slug, userId: user.uid, userName: user.displayName || 'Pengguna', userPhoto: user.photoURL || '',
          text: commentText.trim(), imageUrl: commentImage || null,
          parentId: replyTo?.id || null, createdAt: serverTimestamp(), updatedAt: null,
        });
      }
      setCommentText(''); setCommentImage(null); setReplyTo(null);
    } catch (err) { console.error(err); }
  };

  const handleReply = (c: Comment) => {
    setReplyTo(c); setEditCommentId(null); setCommentText(''); setCommentImage(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleEdit = (c: Comment) => {
    setEditCommentId(c.id); setCommentText(c.text); setCommentImage(c.imageUrl || null); setReplyTo(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
      const replies = comments.filter(c => c.parentId === id);
      for (const r of replies) await deleteDoc(doc(db, 'comments', r.id));
      if (editCommentId === id) { setEditCommentId(null); setCommentText(''); setCommentImage(null); }
    } catch (err) { console.error(err); }
  };

  /* Renderers */
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
        <div className="relative w-10 h-10">
          <div className={`absolute inset-0 rounded-full border-2 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} animate-spin`} />
        </div>
        <p className="text-sm text-gray-500 font-medium tracking-wide">Memuat chapter...</p>
      </div>
    );
  }

  if (!data || data.images.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-5 px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-gray-600" />
        </div>
        <div className="text-center">
          <p className="text-gray-300 font-medium mb-1">Gagal memuat chapter</p>
          <p className="text-sm text-gray-600">Data tidak tersedia atau terjadi kesalahan.</p>
        </div>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white select-none overflow-x-hidden antialiased">
      
      {/* ─── Tap Zones (Horizontal only) ─── */}
      {mode === 'horizontal' && (
        <>
          <div className="fixed inset-y-0 left-0 w-[25%] z-30 cursor-w-resize" onClick={prevPage} />
          <div className="fixed inset-y-0 left-[25%] right-[25%] z-30" onClick={() => setShowUI(v => !v)} />
          <div className="fixed inset-y-0 right-0 w-[25%] z-30 cursor-e-resize" onClick={nextPage} />
        </>
      )}

      {/* ─── Header ─── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'}`}>
        <div className="bg-gradient-to-b from-black/80 via-black/50 to-transparent pt-4 pb-8 px-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95">
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex-1 min-w-0 text-center px-2">
              <h1 className="text-sm font-bold text-white/90 truncate tracking-tight">{data.series_title}</h1>
              <p className={`text-xs font-medium mt-0.5 ${accentStyle.text}`}>Bab {data.chapter_number}</p>
            </div>
            <button onClick={() => { setShowChapterList(true); setShowUI(false); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95" title="Daftar Chapter">
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            <button onClick={() => router.push('/')} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95" title="Beranda">
              <Home className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main 
        ref={mainRef}
        className={mode === 'vertical' ? 'flex flex-col items-center w-full pt-20 pb-8' : 'relative flex items-center justify-center h-screen w-screen overflow-hidden bg-black'} 
        onTouchStart={onTouchStart} 
        onTouchEnd={onTouchEnd}
      >
        {mode === 'horizontal' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {!brokenImages.has(page) ? (
              <img
                key={page}
                src={fixUrl(data.images[page]?.url)}
                alt={`Halaman ${page + 1}`}
                className={`${fit === 'height' ? 'h-screen w-auto max-w-none' : fit === 'width' ? 'w-full h-auto' : 'max-w-full max-h-screen'} object-contain transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
                referrerPolicy="no-referrer"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => onImageError(page)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/30">
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm font-medium">Halaman {page + 1} — Gagal dimuat</span>
              </div>
            )}
            
            {!showUI && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono text-gray-400">
                {page + 1} <span className="text-gray-600">/</span> {data.images.length}
              </div>
            )}
          </div>
        ) : (
          <>
            {data.images.map((img, i) => (
              brokenImages.has(i) ? (
                <div key={i} className="w-full h-64 flex flex-col items-center justify-center text-white/20 text-sm border-y border-white/[0.03] gap-2">
                  <ImageIcon className="w-6 h-6" />
                  <span>Halaman {i + 1} — Gagal dimuat</span>
                </div>
              ) : (
                <img
                  key={i}
                  src={fixUrl(img.url)}
                  alt={img.alt || `Halaman ${i + 1}`}
                  onClick={() => setShowUI(v => !v)}
                  className={`${fit === 'width' ? 'w-full' : 'max-w-full'} h-auto bg-[#080808] block select-none cursor-pointer`}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  decoding="async"
                  draggable={false}
                  onError={() => onImageError(i)}
                />
              )
            ))}

            {/* Bottom Actions (Vertical only) */}
            <div className="relative z-20 w-full max-w-2xl mx-auto px-5 mt-12 space-y-8 pb-12">
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(data.prev_chapter);
                  }}
                  disabled={!data.prev_chapter}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-gray-300 border border-white/[0.04] transition-all active:scale-[0.98]"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(data.next_chapter);
                  }}
                  disabled={!data.next_chapter}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-gray-300 border border-white/[0.04] transition-all active:scale-[0.98]"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Report */}
              <button onClick={() => alert('Fitur laporan sedang dalam pengembangan!')} className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl text-sm text-gray-500 border border-white/[0.03] transition-colors">
                <AlertTriangle className="w-4 h-4" /> Laporkan Bab
              </button>

              {/* Rules */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-200">Aturan Komunitas</h3>
                </div>
                <ul className="space-y-2.5 text-xs text-gray-400">
                  <li className="flex gap-2.5 items-start"><span className="text-red-400 font-medium shrink-0">Dilarang</span> toxic, rasis, atau menimbulkan kerusuhan.</li>
                  <li className="flex gap-2.5 items-start"><span className="text-red-400 font-medium shrink-0">Dilarang</span> foto profil atau konten tidak senonoh.</li>
                </ul>
              </div>

              {/* Comments Section */}
              <div className="border-t border-white/[0.04] pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <h2 className="font-bold text-lg text-gray-100">Komentar</h2>
                  <span className={`text-xs ${accentStyle.soft} ${accentStyle.text} px-2 py-0.5 rounded-full font-semibold`}>{comments.length}</span>
                </div>
                
                {/* Comment Input */}
                {!user ? (
                  <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                    <p className="text-sm text-gray-500">
                      <button onClick={() => router.push('/profile')} className={`${accentStyle.text} font-semibold hover:underline`}>Log masuk</button> untuk berkomentar.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitComment} className="space-y-3 mb-8">
                    {(replyTo || editCommentId) && (
                      <div className={`flex items-center justify-between ${accentStyle.soft} ${accentStyle.border} border px-3 py-2 rounded-xl`}>
                        <span className={`text-xs ${accentStyle.text} font-medium`}>
                          {editCommentId ? 'Mengedit komentar' : `Membalas ${replyTo?.userName}`}
                        </span>
                        <button type="button" onClick={() => { setReplyTo(null); setEditCommentId(null); setCommentText(''); setCommentImage(null); }} className="text-xs text-gray-500 hover:text-gray-300">Batal</button>
                      </div>
                    )}
                    {commentImage && (
                      <div className="relative self-start w-fit">
                        <img src={commentImage} className="h-16 w-16 object-cover rounded-xl border border-white/10" alt="Preview" />
                        <button type="button" onClick={() => setCommentImage(null)} className="absolute -top-1.5 -right-1.5 bg-gray-800 border border-white/10 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2.5 items-end">
                      <img src={user.photoURL || '/no-avatar.png'} alt="Me" className="w-9 h-9 rounded-full bg-gray-800 object-cover shrink-0 ring-1 ring-white/5" />
                      <div className="flex-1 relative bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-end min-h-[48px] overflow-hidden focus-within:border-white/10 transition-colors">
                        <input type="file" id="imgUpload" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && uploadToImgBB(e.target.files[0])} />
                        <label htmlFor="imgUpload" className={`p-3 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors shrink-0`}>
                          <ImageIcon className="w-5 h-5" />
                        </label>
                        <textarea
                          ref={commentInputRef}
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder={editCommentId ? 'Edit komentar...' : replyTo ? 'Ketik balasan...' : 'Tambah komentar...'}
                          rows={1}
                          className="flex-1 bg-transparent py-3 pl-1 pr-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none max-h-32"
                          onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                        />
                        <button 
                          type="submit" 
                          disabled={(!commentText.trim() && !commentImage) || isUploadingImage}
                          className={`p-2.5 m-1.5 ${accentStyle.bg} hover:brightness-110 text-white rounded-xl transition-all disabled:opacity-40 disabled:bg-gray-800 active:scale-95 shrink-0`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                {parentComments.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-gray-600 gap-3">
                    <MessageCircle className="w-10 h-10 opacity-50" />
                    <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {parentComments.map(c => (
                      <CommentNode 
                        key={c.id} 
                        comment={c} 
                        user={user} 
                        accentStyle={accentStyle} 
                        accent={accent}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteConfirmId(id)}
                        allComments={comments}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── Horizontal Slider ─── */}
      {showUI && mode === 'horizontal' && (
        <div className="fixed bottom-[72px] left-4 right-4 z-40">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/[0.06] shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono w-8 text-right">{page + 1}</span>
              <input
                type="range"
                min={0}
                max={data.images.length - 1}
                value={page}
                onChange={e => setPage(Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white/40"
                style={{ accentColor: 'rgba(255,255,255,0.4)' }}
              />
              <span className="text-xs text-gray-500 font-mono w-8">{data.images.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-500 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
        <div className="h-[2px] bg-white/5">
          <div className={`h-full ${accentStyle.bg} transition-all duration-300 ease-out`} style={{ width: `${progress}%` }} />
        </div>
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-4 pb-5 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNavigation(data.prev_chapter);
              }}
              disabled={!data.prev_chapter}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-400 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>
            
            <div className="flex items-center gap-1">
              <button onClick={() => { setShowComments(true); setShowUI(false); }} className="p-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 relative active:scale-95">
                <MessageCircle className="w-5 h-5" />
                {comments.length > 0 && <span className={`absolute top-2 right-2 w-2 h-2 ${accentStyle.bg} rounded-full ring-2 ring-black`} />}
              </button>
              <button onClick={() => { setShowSettings(true); setShowUI(false); }} className="p-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 active:scale-95">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleNavigation(data.next_chapter);
              }}
              disabled={!data.next_chapter}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-400 active:scale-95"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* ─── Chapter List Drawer ─── */}
      {showChapterList && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowChapterList(false)} />
          <div className="relative bg-[#0a0a0a] rounded-t-3xl h-[85dvh] flex flex-col shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={() => setShowChapterList(false)}>
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>
            <div className="px-6 pb-4 border-b border-white/[0.04] flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-gray-100 tracking-tight">Daftar Chapter</h3>
                <p className="text-xs text-gray-600 mt-0.5">{data.chapters.length} chapter</p>
              </div>
              <button onClick={() => setShowChapterList(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  placeholder="Cari chapter..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {filteredChapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-2">
                  <BookOpen className="w-8 h-8 opacity-50" />
                  <p className="text-sm">Chapter tidak ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {filteredChapters.map((ch, idx) => {
                    const isCurrent = ch.slug === slug;
                    const num = ch.number.replace(/^Chapter\s+/i, '');
                    return (
                      <button
                        key={`${ch.slug}-${idx}`}
                        ref={isCurrent ? currentChapterBtnRef : null}
                        onClick={() => { handleNavigation(ch.slug); setShowChapterList(false); }}
                        className={`relative px-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 text-center ${
                          isCurrent
                            ? `${accentStyle.bg} text-white shadow-lg shadow-black/40 ring-1 ring-white/10`
                            : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border border-white/[0.04]'
                        }`}
                      >
                        {num}
                        {isCurrent && <div className="absolute inset-x-0 -bottom-1 mx-auto w-1 h-1 rounded-full bg-white/80" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Comments Drawer (Horizontal Mode) ─── */}
      {showComments && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowComments(false)} />
          <div className="relative bg-[#0a0a0a] rounded-t-3xl h-[85dvh] flex flex-col shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={() => setShowComments(false)}>
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>
            <div className="px-6 pb-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-base text-gray-100">Komentar</h3>
                <span className={`text-xs ${accentStyle.soft} ${accentStyle.text} px-2 py-0.5 rounded-full font-medium`}>{comments.length}</span>
              </div>
              <button onClick={() => setShowComments(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!user ? (
                <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] mt-4">
                  <p className="text-sm text-gray-500">
                    <button onClick={() => router.push('/profile')} className={`${accentStyle.text} font-semibold hover:underline`}>Log masuk</button> untuk berkomentar.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitComment} className="space-y-3 mb-6 sticky top-0 bg-[#0a0a0a] pt-2 pb-4 z-10">
                  {(replyTo || editCommentId) && (
                    <div className={`flex items-center justify-between ${accentStyle.soft} ${accentStyle.border} border px-3 py-2 rounded-xl`}>
                      <span className={`text-xs ${accentStyle.text} font-medium`}>
                        {editCommentId ? 'Mengedit komentar' : `Membalas ${replyTo?.userName}`}
                      </span>
                      <button type="button" onClick={() => { setReplyTo(null); setEditCommentId(null); setCommentText(''); setCommentImage(null); }} className="text-xs text-gray-500 hover:text-gray-300">Batal</button>
                    </div>
                  )}
                  {commentImage && (
                    <div className="relative self-start w-fit">
                      <img src={commentImage} className="h-14 w-14 object-cover rounded-lg border border-white/10" alt="Preview" />
                      <button type="button" onClick={() => setCommentImage(null)} className="absolute -top-1.5 -right-1.5 bg-gray-800 border border-white/10 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2.5 items-end">
                    <img src={user.photoURL || '/no-avatar.png'} alt="Me" className="w-8 h-8 rounded-full bg-gray-800 object-cover shrink-0" />
                    <div className="flex-1 relative bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-end min-h-[40px] overflow-hidden focus-within:border-white/10 transition-colors">
                      <input type="file" id="imgUpload2" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && uploadToImgBB(e.target.files[0])} />
                      <label htmlFor="imgUpload2" className="p-2.5 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </label>
                      <textarea
                        ref={commentInputRef}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder={editCommentId ? 'Edit...' : replyTo ? 'Balasan...' : 'Komentar...'}
                        rows={1}
                        className="flex-1 bg-transparent py-2.5 pl-1 pr-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none max-h-24"
                        onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                      />
                      <button type="submit" disabled={(!commentText.trim() && !commentImage) || isUploadingImage} className={`p-2 m-1 ${accentStyle.bg} hover:brightness-110 text-white rounded-lg transition-all disabled:opacity-40 disabled:bg-gray-800 active:scale-95 shrink-0`}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              <div className="space-y-1">
                {parentComments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-gray-600 gap-2">
                    <MessageCircle className="w-8 h-8 opacity-40" />
                    <p className="text-sm">Belum ada komentar.</p>
                  </div>
                ) : (
                  parentComments.map(c => (
                    <CommentNode 
                      key={c.id} 
                      comment={c} 
                      user={user} 
                      accentStyle={accentStyle} 
                      accent={accent}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteConfirmId(id)}
                      allComments={comments}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Panel ─── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-[#0a0a0a] rounded-t-3xl p-6 space-y-8 shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center -mt-2 cursor-pointer" onClick={() => setShowSettings(false)}>
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-100 tracking-tight">Pengaturan</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-bold mb-3 block">Arah Baca</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['vertical', 'horizontal'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all border ${mode === m ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}` : 'bg-white/[0.03] text-gray-500 border-transparent hover:bg-white/[0.05]'}`}>
                      {m === 'vertical' ? 'Vertikal' : 'Horizontal'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-bold mb-3 block">Penyesuaian Gambar</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['height', 'width', 'original'] as const).map(f => (
                    <button key={f} onClick={() => setFit(f)} className={`px-3 py-3.5 rounded-xl text-sm font-semibold transition-all border ${fit === f ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}` : 'bg-white/[0.03] text-gray-500 border-transparent hover:bg-white/[0.05]'}`}>
                      {f === 'height' ? 'Tinggi' : f === 'width' ? 'Lebar' : 'Asli'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-2 pb-1">
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[11px] text-gray-600 text-center">
                  <span className="text-gray-400 font-medium">Tip:</span> Gunakan <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400 text-[10px] border border-white/5">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400 text-[10px] border border-white/5">→</kbd> untuk navigasi halaman.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Zoomed Image ─── */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setZoomedImage(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
          <div className="relative max-w-5xl max-h-[90vh] w-full flex justify-center">
            <button onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }} className="absolute -top-14 right-0 p-2.5 bg-white/5 hover:bg-red-500/80 rounded-full text-white border border-white/10 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ─── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-[#111] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Hapus Komentar?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Tindakan ini tidak dapat dibatalkan. Balasan terkait juga akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors">Batal</button>
              <button onClick={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
