// features/manga/services/manga.service.ts
// Service layer untuk manga detail — wrapper tipis di atas lib/api.ts

import { getDetail } from "@/lib/api";
import type { MangaDetail, ChapterItem } from "@/types/manga";

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

function normalizeChapter(c: Record<string, unknown>, idx: number): ChapterItem {
  return {
    index: typeof c.index === "number" ? c.index : idx,
    chapter_url:
      (c.chapter_url as string | undefined) ||
      (c.link as string | undefined),
    chapter_number:
      (c.chapter_number as string | undefined) ||
      (c.chapter as string | undefined) ||
      `Ch. ${idx + 1}`,
    release_date: c.release_date as string | undefined,
    slug:
      (c.slug as string | undefined) ||
      (c.chapter_slug as string | undefined) ||
      "",
    views: (c.views as string | undefined) || "0",
    pages: (c.pages as number | undefined) || 0,
  };
}

export async function fetchMangaDetail(slug: string): Promise<MangaDetail | null> {
  const res = await getDetail(slug);
  if (!res?.success || !res.data) return null;

  const raw = res.data as Record<string, unknown>;

  const normalized: MangaDetail = {
    title: (raw.title as string) || "Judul Tidak Tersedia",
    alternative_title: raw.alternative_title as string | undefined,
    thumb: cleanThumb(
      (raw.thumb as string) || (raw.thumbnail as string) || ""
    ),
    rating: raw.rating as string | undefined,
    status: raw.status as string | undefined,
    type: raw.type as string | undefined,
    author:
      (raw.author as string | undefined) ||
      ((raw.authors as string[] | undefined)?.[0]),
    artist:
      (raw.artist as string | undefined) ||
      ((raw.artists as string[] | undefined)?.[0]),
    genres: (raw.genres as MangaDetail["genres"]) || [],
    synopsis:
      (raw.synopsis as string) || "Sinopsis belum tersedia untuk seri ini.",
    chapters: ((raw.chapters as Record<string, unknown>[]) || []).map(
      normalizeChapter
    ),
    views: (raw.views as string) || "0",
    followers: (raw.followers as string) || "0",
    release_year:
      (raw.release_year as string | undefined) ||
      (raw.year as string | undefined) ||
      (raw.released as string | undefined),
    total_chapters: raw.total_chapters as number | undefined,
    updated_at:
      (raw.updated_at as string | undefined) ||
      (raw.last_updated as string | undefined) ||
      (raw.updated_on as string | undefined),
    related_series:
      ((raw.related_series as MangaDetail["related_series"]) ||
        (raw.recommendations as MangaDetail["related_series"])) ??
      [],
  };

  return normalized;
}
