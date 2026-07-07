// features/chapter/types.ts
import type { Timestamp } from "firebase/firestore";

export interface ChapterImage {
  index: number;
  url: string;
  alt: string;
}

/**
 * Chapter reference as returned inside ReadApiResponse.
 * NOT the same shape as the canonical ChapterItem in @/types/manga —
 * this one uses `number` / `url` rather than `chapter_number` / `chapter_url`.
 */
export interface ReadChapterRef {
  slug: string;
  number: string;
  url?: string;
}

export interface ReadData {
  title: string;
  chapter_number: string | number;
  series_title: string;
  series_slug: string;
  prev_chapter: string | null;
  next_chapter: string | null;
  images: ChapterImage[];
  chapters: ReadChapterRef[];
}

export interface Comment {
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

export type ReadMode = "vertical" | "horizontal";
export type FitMode = "height" | "width" | "original";
