"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Play, BookOpen, Bookmark, BookmarkCheck, ArrowLeft,
  Layers, Info, TrendingUp, X, Copy, CheckCircle2,
  Trophy, Sparkles,
} from "lucide-react";
import { useAccent } from "@/lib/accent";
import { useMangaDetail } from "@/features/manga/hooks/useMangaDetail";
import SmartImage from "@/components/ui/SmartImage"; // <-- PAKAI GLOBAL (Sesuaikan jika letak foldermu beda)
import { MangaHeader } from "./MangaHeader";
import { MangaCover } from "./MangaCover";
import { MangaInfo } from "./MangaInfo";
import { GenreList } from "./GenreList";
import { Description } from "./Description";
import { ChapterList } from "./ChapterList";
import { RelatedManga } from "./RelatedManga";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

export function MangaDetail() {
  const { style: accentStyle } = useAccent();
  const hook = useMangaDetail();

  /* ─── Loading ─── */
  if (hook.loading) {
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
            </div>
          </div>
          <div className="h-32 bg-[#141414] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#141414] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (hook.error || !hook.data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="bg-[#141414] border border-white/[0.05] rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-red-400 w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Gagal Memuat</h3>
          <p className="text-red-400/80 mb-6 text-sm">{hook.error || "Data tidak ditemukan."}</p>
          <button
            onClick={hook.handleBack}
            className="w-full py-3 bg-[#1c1c1c] hover:bg-[#262626] rounded-xl transition font-semibold flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  const data = hook.data;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-100 selection:bg-white/10 pb-24 overflow-x-hidden">
      {/* Login notification */}
      {hook.showNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-[#141414] border border-white/5 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3">
            <Info className={cn("w-5 h-5", accentStyle.text)} />
            <span className="text-sm font-medium">Silakan login untuk menyimpan ke koleksi</span>
            <button onClick={() => hook.setShowNotification(false)} className="ml-2 hover:text-white text-neutral-400">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Share modal */}
      {hook.showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/[0.05] rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">Bagikan Seri</h3>
              <button onClick={() => hook.setShowShareModal(false)} className="p-2 hover:bg-[#1c1c1c] rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <button
              onClick={hook.copyToClipboard}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#262626] transition border border-white/5"
            >
              {hook.copied ? <CheckCircle2 className="text-emerald-400" size={18} /> : <Copy size={18} className="text-neutral-400" />}
              <span className="text-sm font-medium">{hook.copied ? "Tersalin!" : "Salin Link"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <MangaHeader
        thumb={data.thumb}
        title={data.title}
        isLiked={hook.isLiked}
        showSettings={hook.showSettings}
        readingMode={hook.readingMode}
        imageQuality={hook.imageQuality}
        settingsRef={hook.settingsRef}
        onBack={hook.handleBack}
        onToggleLike={() => hook.setIsLiked(!hook.isLiked)}
        onShare={hook.handleShare}
        onToggleSettings={() => hook.setShowSettings(!hook.showSettings)}
        onReadingModeChange={hook.saveReadingMode}
        onImageQualityChange={hook.setImageQuality}
      >
        <SmartImage
          src={data.thumb}
          alt={data.title}
          title={data.title}
          fill
          className="object-cover opacity-55 scale-100 blur-xl transform-gpu"
          priority
        />
      </MangaHeader>

      {/* Main content */}
      <div className="px-4 -mt-28 md:-mt-36 relative z-10 max-w-4xl mx-auto space-y-5">
        {/* Cover + title */}
        <FadeIn delay={100}>
          <MangaCover data={data} accentText={accentStyle.text}>
            <SmartImage
              src={data.thumb || "/no-image.png"}
              alt={data.title}
              title={data.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          </MangaCover>
        </FadeIn>

        {/* Action buttons */}
        <FadeIn delay={150}>
          <div className="flex gap-2.5">
            {hook.continueReadingChapter ? (
              <Link
                href={`/chapter/${hook.slug}/${hook.continueReadingChapter.slug}`}
                prefetch={false}
                onClick={() => hook.markChapterAsRead(hook.continueReadingChapter!.slug)}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition active:scale-[0.98]", accentStyle.bg)}
              >
                <Play size={17} fill="white" /> Lanjutkan {hook.continueReadingChapter.chapter_number}
              </Link>
            ) : hook.latestChapter ? (
              <Link
                href={`/chapter/${hook.slug}/${hook.latestChapter.slug}`}
                prefetch={false}
                onClick={() => hook.markChapterAsRead(hook.latestChapter!.slug)}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition active:scale-[0.98]", accentStyle.bg)}
              >
                <BookOpen size={17} /> Baca Sekarang
              </Link>
            ) : (
              <div className="flex-1 py-3.5 rounded-xl bg-[#141414] text-neutral-500 font-bold text-center text-sm border border-white/5">
                Tidak ada bab
              </div>
            )}
            <button
              onClick={hook.toggleBookmark}
              className={cn(
                "w-12 flex items-center justify-center rounded-xl border transition active:scale-95",
                hook.isBookmarked
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                  : "bg-[#141414] border-white/5 text-neutral-400 hover:bg-[#1c1c1c]"
              )}
            >
              {hook.isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={200}>
          <MangaInfo
            author={hook.authors[0] || "-"}
            artist={hook.artists[0] || "-"}
            totalChapters={hook.displayTotalChapters}
            updatedAt={data.updated_at || "Baru saja"}
          />
        </FadeIn>

        {/* Synopsis */}
        <FadeIn delay={250}>
          <Description synopsis={data.synopsis} />
        </FadeIn>

        {/* Genres */}
        {hook.genres.length > 0 && (
          <FadeIn delay={300}>
            <GenreList genres={hook.genres} />
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
                onClick={() => hook.setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all",
                  hook.activeTab === tab.id
                    ? cn(accentStyle.bg + "/10", accentStyle.text, "bg-[#1c1c1c]")
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-[#1c1c1c]"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Chapter list tab */}
        {hook.activeTab === "chapters" && (
          <FadeIn>
            <ChapterList
              seriesSlug={hook.slug}
              shownChapters={hook.shownChapters}
              sortedChapters={hook.sortedChapters}
              totalChapters={hook.displayTotalChapters}
              readChapters={hook.readChapters}
                lastReadChapter={hook.lastReadChapter?.slug || null}
              chapterFilter={hook.chapterFilter}
              chapterSort={hook.chapterSort}
              showAll={hook.showAllChapters}
              chapterListRef={hook.chapterListRef}
              onFilterChange={hook.setChapterFilter}
              onSortToggle={() => hook.setChapterSort(hook.chapterSort === "newest" ? "oldest" : "newest")}
              onShowAllToggle={() => hook.setShowAllChapters(!hook.showAllChapters)}
              onChapterRead={hook.markChapterAsRead}
            />
          </FadeIn>
        )}

        {/* Info tab */}
        {hook.activeTab === "info" && (
          <FadeIn>
            <div className="space-y-4">
              <div className="bg-[#141414] border border-white/[0.05] rounded-2xl hover:border-white/[0.1] transition-colors p-5">
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
                    { label: "Total Bab", value: String(hook.displayTotalChapters) },
                    { label: "Penulis", value: hook.authors.join(", ") || "-" },
                    { label: "Ilustrator", value: hook.artists.join(", ") || "-" },
                    { label: "Genre", value: hook.genres.join(", ") || "-" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-start py-2 border-b border-white/[0.02] last:border-0">
                      <span className="text-[11px] text-neutral-600 font-bold uppercase">{item.label}</span>
                      <span className="text-sm text-neutral-400 font-medium text-right max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {hook.readChapters.length > 0 && (
                <div className="bg-[#141414] border border-white/[0.05] rounded-2xl hover:border-white/[0.1] transition-colors p-5">
                  <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2">
                    <Trophy size={15} className="text-amber-400" /> Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>{hook.readChapters.length} dari {hook.displayTotalChapters} bab</span>
                      <span className={cn("font-bold", accentStyle.text)}>
                        {Math.round((hook.readChapters.length / Math.max(hook.displayTotalChapters, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", accentStyle.bg)}
                        style={{ width: `${(hook.readChapters.length / Math.max(hook.displayTotalChapters, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Related tab */}
        {hook.activeTab === "related" && (
          <FadeIn>
            <RelatedManga items={data.related_series || []} />
          </FadeIn>
        )}
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
        {hook.latestChapter && (
          <Link
            href={`/chapter/${hook.slug}/${hook.latestChapter.slug}`}
            prefetch={false}
            onClick={() => hook.markChapterAsRead(hook.latestChapter!.slug)}
            className={cn("flex items-center gap-2 px-6 py-3.5 text-white font-bold text-sm rounded-full shadow-2xl transition active:scale-95", accentStyle.bg)}
          >
            <BookOpen size={17} /> Baca Sekarang
          </Link>
        )}
      </div>
    </main>
  );
}
