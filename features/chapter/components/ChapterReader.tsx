"use client";
// features/chapter/components/ChapterReader.tsx
// Main reader orchestrator. Composes all reader sub-components.

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, MessageCircle, Send, ImageIcon, X, AlertTriangle as ReportIcon, BookOpen } from "lucide-react";
import { useAccent } from "@/lib/accent";
import { auth, db } from "@/lib/firebase";
import {
  doc, setDoc, collection, addDoc, query, where, orderBy,
  onSnapshot, updateDoc, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { useEffect } from "react";
import { useReader } from "@/features/chapter/hooks/useReader";
import { useReadingHistory, useAuthUser } from "@/features/chapter/hooks/useReadingHistory";
import { useKeyboardControl } from "@/features/chapter/hooks/useKeyboardControl";
import { getDetail } from "@/lib/api";
import { ReaderToolbar } from "./ReaderToolbar";
import { PageViewer } from "./PageViewer";
import { ChapterNavigation } from "./ChapterNavigation";
import {
  SettingsDrawer,
  ChapterListDrawer,
  CommentsDrawer,
  DeleteConfirmDialog,
  ZoomedImage,
  CommentNode,
} from "./ReaderSettings";
import type { Comment } from "@/features/chapter/types";
import type { User as FirebaseUser } from "firebase/auth";
import { fixUrl } from "@/features/chapter/utils/reader.utils";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

export function ChapterReader() {
  const router = useRouter();
  const { style: accentStyle, accent } = useAccent();

  const reader = useReader();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  useAuthUser(useCallback((u) => setUser(u), []));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailData, setDetailData] = useState<any>(null);

  // Fetch series detail for history thumb/type
  useEffect(() => {
    if (!reader.data?.series_slug) return;
    let cancelled = false;
    getDetail(reader.data.series_slug)
      .then((res) => { if (!cancelled) setDetailData(res?.data || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [reader.data?.series_slug]);

  // Save reading history
  useReadingHistory({ chapterSlug: reader.chapterSlug, data: reader.data, detailData, user });

  // Keyboard navigation
  useKeyboardControl({
    onNext: reader.nextPage,
    onPrev: reader.prevPage,
    onEscape: () => {
      reader.setShowSettings(false);
      reader.setShowChapterList(false);
      reader.setShowComments(false);
      reader.setZoomedImage(null);
    },
  });

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!reader.chapterSlug) return;
    const q = query(
      collection(db, "comments"),
      where("slug", "==", reader.chapterSlug),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
    });
  }, [reader.chapterSlug]);

  const clearCommentImage = () => setCommentImage(null);

  const uploadToImgBB = async (file: File) => {
    if (!IMGBB_API_KEY) { alert("Konfigurasi upload gambar tidak tersedia."); return; }
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const d = await res.json();
      if (d.success) setCommentImage(d.data.url);
      else alert("Gagal upload gambar.");
    } catch { alert("Error upload."); }
    finally { setIsUploadingImage(false); }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!commentText.trim() && !commentImage) || isUploadingImage) return;
    try {
      if (editCommentId) {
        await updateDoc(doc(db, "comments", editCommentId), {
          text: commentText.trim(), imageUrl: commentImage || null, updatedAt: serverTimestamp(),
        });
        setEditCommentId(null);
      } else {
        await addDoc(collection(db, "comments"), {
          slug: reader.chapterSlug, userId: user.uid, userName: user.displayName || "Pengguna",
          userPhoto: user.photoURL || "", text: commentText.trim(),
          imageUrl: commentImage || null, parentId: replyTo?.id || null,
          createdAt: serverTimestamp(), updatedAt: null,
        });
      }
      setCommentText(""); setCommentImage(null); setReplyTo(null);
    } catch { /* silent */ }
  };

  const handleReply = (c: Comment) => {
    setReplyTo(c); setEditCommentId(null); setCommentText(""); setCommentImage(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleEdit = (c: Comment) => {
    setEditCommentId(c.id); setCommentText(c.text); setCommentImage(c.imageUrl || null); setReplyTo(null);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "comments", id));
      const replies = comments.filter((c) => c.parentId === id);
      for (const r of replies) await deleteDoc(doc(db, "comments", r.id));
      if (editCommentId === id) { setEditCommentId(null); setCommentText(""); setCommentImage(null); }
    } catch { /* silent */ }
  };

  const parentComments = useMemo(() => comments.filter((c) => !c.parentId), [comments]);

  /* ─── Loading ─── */
  if (reader.loading) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
        <div className={`w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin`} />
        <p className="text-sm text-gray-500 font-medium tracking-wide">Memuat chapter...</p>
      </div>
    );
  }

  /* ─── Error ─── */
  if (!reader.data || reader.data.images.length === 0) {
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

  const data = reader.data;

  return (
    <div
      className="relative min-h-screen bg-[#050505] text-white select-none overflow-x-hidden antialiased"
    >
      {/* Tap zones (horizontal mode) */}
      {reader.mode === "horizontal" && (
        <>
          <div className="fixed inset-y-0 left-0 w-[25%] z-30 cursor-w-resize" onClick={reader.prevPage} />
          <div className="fixed inset-y-0 left-[25%] right-[25%] z-30" onClick={() => reader.setShowUI((v) => !v)} />
          <div className="fixed inset-y-0 right-0 w-[25%] z-30 cursor-e-resize" onClick={reader.nextPage} />
        </>
      )}

      {/* Top toolbar */}
      <ReaderToolbar
        seriesTitle={data.series_title}
        chapterNumber={data.chapter_number}
        showUI={reader.showUI}
        onBack={() => router.back()}
        onOpenChapterList={() => { reader.setShowChapterList(true); reader.setShowUI(false); }}
        onHome={() => router.push("/")}
      />

      {/* Main content */}
      <main
        ref={reader.mainRef}
        className={
          reader.mode === "vertical"
            ? "flex flex-col items-center w-full pt-20 pb-8"
            : "relative flex items-center justify-center h-screen w-screen overflow-hidden bg-black"
        }
        onTouchStart={reader.onTouchStart}
        onTouchEnd={reader.onTouchEnd}
      >
        <PageViewer
          images={data.images}
          mode={reader.mode}
          fit={reader.fit}
          page={reader.page}
          brokenImages={reader.brokenImages}
          imgLoaded={reader.imgLoaded}
          onSetImgLoaded={reader.setImgLoaded}
          onImageError={reader.onImageError}
          onToggleUI={() => reader.setShowUI((v) => !v)}
        />

        {/* Vertical mode page counter when UI hidden */}
        {reader.mode === "horizontal" && !reader.showUI && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono text-gray-400">
            {reader.page + 1} <span className="text-gray-600">/</span> {data.images.length}
          </div>
        )}

        {/* Vertical mode: bottom actions */}
        {reader.mode === "vertical" && (
          <div className="relative z-20 w-full max-w-2xl mx-auto px-5 mt-12 space-y-8 pb-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => reader.handleNavigation(data.prev_chapter)}
                disabled={!data.prev_chapter}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-gray-300 border border-white/[0.04] transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <button
                onClick={() => reader.handleNavigation(data.next_chapter)}
                disabled={!data.next_chapter}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-gray-300 border border-white/[0.04] transition-all active:scale-[0.98]"
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => alert("Fitur laporan sedang dalam pengembangan!")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl text-sm text-gray-500 border border-white/[0.03] transition-colors"
            >
              <ReportIcon className="w-4 h-4" /> Laporkan Bab
            </button>

            {/* Community rules */}
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

            {/* Comments inline (vertical mode) */}
            <div className="border-t border-white/[0.04] pt-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <h2 className="font-bold text-lg text-gray-100">Komentar</h2>
                <span className={`text-xs ${accentStyle.soft} ${accentStyle.text} px-2 py-0.5 rounded-full font-semibold`}>{comments.length}</span>
              </div>
              {!user ? (
                <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                  <p className="text-sm text-gray-500">
                    <button onClick={() => router.push("/profile")} className={`${accentStyle.text} font-semibold hover:underline`}>Log masuk</button> untuk berkomentar.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitComment} className="space-y-3 mb-8">
                  {(replyTo || editCommentId) && (
                    <div className={`flex items-center justify-between ${accentStyle.soft} ${accentStyle.border} border px-3 py-2 rounded-xl`}>
                      <span className={`text-xs ${accentStyle.text} font-medium`}>
                        {editCommentId ? "Mengedit komentar" : `Membalas ${replyTo?.userName}`}
                      </span>
                      <button type="button" onClick={() => { setReplyTo(null); setEditCommentId(null); setCommentText(""); setCommentImage(null); }} className="text-xs text-gray-500 hover:text-gray-300">Batal</button>
                    </div>
                  )}
                  {commentImage && (
                    <div className="relative self-start w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={commentImage} className="h-16 w-16 object-cover rounded-xl border border-white/10" alt="Preview" />
                      <button type="button" onClick={() => setCommentImage(null)} className="absolute -top-1.5 -right-1.5 bg-gray-800 border border-white/10 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2.5 items-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={user.photoURL || "/no-avatar.png"} alt="Me" className="w-9 h-9 rounded-full bg-gray-800 object-cover shrink-0 ring-1 ring-white/5" />
                    <div className="flex-1 relative bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-end min-h-[48px] overflow-hidden focus-within:border-white/10 transition-colors">
                      <input type="file" id="imgUploadMain" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadToImgBB(e.target.files[0])} />
                      <label htmlFor="imgUploadMain" className="p-3 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </label>
                      <textarea
                        ref={commentInputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={editCommentId ? "Edit komentar..." : replyTo ? "Ketik balasan..." : "Tambah komentar..."}
                        rows={1}
                        className="flex-1 bg-transparent py-3 pl-1 pr-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none max-h-32"
                        onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
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
              {parentComments.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-600 gap-3">
                  <MessageCircle className="w-10 h-10 opacity-50" />
                  <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {parentComments.map((c) => (
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
        )}
      </main>

      {/* Horizontal page slider */}
      {reader.showUI && reader.mode === "horizontal" && (
        <div className="fixed bottom-[72px] left-4 right-4 z-40">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/[0.06] shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono w-8 text-right">{reader.page + 1}</span>
              <input
                type="range"
                min={0}
                max={data.images.length - 1}
                value={reader.page}
                onChange={(e) => reader.setPage(Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "rgba(255,255,255,0.4)" }}
              />
              <span className="text-xs text-gray-500 font-mono w-8">{data.images.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <ChapterNavigation
        showUI={reader.showUI}
        progress={reader.progress}
        hasPrev={!!data.prev_chapter}
        hasNext={!!data.next_chapter}
        commentCount={comments.length}
        onPrev={() => reader.handleNavigation(data.prev_chapter)}
        onNext={() => reader.handleNavigation(data.next_chapter)}
        onOpenComments={() => { reader.setShowComments(true); reader.setShowUI(false); }}
        onOpenSettings={() => { reader.setShowSettings(true); reader.setShowUI(false); }}
        onRefresh={reader.refreshChapter}
      />

      {/* Drawers / Overlays */}
      <SettingsDrawer
        show={reader.showSettings}
        mode={reader.mode}
        fit={reader.fit}
        onClose={() => reader.setShowSettings(false)}
        onModeChange={reader.setMode}
        onFitChange={reader.setFit}
      />
      <ChapterListDrawer
        show={reader.showChapterList}
        chapters={reader.filteredChapters}
        currentSlug={reader.chapterSlug}
        chapterSearch={reader.chapterSearch}
        currentChapterBtnRef={reader.currentChapterBtnRef}
        onClose={() => reader.setShowChapterList(false)}
        onSearch={reader.setChapterSearch}
        onNavigate={reader.handleNavigation}
      />
      <CommentsDrawer
        show={reader.showComments}
        comments={comments}
        user={user}
        accentStyle={accentStyle}
        accent={accent}
        commentText={commentText}
        commentImage={commentImage}
        replyTo={replyTo}
        editCommentId={editCommentId}
        isUploadingImage={isUploadingImage}
        deleteConfirmId={deleteConfirmId}
        onClose={() => reader.setShowComments(false)}
        onSubmit={handleSubmitComment}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteConfirmId(id)}
        onTextChange={setCommentText}
        onImageUpload={uploadToImgBB}
        onClearReply={() => { setReplyTo(null); setEditCommentId(null); setCommentText(""); setCommentImage(null); }}
        onImageClear={() => setCommentImage(null)}
        commentInputRef={commentInputRef}
        router={router}
      />
      <ZoomedImage src={reader.zoomedImage} onClose={() => reader.setZoomedImage(null)} />
      <DeleteConfirmDialog
        id={deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={(id) => { handleDelete(id); setDeleteConfirmId(null); }}
      />
    </div>
  );
}
