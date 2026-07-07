// features/manga/types.ts
// Re-exports from shared types + feature-specific types

export type {
  MangaDetail,
  ChapterItem,
  RelatedSeries,
  MangaItem,
} from "@/types/manga";

export type SortOrder = "newest" | "oldest";
export type ReadingMode = "vertical" | "horizontal" | "webtoon";
export type ImageQuality = "high" | "medium" | "low";
export type DetailTab = "chapters" | "info" | "related";

export interface MangaDetailState {
  data: import("@/types/manga").MangaDetail | null;
  loading: boolean;
  error: string | null;
  readChapters: string[];
  lastReadChapter: string | null;
  isBookmarked: boolean;
  isLiked: boolean;
  activeTab: DetailTab;
  chapterFilter: string;
  chapterSort: SortOrder;
  showFullSynopsis: boolean;
  showAllChapters: boolean;
  showShareModal: boolean;
  showSettings: boolean;
  showNotification: boolean;
  readingMode: ReadingMode;
  imageQuality: ImageQuality;
  copied: boolean;
}
