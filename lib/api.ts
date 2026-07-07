import { API_BASE_URL } from "@/constants/api";
import { formatMangaType } from "@/utils/manga";
import type { MangaItem, RelatedSeries } from "@/types/manga";

export type { MangaItem } from "@/types/manga";

export interface HomeApiResponse {
  success: boolean;
  data: {
    popular_today: MangaItem[];
    project_update: MangaItem[];
    latest_update: MangaItem[];
    recommendations: MangaItem[];
  };
  cached?: boolean;
}

export interface DetailApiResponse {
  success: boolean;
  // Fields marked optional are genuinely inconsistent across sources on the
  // backend (scraped data) — the detail page reads them defensively with
  // `||` fallbacks rather than trusting them to be present. This shape
  // mirrors what app/(content)/detail/[slug]/page.tsx actually normalizes,
  // instead of the narrower shape that was here before.
  data: {
    title?: string;
    slug?: string;
    alternative_title?: string;
    thumb?: string;
    thumbnail?: string;
    type?: string;
    author?: string;
    authors?: string[];
    artist?: string;
    artists?: string[];
    status?: string;
    genres?: (string | { name: string; url?: string })[];
    synopsis?: string;
    chapters?: {
      index?: number;
      chapter_number?: string;
      chapter?: string;
      chapter_url?: string;
      link?: string;
      slug?: string;
      chapter_slug?: string;
      release_date?: string;
      views?: string;
      pages?: number;
    }[];
    views?: string;
    followers?: string;
    release_year?: string;
    year?: string;
    released?: string;
    total_chapters?: number;
    updated_at?: string;
    last_updated?: string;
    updated_on?: string;
    related_series?: RelatedSeries[];
    recommendations?: MangaItem[];
  };
  cached?: boolean;
}

export interface ReadApiResponse {
  success: boolean;
  data: {
    title: string;
    series_title: string;
    series_slug: string;
    series_url?: string;
    chapter_number: string;
    images: { index: number; url: string; alt: string }[];
    prev_chapter: string | null;
    next_chapter: string | null;
    chapters?: { slug: string; number: string; url: string }[];
  };
  cached?: boolean;
}

export interface PustakaApiResponse {
  success: boolean;
  data: {
    comics: MangaItem[];
    hasNext: boolean;
    nextPage: number | null;
  };
  cached?: boolean;
}

export interface SearchApiResponse {
  success: boolean;
  data: {
    query: string;
    comics: MangaItem[];
    totalResults?: number;
    hasNext: boolean;
    nextPage?: number;
  };
  cached?: boolean;
}

export interface GenreApiResponse {
  success: boolean;
  data: MangaItem[] | { results: MangaItem[] };
  cached?: boolean;
}

function applyFlagsToItems(items: MangaItem[] | undefined): MangaItem[] {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item) => ({ ...item, type: formatMangaType(item.type) }));
}

async function fetcher<T>(endpoint: string): Promise<T | null> {
  try {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getHome(): Promise<HomeApiResponse | null> {
  const res = await fetcher<HomeApiResponse>("/home");
  if (res?.data) {
    res.data.popular_today = applyFlagsToItems(res.data.popular_today);
    res.data.project_update = applyFlagsToItems(res.data.project_update);
    res.data.latest_update = applyFlagsToItems(res.data.latest_update);
    res.data.recommendations = applyFlagsToItems(res.data.recommendations);
  }
  return res;
}

export async function getDetail(slug: string): Promise<DetailApiResponse | null> {
  const res = await fetcher<DetailApiResponse>(`/detail/${slug}`);
  if (res?.data) {
    res.data.type = formatMangaType(res.data.type);
    if (res.data.recommendations) {
      res.data.recommendations = applyFlagsToItems(res.data.recommendations);
    }
  }
  return res;
}

export async function getRead(chapterSlug: string): Promise<ReadApiResponse | null> {
  return fetcher<ReadApiResponse>(`/read/${chapterSlug}`);
}

export async function searchManga(q: string, page = 1): Promise<SearchApiResponse | null> {
  const res = await fetcher<SearchApiResponse>(
    `/search?q=${encodeURIComponent(q)}&page=${page}`
  );
  if (res?.data?.comics) {
    res.data.comics = applyFlagsToItems(res.data.comics);
  }
  return res;
}

export async function getGenre(
  genreSlug: string,
  page = 1
): Promise<GenreApiResponse | null> {
  const res = await fetcher<GenreApiResponse>(`/genre/${genreSlug}?page=${page}`);
  if (res?.data) {
    if (Array.isArray(res.data)) {
      res.data = applyFlagsToItems(res.data);
    } else if ("results" in res.data && Array.isArray(res.data.results)) {
      res.data.results = applyFlagsToItems(res.data.results);
    }
  }
  return res;
}

export async function filterManga(params: {
  tipe?: string;
  genre?: string;
  genre2?: string;
  status?: string;
  orderby?: string;
  sorttime?: string;
  page?: number;
}): Promise<PustakaApiResponse | null> {
  const qs = new URLSearchParams();
  if (params.tipe) qs.set("tipe", params.tipe);
  if (params.genre) qs.set("genre", params.genre);
  if (params.genre2) qs.set("genre2", params.genre2);
  if (params.status) qs.set("status", params.status);
  if (params.orderby) qs.set("orderby", params.orderby);
  if (params.sorttime) qs.set("sorttime", params.sorttime);
  if (params.page) qs.set("page", String(params.page));

  const res = await fetcher<PustakaApiResponse>(`/pustaka?${qs.toString()}`);
  if (res?.data?.comics) {
    res.data.comics = applyFlagsToItems(res.data.comics);
  }
  return res;
}

export async function getHealth(): Promise<Record<string, unknown> | null> {
  return fetcher<Record<string, unknown>>("/");
}

export function clearCacheLocal(): { success: boolean; message: string } {
  try {
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("cache") ||
            key.includes("tsukinest") ||
            key.includes("komiku")) &&
          !key.includes("firebase") &&
          key !== "tsukinest_recent_reads"
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
    }
    return { success: true, message: "Cache lokal berhasil dibersihkan" };
  } catch {
    return { success: false, message: "Gagal membersihkan cache" };
  }
}

export const clearCache = clearCacheLocal;