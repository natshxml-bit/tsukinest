export interface MangaItem {
  title: string;
  slug: string;
  thumb: string;
  type: string;
  latest_chapter: string;
  rating?: string;
  link: string;
  is_colored?: boolean;
  is_hot?: boolean;
  is_new?: boolean;
  synopsis?: string;
  genres?: string[];
  chapters?: ChapterSummary[];
}

export interface ChapterSummary {
  chapter_url?: string;
  chapter_title?: string;
  released_time?: string;
}

export interface ChapterItem {
  index?: number;
  chapter_url?: string;
  chapter_number: string;
  release_date?: string;
  slug: string;
  views?: string;
  pages?: number;
}

export interface MangaDetail {
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
  related_series?: RelatedSeries[];
}

export interface RelatedSeries {
  title: string;
  slug: string;
  thumb: string;
  type: string;
  latest_chapter?: string;
  rating?: string;
  link?: string;
}

export interface RecentRead {
  slug: string;
  title: string;
  thumb: string;
  chapter: string;
  timestamp: number;
  progress?: number;
  totalChapters?: number;
}

export interface DbNotification {
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
  createdAt: FirestoreTimestamp | null;
}

export interface FirestoreTimestamp {
  toDate: () => Date;
  toMillis: () => number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  imageUrl?: string | null;
  createdAt: FirestoreTimestamp | null;
  updatedAt: FirestoreTimestamp | null;
  parentId: string | null;
}

export interface LibraryItem extends MangaItem {
  id: string;
  savedAt: number;
  lastReadChapter?: string;
  updatedAt?: number;
  lastReadAt?: number;
  totalChapters?: number;
  status?: "ongoing" | "completed" | "hiatus";
  poster?: string;
  cover?: string;
  image?: string;
  thumbnail?: string;
  thumb_url?: string;
}

export type LibraryTab = "bookmark" | "like" | "history";
export type SortType = "newest" | "oldest" | "alpha" | "updated";
export type ViewType = "grid" | "list";
