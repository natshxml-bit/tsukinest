"use client";
// features/chapter/components/ReaderSettings.tsx
// Settings drawer, chapter list drawer, comments drawer, zoomed image, delete confirm.

import { useRef } from "react";
import {
  X, BookOpen, Settings, MessageCircle, Trash2,
  Send, ImageIcon, Reply, Edit3, AlertTriangle,
} from "lucide-react";
import { memo, useMemo } from "react";
import { useAccent } from "@/lib/accent";
import { formatDate } from "@/features/chapter/utils/reader.utils";
import type { Comment, ReadChapterRef, ReadMode, FitMode } from "@/features/chapter/types";
import type { User as FirebaseUser } from "firebase/auth";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ─── Comment node (memoized) ─── */
export const CommentNode = memo(function CommentNode({
  comment, user, accentStyle, accent, onReply, onEdit, onDelete, allComments,
}: {
  comment: Comment;
  user: FirebaseUser | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accentStyle: any;
  accent: string;
  onReply: (c: Comment) => void;
  onEdit: (c: Comment) => void;
  onDelete: (id: string) => void;
  allComments: Comment[];
}) {
  const canEdit =
    user?.uid === comment.userId &&
    comment.createdAt != null &&
    Date.now() - comment.createdAt.toMillis() <= 15 * 60 * 1000;
  const replies = useMemo(
    () => allComments.filter((c) => c.parentId === comment.id),
    [allComments, comment.id]
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex gap-3 p-3 -mx-2 rounded-2xl transition-colors hover:bg-white/[0.02] group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={comment.userPhoto || "/no-avatar.png"}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.imageUrl}
              alt="Attachment"
              className="mt-2 max-w-[200px] max-h-[220px] object-cover rounded-xl border border-white/5"
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
      {replies.length > 0 && (
        <div className="ml-11 pl-3 border-l border-white/5 space-y-3 mt-1">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200 group/reply">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reply.userPhoto || "/no-avatar.png"} alt={reply.userName} className="w-7 h-7 rounded-full bg-gray-800 object-cover shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs text-gray-300">{reply.userName}</span>
                  <span className="text-[10px] text-gray-600">{formatDate(reply.createdAt)}</span>
                  {reply.updatedAt && <span className="text-[10px] text-gray-600 italic">· diedit</span>}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed break-words whitespace-pre-wrap">{reply.text}</p>
                {reply.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={reply.imageUrl} className="mt-1.5 max-w-[150px] max-h-[160px] object-cover rounded-lg border border-white/5" loading="lazy" alt="Attachment" />
                )}
                <div className="flex items-center gap-3 mt-1.5 opacity-100 md:opacity-0 md:group-hover/reply:opacity-100 transition-opacity">
                  <button onClick={() => onReply(reply)} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Balas</button>
                  {user?.uid === reply.userId && reply.createdAt != null && Date.now() - reply.createdAt.toMillis() <= 15 * 60 * 1000 && (
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

/* ─── Settings Drawer ─── */
export function SettingsDrawer({
  show, mode, fit, onClose, onModeChange, onFitChange,
}: {
  show: boolean;
  mode: ReadMode;
  fit: FitMode;
  onClose: () => void;
  onModeChange: (m: ReadMode) => void;
  onFitChange: (f: FitMode) => void;
}) {
  const { style: accentStyle } = useAccent();
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-t-3xl p-6 space-y-8 shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center -mt-2 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-100 tracking-tight">Pengaturan</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-bold mb-3 block">Arah Baca</label>
            <div className="grid grid-cols-2 gap-2.5">
              {(["vertical", "horizontal"] as const).map((m) => (
                <button key={m} onClick={() => onModeChange(m)} className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all border ${mode === m ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}` : "bg-white/[0.03] text-gray-500 border-transparent hover:bg-white/[0.05]"}`}>
                  {m === "vertical" ? "Vertikal" : "Horizontal"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-bold mb-3 block">Penyesuaian Gambar</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["height", "width", "original"] as const).map((f) => (
                <button key={f} onClick={() => onFitChange(f)} className={`px-3 py-3.5 rounded-xl text-sm font-semibold transition-all border ${fit === f ? `${accentStyle.soft} ${accentStyle.text} ${accentStyle.border}` : "bg-white/[0.03] text-gray-500 border-transparent hover:bg-white/[0.05]"}`}>
                  {f === "height" ? "Tinggi" : f === "width" ? "Lebar" : "Asli"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-2 pb-1">
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
            <p className="text-[11px] text-gray-600 text-center">
              <span className="text-gray-400 font-medium">Tip:</span> Gunakan{" "}
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400 text-[10px] border border-white/5">←</kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400 text-[10px] border border-white/5">→</kbd>{" "}
              untuk navigasi halaman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chapter List Drawer ─── */
export function ChapterListDrawer({
  show, chapters, currentSlug, chapterSearch, currentChapterBtnRef, onClose, onSearch, onNavigate,
}: {
  show: boolean;
  chapters: ReadChapterRef[];
  currentSlug: string;
  chapterSearch: string;
  currentChapterBtnRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSearch: (q: string) => void;
  onNavigate: (slug: string) => void;
}) {
  const { style: accentStyle } = useAccent();
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-t-3xl h-[85dvh] flex flex-col shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>
        <div className="px-6 pb-4 border-b border-white/[0.04] flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-gray-100 tracking-tight">Daftar Chapter</h3>
            <p className="text-xs text-gray-600 mt-0.5">{chapters.length} chapter</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-4 py-3">
          <input
            type="text"
            value={chapterSearch}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari chapter..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/10 transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-2">
              <BookOpen className="w-8 h-8 opacity-50" />
              <p className="text-sm">Chapter tidak ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {chapters.map((ch, idx) => {
                const isCurrent = ch.slug === currentSlug;
                const num = ch.number.replace(/^Chapter\s+/i, "");
                return (
                  <button
                    key={`${ch.slug}-${idx}`}
                    ref={isCurrent ? currentChapterBtnRef : null}
                    onClick={() => { onNavigate(ch.slug); onClose(); }}
                    className={`relative px-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 text-center ${
                      isCurrent
                        ? `${accentStyle.bg} text-white shadow-lg shadow-black/40 ring-1 ring-white/10`
                        : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border border-white/[0.04]"
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
  );
}

/* ─── Comments Drawer ─── */
export function CommentsDrawer({
  show, comments, user, accentStyle, accent, commentText, commentImage, replyTo, editCommentId,
  isUploadingImage, onClose, onSubmit, onReply, onEdit, onDelete, onTextChange, onImageUpload,
  onClearReply, commentInputRef, router,
}: {
  show: boolean;
  comments: Comment[];
  user: FirebaseUser | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accentStyle: any;
  accent: string;
  commentText: string;
  commentImage: string | null;
  replyTo: Comment | null;
  editCommentId: string | null;
  isUploadingImage: boolean;
  deleteConfirmId: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onReply: (c: Comment) => void;
  onEdit: (c: Comment) => void;
  onDelete: (id: string) => void;
  onTextChange: (v: string) => void;
  onImageUpload: (f: File) => void;
  onClearReply: () => void;
  onImageClear: () => void;
  commentInputRef: React.RefObject<HTMLTextAreaElement | null>;
  router: ReturnType<typeof import("next/navigation").useRouter>;
}) {
  const parentComments = useMemo(() => comments.filter((c) => !c.parentId), [comments]);
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-t-3xl h-[85dvh] flex flex-col shadow-2xl border-t border-white/[0.06] animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>
        <div className="px-6 pb-3 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-base text-gray-100">Komentar</h3>
            <span className={`text-xs ${accentStyle.soft} ${accentStyle.text} px-2 py-0.5 rounded-full font-medium`}>{comments.length}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!user ? (
            <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/[0.04] mt-4">
              <p className="text-sm text-gray-500">
                <button onClick={() => router.push("/profile")} className={`${accentStyle.text} font-semibold hover:underline`}>Log masuk</button> untuk berkomentar.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3 mb-6 sticky top-0 bg-[#0a0a0a] pt-2 pb-4 z-10">
              {(replyTo || editCommentId) && (
                <div className={`flex items-center justify-between ${accentStyle.soft} ${accentStyle.border} border px-3 py-2 rounded-xl`}>
                  <span className={`text-xs ${accentStyle.text} font-medium`}>
                    {editCommentId ? "Mengedit komentar" : `Membalas ${replyTo?.userName}`}
                  </span>
                  <button type="button" onClick={onClearReply} className="text-xs text-gray-500 hover:text-gray-300">Batal</button>
                </div>
              )}
              {commentImage && (
                <div className="relative self-start w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={commentImage} className="h-14 w-14 object-cover rounded-lg border border-white/10" alt="Preview" />
                  <button type="button" onClick={() => onImageUpload(new File([], ""))} className="absolute -top-1.5 -right-1.5 bg-gray-800 border border-white/10 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2.5 items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.photoURL || "/no-avatar.png"} alt="Me" className="w-8 h-8 rounded-full bg-gray-800 object-cover shrink-0" />
                <div className="flex-1 relative bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-end min-h-[40px] overflow-hidden focus-within:border-white/10 transition-colors">
                  <input type="file" id="imgUploadDrawer" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} />
                  <label htmlFor="imgUploadDrawer" className="p-2.5 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </label>
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder={editCommentId ? "Edit..." : replyTo ? "Balasan..." : "Komentar..."}
                    rows={1}
                    className="flex-1 bg-transparent py-2.5 pl-1 pr-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none max-h-24"
                    onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
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
              parentComments.map((c) => (
                <CommentNode
                  key={c.id}
                  comment={c}
                  user={user}
                  accentStyle={accentStyle}
                  accent={accent}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  allComments={comments}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Dialog ─── */
export function DeleteConfirmDialog({
  id, onCancel, onConfirm,
}: {
  id: string | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!id) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#111] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Hapus Komentar?</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Tindakan ini tidak dapat dibatalkan. Balasan terkait juga akan ikut terhapus.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors">Batal</button>
          <button onClick={() => onConfirm(id)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">Hapus</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Zoomed Image ─── */
export function ZoomedImage({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
      <div className="relative max-w-5xl max-h-[90vh] w-full flex justify-center">
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute -top-14 right-0 p-2.5 bg-white/5 hover:bg-red-500/80 rounded-full text-white border border-white/10 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Zoomed" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
