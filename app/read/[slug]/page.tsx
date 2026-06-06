'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getRead, getDetail } from '@/lib/api';
import { useAccent } from '@/lib/accent'; // 👈 IMPORT HOOK ACCENT

// ─── IMPORT FIREBASE ───
import { auth, db } from '@/lib/firebase';
import { 
  doc, setDoc, collection, addDoc, query, where, orderBy, 
  onSnapshot, updateDoc, serverTimestamp, Timestamp, deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { X } from 'lucide-react';

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
  chapter_number: string;
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

export default function ReadPage() {
  const { accent, style: accentStyle } = useAccent(); 

  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ReadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [fit, setFit] = useState<'height' | 'width' | 'original'>('height');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [brokenImages, setBrokenImages] = useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentContainerRef = useRef<HTMLDivElement>(null);

  // ── STATE FIREBASE & KOMENTAR ──
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; userName: string; userId: string } | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null); 

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const totalScroll = docHeight - winHeight;
    
    if (totalScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (currentScrollY / totalScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!slug) return;
    getRead(slug).then((res: any) => {
      if (res?.success && res.data) {
        const rawTitle = res.data.series_title || res.data.title || 'Untitled';
        const cleanTitle = rawTitle.replace(/\s+Chapter\s+\d+$/i, '').trim();
        setData({ ...res.data, title: cleanTitle });
        setPage(0);
        setBrokenImages([]);
      }
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user || !data || !data.series_slug) return;
    const saveHistory = async () => {
      try {
        let thumbUrl = "";
        try {
          const detailRes = await getDetail(data.series_slug);
          if (detailRes?.success && detailRes.data?.thumb) {
            thumbUrl = detailRes.data.thumb;
            if (thumbUrl.includes("<")) {
              const match = thumbUrl.match(/src=["']([^"']+)["']/i);
              if (match) thumbUrl = match[1];
            }
          }
        } catch (detailErr) {
          console.error('Gagal mengambil sampul:', detailErr);
        }

        const docRef = doc(db, 'users', user.uid, 'history', data.series_slug);
        const payload: any = {
          id: data.series_slug,
          slug: data.series_slug,
          title: data.title,
          lastReadChapter: `Ch. ${data.chapter_number}`,
          savedAt: Date.now(),
        };
        if (thumbUrl) payload.thumb = thumbUrl;
        
        await setDoc(docRef, payload, { merge: true });
      } catch (err) {
        console.error('Gagal menyimpan riwayat:', err);
      }
    };
    saveHistory();
  }, [user, data]);

  useEffect(() => {
    if (!slug) return;
    const q = query(collection(db, 'comments'), where('slug', '==', slug), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [slug]);

  const uploadToImgBB = async (file: File) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "0e53ba0934dfb307272937939c2c4ac1"; 
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if(data.success) {
        setCommentImage(data.data.url);
      } else {
        alert("Gagal upload gambar. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error uploading image to ImgBB:", error);
      alert("Error saat upload gambar.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadToImgBB(e.target.files[0]);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!commentText.trim() && !commentImage) || isUploadingImage) return;

    try {
      if (editCommentId) {
        const commentRef = doc(db, 'comments', editCommentId);
        await updateDoc(commentRef, {
          text: commentText.trim(),
          imageUrl: commentImage || null,
          updatedAt: serverTimestamp()
        });
        setEditCommentId(null);
      } else {
        await addDoc(collection(db, 'comments'), {
          slug,
          userId: user.uid,
          userName: user.displayName || 'Pengguna',
          userPhoto: user.photoURL || '',
          text: commentText.trim(),
          imageUrl: commentImage || null,
          parentId: replyTo ? replyTo.id : null,
          createdAt: serverTimestamp(),
          updatedAt: null,
        });

        if (replyTo && replyTo.userId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: replyTo.userId, 
            triggerUserId: user.uid,
            triggerUserName: user.displayName || 'Pengguna',
            triggerUserPhoto: user.photoURL || '',
            type: 'reply',
            slug: slug,
            chapter: data?.chapter_number || '',
            message: `membalas komentar Anda: "${commentText.trim().slice(0, 30)}..."`,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
        setReplyTo(null);
      }
      setCommentText('');
      setCommentImage(null);
      setActiveCommentId(null);
    } catch (err) {
      console.error('Gagal mengirim komentar:', err);
    }
  };

  const handleActionReply = (e: React.MouseEvent, parentId: string, userName: string, userId: string) => {
    e.stopPropagation();
    setReplyTo({ id: parentId, userName, userId });
    setEditCommentId(null);
    setCommentText('');
    setCommentImage(null);
    setActiveCommentId(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleActionEdit = (e: React.MouseEvent, id: string, text: string, imgUrl?: string | null) => {
    e.stopPropagation();
    setEditCommentId(id);
    setCommentText(text);
    setCommentImage(imgUrl || null);
    setReplyTo(null);
    setActiveCommentId(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleActionDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
    setActiveCommentId(null);
  };

  const executeDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      const repliesToDelete = comments.filter(c => c.parentId === commentId);
      for (const reply of repliesToDelete) {
        await deleteDoc(doc(db, 'comments', reply.id));
      }
      if (editCommentId === commentId) {
        setEditCommentId(null);
        setCommentText('');
        setCommentImage(null);
      }
    } catch (err) {
      console.error('Gagal menghapus komentar:', err);
    }
  };

  const checkIsEditable = (createdAt: Timestamp | null) => {
    if (!createdAt) return false;
    const now = Date.now();
    const timePassed = now - createdAt.toMillis();
    return timePassed <= 15 * 60 * 1000;
  };

  const nextPage = useCallback(() => {
    if (!data) return;
    if (page < data.images.length - 1) setPage((p) => p + 1);
    else if (data.next_chapter) router.push(`/read/${data.next_chapter}`);
  }, [data, page, router]);

  const prevPage = useCallback(() => {
    if (!data) return;
    if (page > 0) setPage((p) => p - 1);
    else if (data.prev_chapter) router.push(`/read/${data.prev_chapter}`);
  }, [data, page, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') nextPage();
      if (e.key === 'ArrowLeft' || e.key === 'a') prevPage();
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowChapterList(false);
        setShowComments(false);
        setZoomedImage(null);
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
    const diffX = e.changedTouches[0].clientX - touchX.current;
    const diffY = e.changedTouches[0].clientY - touchY.current;
    
    if (mode === 'horizontal' && Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      diffX < 0 ? nextPage() : prevPage();
    }
    
    if ((showChapterList || showComments) && diffY > 100 && Math.abs(diffY) > Math.abs(diffX)) {
      setShowChapterList(false);
      setShowComments(false);
    }
    
    touchX.current = null;
    touchY.current = null;
  };

  const fixUrl = (url: string) => url.replace(/^http:\/\//i, 'https://');
  const onImageError = (index: number) => setBrokenImages((prev) => prev.includes(index) ? prev : [...prev, index]);
  const isBroken = (index: number) => brokenImages.includes(index);

  const renderCommentSection = () => {
    const parentComments = comments.filter(c => !c.parentId);
    return (
      <div 
        className="w-full max-w-2xl mx-auto flex flex-col h-full bg-gray-950/40 relative" 
        onClick={() => setActiveCommentId(null)}
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
            Komentar 
            <span className={`text-xs ${accentStyle.soft} ${accentStyle.text} px-2 py-0.5 rounded-full font-medium`}>
              {comments.length}
            </span>
          </h3>
        </div>

        <div className="p-4 bg-gray-950 border-b border-white/5 flex flex-col w-full shrink-0 z-30 shadow-md" onClick={(e) => e.stopPropagation()}>
          {!user ? (
            <div className="w-full text-center p-3 bg-gray-900 rounded-2xl border border-white/5">
              <p className="text-sm text-gray-400">
                Silakan <button onClick={() => router.push('/login')} className={`${accentStyle.text} font-bold hover:brightness-125 transition-colors`}>Log Masuk</button> untuk komen.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment} className="flex flex-col w-full gap-2">
              
              {(replyTo || editCommentId) && (
                <div className={`flex items-center justify-between ${accentStyle.soft} ${accentStyle.border} border px-3 py-1.5 rounded-lg mb-0.5`}>
                  <span className={`text-xs ${accentStyle.text} font-medium`}>
                    {editCommentId ? 'Mengedit komentar...' : `Membalas @${replyTo?.userName}`}
                  </span>
                  <button type="button" onClick={() => { setReplyTo(null); setEditCommentId(null); setCommentText(''); setCommentImage(null); }} className="text-xs text-gray-400 hover:text-gray-200 p-1 transition-colors">
                    Batal
                  </button>
                </div>
              )}

              {commentImage && (
                <div className="relative self-start mb-1 animate-in fade-in zoom-in-95 duration-200">
                  <img src={commentImage} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-white/10" />
                  <button 
                    type="button"
                    onClick={() => setCommentImage(null)}
                    className="absolute -top-2 -right-2 bg-gray-800 border border-white/10 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isUploadingImage && (
                <div className={`text-xs ${accentStyle.text} mb-1 ml-1 animate-pulse`}>Mengupload gambar...</div>
              )}
              
              <div className="flex gap-2 items-end">
                <img src={user.photoURL || '/no-avatar.png'} alt="Profile" className="w-10 h-10 rounded-full bg-gray-800 object-cover shrink-0 border border-gray-800 mb-0.5" />
                
                <div className="flex-1 relative bg-gray-900 border border-white/10 rounded-3xl flex items-center min-h-[44px] overflow-hidden pr-2">
                  
                  <input 
                    type="file" 
                    id="imgUpload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <label 
                    htmlFor="imgUpload" 
                    className={`pl-3 pr-2 py-3 text-gray-500 ${accent === "custom" ? "hover:text-[var(--tsuki-custom-hex)]" : accentStyle.text.replace("text-", "hover:text-")} cursor-pointer transition-colors shrink-0`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>

                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={editCommentId ? "Edit komentar..." : replyTo ? `Ketik balasan...` : "Tambah komentar..."}
                    rows={Math.min(3, commentText.split('\n').length || 1)}
                    className="flex-1 bg-transparent py-3 pl-1 pr-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none scrollbar-hide"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={(!commentText.trim() && !commentImage) || isUploadingImage} 
                  className={`w-11 h-11 ${accentStyle.bg} hover:brightness-110 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-all active:scale-95 mb-0.5`}
                >
                  <svg className="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {parentComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-60" onClick={(e) => e.stopPropagation()}>
              <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <p className="text-gray-400 text-sm font-medium">Belum ada komentar.</p>
              <p className="text-gray-500 text-xs mt-1">Jadilah yang pertama memberikan pendapat Anda.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {parentComments.map(parent => (
                <div key={parent.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div 
                    className={`flex gap-3.5 p-3 -mx-3 rounded-2xl transition-colors cursor-pointer ${activeCommentId === parent.id ? 'bg-gray-900 border border-white/5' : 'hover:bg-gray-900/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCommentId(activeCommentId === parent.id ? null : parent.id);
                    }}
                  >
                    <div className="relative shrink-0">
                      <img src={parent.userPhoto || '/no-avatar.png'} alt={parent.userName} className="w-9 h-9 rounded-full bg-gray-800 object-cover ring-2 ring-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-200 truncate">{parent.userName}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {parent.createdAt?.toDate().toLocaleDateString('id-ID')} 
                          {parent.updatedAt && ' (diedit)'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed break-words">{parent.text}</p>
                      
                      {parent.imageUrl && (
                        <div className="mt-2.5">
                          <img 
                            src={parent.imageUrl} 
                            alt="Attached" 
                            className="max-w-[200px] max-h-[250px] object-cover rounded-xl border border-white/10 hover:opacity-80 transition-opacity cursor-zoom-in" 
                            loading="lazy" 
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(parent.imageUrl!); }}
                          />
                        </div>
                      )}
                      
                      {activeCommentId === parent.id && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 animate-in fade-in duration-200">
                          {user && (
                            <button onClick={(e) => handleActionReply(e, parent.id, parent.userName, parent.userId)} className={`text-xs ${accentStyle.text} hover:brightness-125 font-medium flex items-center gap-1 transition-colors`}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Balas
                            </button>
                          )}
                          {user?.uid === parent.userId && (
                            <>
                              {checkIsEditable(parent.createdAt) && (
                                <button onClick={(e) => handleActionEdit(e, parent.id, parent.text, parent.imageUrl)} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit
                                </button>
                              )}
                              <button onClick={(e) => handleActionDeleteClick(e, parent.id)} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Hapus
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 pl-4 border-l-2 border-white/5 mt-1 space-y-2">
                    {comments.filter(c => c.parentId === parent.id).map(reply => (
                      <div 
                        key={reply.id} 
                        className={`flex gap-3 p-2 -mx-2 rounded-2xl transition-colors cursor-pointer ${activeCommentId === reply.id ? 'bg-gray-900 border border-white/5' : 'hover:bg-gray-900/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCommentId(activeCommentId === reply.id ? null : reply.id);
                        }}
                      >
                        <img src={reply.userPhoto || '/no-avatar.png'} alt={reply.userName} className="w-7 h-7 rounded-full bg-gray-800 shrink-0 object-cover ring-2 ring-gray-900" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-xs text-gray-200 truncate">{reply.userName}</span>
                            <span className="text-[10px] text-gray-500 shrink-0">{reply.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-[13px] text-gray-400 leading-relaxed break-words">{reply.text}</p>
                          
                          {reply.imageUrl && (
                            <div className="mt-2.5">
                              <img 
                                src={reply.imageUrl} 
                                alt="Attached" 
                                className="max-w-[150px] max-h-[150px] object-cover rounded-xl border border-white/10 hover:opacity-80 transition-opacity cursor-zoom-in" 
                                loading="lazy"
                                onClick={(e) => { e.stopPropagation(); setZoomedImage(reply.imageUrl!); }}
                              />
                            </div>
                          )}
                          
                          {activeCommentId === reply.id && (
                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5 animate-in fade-in duration-200">
                              {user && (
                                <button onClick={(e) => handleActionReply(e, parent.id, reply.userName, reply.userId)} className={`text-[11px] ${accentStyle.text} hover:brightness-125 font-medium flex items-center gap-1 transition-colors`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> Balas
                                </button>
                              )}
                              {user?.uid === reply.userId && (
                                <>
                                  {checkIsEditable(reply.createdAt) && (
                                    <button onClick={(e) => handleActionEdit(e, reply.id, reply.text, reply.imageUrl)} className="text-[11px] text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit
                                    </button>
                                  )}
                                  <button onClick={(e) => handleActionDeleteClick(e, reply.id)} className="text-[11px] text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white gap-3">
        <span className={`w-8 h-8 border-2 border-white/10 ${accent === 'custom' ? 'border-t-[var(--tsuki-custom-hex)]' : accentStyle.border.replace('border-', 'border-t-')} rounded-full animate-spin`} />
        <span className="text-sm text-gray-400 font-medium">Memuat data pembaca...</span>
      </div>
    );
  }

  if (!data || data.images.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-gray-400 font-medium">Gagal memuat data pembaca.</p>
        <button onClick={() => router.back()} className="px-5 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          Kembali
        </button>
      </div>
    );
  }

  const progress = mode === 'vertical' 
    ? scrollProgress 
    : (data.images.length ? ((page + 1) / data.images.length) * 100 : 0);

  return (
    <div className="relative min-h-screen bg-black text-white select-none overflow-x-hidden">
      <div className="fixed inset-0 z-10" onClick={() => setShowUI(!showUI)} />

      <header className={`fixed top-4 left-4 right-4 z-40 flex justify-center transition-all duration-300 transform-gpu ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-gray-950/95 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-white/5 w-full max-w-md">
          <button onClick={(e) => { e.stopPropagation(); router.push(`/detail/${data.series_slug}`); }} className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors shrink-0">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-sm font-bold text-gray-100 truncate">{data.title}</h1>
            <p className={`text-[11px] ${accentStyle.text} font-medium mt-0.5`}>Bab {data.chapter_number}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); router.push('/'); }} className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors shrink-0">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </button>
        </div>
      </header>

      <main 
        className={mode === 'vertical' ? 'flex flex-col items-center w-full pt-20 pb-10' : 'flex items-center justify-center h-screen w-screen'}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {mode === 'horizontal' ? (
          !isBroken(page) ? (
            <img 
              src={fixUrl(data.images[page]?.url)} 
              alt={`Halaman ${page + 1}`} 
              className={`${fit === 'height' ? 'h-screen w-auto max-w-none' : fit === 'width' ? 'w-full h-auto' : 'max-w-full max-h-screen'} object-contain`} 
              draggable={false} 
              referrerPolicy="no-referrer"
              decoding="async"
              onError={() => onImageError(page)} 
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40"><span className="text-sm">Gambar tidak tersedia</span></div>
          )
        ) : (
          <>
            {data.images.map((img, i) => (
              isBroken(i) ? (
                <div key={i} className="w-full h-64 flex items-center justify-center text-white/30 text-sm border-y border-white/5">Halaman {i + 1} — Gagal dimuat</div>
              ) : (
                <img 
                  key={i} 
                  src={fixUrl(img.url)} 
                  alt={img.alt || `Halaman ${i + 1}`} 
                  className={`${fit === 'width' ? 'w-full' : 'max-w-full'} h-auto min-h-[70vh] bg-gray-950/20 block select-none`} 
                  loading={i < 2 ? 'eager' : 'lazy'} 
                  referrerPolicy="no-referrer"
                  decoding="async"
                  draggable={false} 
                  onError={() => onImageError(i)} 
                />
              )
            ))}
            
            <div className="w-full max-w-2xl mx-auto px-4 mt-10 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); data.prev_chapter && router.push(`/read/${data.prev_chapter}`); }}
                  disabled={!data.prev_chapter}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-900/80 hover:bg-gray-800 rounded-xl text-sm font-semibold text-gray-300 disabled:opacity-30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Sebelumnya
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); data.next_chapter && router.push(`/read/${data.next_chapter}`); }}
                  disabled={!data.next_chapter}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-900/80 hover:bg-gray-800 rounded-xl text-sm font-semibold text-gray-300 disabled:opacity-30 transition-colors"
                >
                  Selanjutnya
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900/80 hover:bg-gray-800 rounded-xl text-sm font-semibold text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                Laporkan Bab
              </button>

              <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <h3 className="font-bold text-base text-gray-100">Rules Komentar Web TsukiNime</h3>
                </div>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex gap-3 items-start">
                    <span className="shrink-0 text-base">🚫</span>
                    <p className="leading-relaxed">
                      <span className="text-red-400 font-medium">Dilarang Toxic, Rasis, atau menimbulkan kerusuhan!</span><br/>
                      Yang ikut kerusuhan bakal <span className="text-red-400 font-medium">kena ban juga!</span> Jadi diemin aja, cukup <span className="text-red-400 font-medium">laporin ke admin!</span>
                    </p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="shrink-0 text-base">🙈</span>
                    <p className="leading-relaxed"><span className="text-red-400 font-medium">Dilarang pakai photo profil cabul!</span></p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="shrink-0 text-base">🔞</span>
                    <p className="leading-relaxed"><span className="text-red-400 font-medium">Dilarang mengirim photo atau gif cabul/tidak senonoh!</span></p>
                  </li>
                </ul>
              </div>
            </div>

            <div ref={commentContainerRef} className="w-full mt-10 bg-black border-t border-white/5 relative h-[650px] z-20">
              {renderCommentSection()}
            </div>
          </>
        )}
      </main>

      {!showUI && mode === 'horizontal' && (
        <div className="fixed bottom-20 right-4 z-30 bg-black/60 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">{page + 1} / {data.images.length}</div>
      )}

      <footer className={`fixed bottom-0 inset-x-0 z-40 transition-all duration-300 transform-gpu ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="w-full h-0.5 bg-white/5">
          <div className={`h-full ${accentStyle.bg} ${accentStyle.glow} transition-all duration-300`} style={{ width: `${progress}%` }} />
        </div>
        <div className="bg-gray-950/95 backdrop-blur-md px-4 py-3 border-t border-white/5">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button onClick={(e) => { e.stopPropagation(); data.prev_chapter && router.push(`/read/${data.prev_chapter}`); }} disabled={!data.prev_chapter} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-300">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg> Sebelumnya
</button>


            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setShowChapterList(true); setShowUI(false); }} className="p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowComments(true); setShowUI(false); }} className="p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-gray-300 relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                {comments.length > 0 && <span className={`absolute top-2 right-2.5 w-2 h-2 ${accentStyle.bg} rounded-full border border-gray-950`}></span>}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); setShowUI(false); }} className="p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>

            <button onClick={(e) => { e.stopPropagation(); data.next_chapter && router.push(`/read/${data.next_chapter}`); }} disabled={!data.next_chapter} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-xs font-medium text-gray-300">
              Selanjutnya <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </footer>

      {/* SISA MODAL (Comments, Zoom Image, Chapter List, Settings) TETAP SAMA KAYA DI ATAS */}
      {showComments && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowComments(false)} />
          <div className="relative bg-gray-950 rounded-t-3xl h-[85dvh] flex flex-col shadow-2xl overflow-hidden border-t border-white/10">
            <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={() => setShowComments(false)}>
              <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </div>
            <div className="flex-1 relative flex flex-col overflow-hidden">
              {renderCommentSection()}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" />
          <div className="relative max-w-4xl max-h-screen w-full flex justify-center items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }} 
              className="absolute -top-12 right-0 md:-right-12 p-2 bg-gray-900 rounded-full text-white border border-white/10 hover:bg-red-500 transition-colors shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed Comment Image" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hapus Komentar?</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Komentar ini akan dihapus permanen. Jika ada balasan di bawahnya, balasan tersebut juga akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors">Batal</button>
              <button onClick={() => { executeDeleteComment(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {showChapterList && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowChapterList(false)} />
          <div className="relative bg-gray-950 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl border-t border-white/10">
            <div className="flex justify-center pt-4 pb-1 cursor-pointer" onClick={() => setShowChapterList(false)}>
              <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </div>
            <div className="px-5 pb-4 flex items-center justify-between border-b border-white/5 mt-2">
              <h3 className="font-bold text-base text-gray-100">Daftar Bab</h3>
              <button onClick={() => setShowChapterList(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {data.chapters?.map((chapter) => (
                <button key={chapter.slug} onClick={() => { if (chapter.slug !== slug) router.push(`/read/${chapter.slug}`); setShowChapterList(false); }} className={`w-full text-left px-5 py-4 rounded-2xl text-sm transition-all flex items-center justify-between ${chapter.slug === slug ? `${accentStyle.soft} ${accentStyle.text} font-bold border ${accentStyle.border}` : 'hover:bg-gray-900 text-gray-300 font-medium border border-transparent'}`}>
                  <span>{chapter.number || `Bab ${chapter.slug}`}</span>
                  {chapter.slug === slug && <span className={`text-[10px] ${accentStyle.soft} ${accentStyle.text} px-3 py-1 rounded-full font-bold uppercase tracking-wide`}>Sedang dibaca</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-gray-950 rounded-t-3xl p-6 space-y-8 shadow-2xl border-t border-white/10">
            <div className="flex justify-center -mt-2 cursor-pointer" onClick={() => setShowSettings(false)}>
              <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-100">Pengaturan Pembaca</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-4 block">Arah Baca</label>
              <div className="grid grid-cols-2 gap-3">
                {(['vertical', 'horizontal'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`px-4 py-3.5 rounded-2xl text-sm capitalize font-semibold transition-all ${mode === m ? `${accentStyle.soft} ${accentStyle.text} border ${accentStyle.border}` : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-transparent'}`}>
                    {m === 'vertical' ? 'Vertikal' : 'Horizontal'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-4 block">Penyesuaian Gambar</label>
              <div className="grid grid-cols-3 gap-3">
                {(['height', 'width', 'original'] as const).map((f) => (
                  <button key={f} onClick={() => setFit(f)} className={`px-4 py-3.5 rounded-2xl text-sm capitalize font-semibold transition-all ${fit === f ? `${accentStyle.soft} ${accentStyle.text} border ${accentStyle.border}` : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-transparent'}`}>
                    {f === 'height' ? 'Tinggi' : f === 'width' ? 'Lebar' : 'Asli'}
                  </button>
                ))}
              </div>
            </div>
            <div className="pb-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}
