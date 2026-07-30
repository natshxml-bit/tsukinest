import { API_BASE_URL } from "@/constants/api";
import { formatMangaType } from "@/utils/manga";
import type { MangaItem, RelatedSeries } from "@/types/manga";

export type { MangaItem } from "@/types/manga";

// =============================================================================
// ENVELOPE TYPE
// =============================================================================
export interface ApiEnvelope<T> {
  retcode: number;
  message?: string;
  meta?: {
    request_id?: string;
    timestamp?: number;
    process_time?: string;
    page?: number;
    page_size?: number;
    total_page?: number;
    total_record?: number;
    [key: string]: any;
  };
  data: T;
}

export function unwrap<T>(env: ApiEnvelope<T> | T | undefined | null, fallback: T): T {
  if (env == null) return fallback;
  if (Array.isArray(env)) return env as unknown as T;
  if (typeof env === "object" && "data" in (env as object) && (env as { data?: unknown }).data !== undefined) {
    return (env as ApiEnvelope<T>).data;
  }
  return fallback;
}

// =============================================================================
// ANNOUNCEMENT
// =============================================================================
export interface AnnouncementListItem {
  announcement_id: string;
  title: string;
  thumbnail_image_url: string;
  publish_status: number;
  created_date: string;
}

export interface AnnouncementDetailItem extends AnnouncementListItem {
  content: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// HOME API RESPONSE
// =============================================================================
export interface HomeApiResponse {
  status: boolean;
  data: {
    project_update: ApiEnvelope<MangaItem[]>;
    mirror_update: ApiEnvelope<MangaItem[]>;
    recommended: {
      manhwa: ApiEnvelope<MangaItem[]>;
      manga: ApiEnvelope<MangaItem[]>;
      manhua: ApiEnvelope<MangaItem[]>;
    };
    top: {
      daily: ApiEnvelope<MangaItem[]>;
      weekly: ApiEnvelope<MangaItem[]>;
      all_time: ApiEnvelope<MangaItem[]>;
    };
    announcement: {
      list: ApiEnvelope<AnnouncementListItem[]>;
      detail?: ApiEnvelope<AnnouncementDetailItem>;
    };
  };
  cached_at?: string;
}

// =============================================================================
// TAXONOMY (untuk detail response)
// =============================================================================
export interface TaxonomyItem {
  taxonomy_id: number;
  slug: string;
  name: string;
}

export interface TaxonomyMap {
  Artist?: TaxonomyItem[];
  Author?: TaxonomyItem[];
  Format?: TaxonomyItem[];
  Genre?: TaxonomyItem[];
  Type?: TaxonomyItem[];
  [key: string]: TaxonomyItem[] | undefined;
}

// =============================================================================
// DETAIL API RESPONSE — diperbarui match JSON response real
// =============================================================================
export interface DetailApiResponse {
  status: boolean;           // ← tambah (JSON pakai status, bukan success)
  success: boolean;          // ← tetap ada buat backward compat
  data: {
    // Identitas
    id?: number;
    manga_id?: string;
    title?: string;
    slug?: string;
    alternative_title?: string;

    // Media
    thumb?: string;
    thumbnail?: string;
    cover_image_url?: string;
    cover_portrait_url?: string;

    // Metadata
    type?: string;
    country_id?: string;
    status?: string | number;
    release_year?: string;
    year?: string;
    released?: string;

    // Rating & Stats
    rating?: string;
    user_rate?: number | string;
    views?: string;
    view_count?: number;
    followers?: string;
    bookmark_count?: number;
    rank?: number;

    // Sinopsis
    synopsis?: string;
    description?: string;

    // Taxonomy (Author, Artist, Genre, dll)
    taxonomy?: TaxonomyMap;

    // Chapter terakhir
    latest_chapter_id?: string;
    latest_chapter_number?: number | string;
    latest_chapter_time?: string;

    // Chapter list
    chapters?: {
      chapter_id?: string;
      manga_id?: string;
      chapter_title?: string;
      chapter_number?: string | number;
      chapter?: string | number;
      chapter_url?: string;
      link?: string;
      slug?: string;
      chapter_slug?: string;
      release_date?: string;
      views?: string | number;
      thumbnail_image_url?: string;
      pages?: number;
    }[];

    // Related
    related_series?: RelatedSeries[];
    recommendations?: MangaItem[];
    is_recommended?: boolean;

    // Timestamp
    created_at?: string;
    updated_at?: string;
    last_updated?: string;
    updated_on?: string;
    deleted_at?: string | null;
  };
  cached?: boolean;
  cached_at?: string;
}

export interface ReadApiResponse {
  retcode?: number;
  message?: string;
  meta?: {
    request_id?: string;
    timestamp?: number;
    process_time?: string;
  };
  success?: boolean;
  data: {
    chapter_id?: string;
    manga_id?: string;
    chapter_number?: number | string;
    chapter_title?: string;
    base_url?: string;
    base_url_low?: string;
    thumbnail_image_url?: string;
    view_count?: number;
    prev_chapter_id?: string | null;
    prev_chapter_number?: number | null;
    next_chapter_id?: string | null;
    next_chapter_number?: number | null;
    images: string[] | { index: number; url: string; alt: string }[];
    release_date?: string;
    created_at?: string;
    updated_at?: string;
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

// =============================================================================
// getHome
// =============================================================================
export async function getHome(): Promise<HomeApiResponse | null> {
  return fetcher<HomeApiResponse>("/home");
}

// =============================================================================
// getDetail — diperbarui: handle field baru + defensif
// =============================================================================
export async function getDetail(slug: string): Promise<DetailApiResponse | null> {
  const res = await fetcher<DetailApiResponse>(`/detail/${slug}`);
  if (res?.data) {
    // Format type kalau ada
    if (res.data.type) {
      res.data.type = formatMangaType(res.data.type);
    }
    // Format country_id jadi type kalau type kosong
    if (!res.data.type && res.data.country_id) {
      res.data.type = formatMangaType(res.data.country_id);
    }
    if (res.data.recommendations) {
      res.data.recommendations = applyFlagsToItems(res.data.recommendations);
    }
  }
  return res;
}

export async function getRead(chapterSlug: string): Promise<ReadApiResponse | null> {
  return fetcher<ReadApiResponse>(`/chapter/${chapterSlug}`);
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
  // Nama param di sini disesuaikan ke yang dipahami cnest-shi /filter
  // (type, genre[], status, order, page) — bukan nama lama (tipe/orderby/dst).
  const qs = new URLSearchParams();
  if (params.tipe) qs.set("type", params.tipe);
  if (params.genre) qs.append("genre[]", params.genre);
  if (params.genre2) qs.append("genre[]", params.genre2);
  if (params.status) qs.set("status", params.status);
  if (params.orderby) qs.set("order", params.orderby);
  if (params.page) qs.set("page", String(params.page));

  const res = await fetcher<PustakaApiResponse>(`/filter?${qs.toString()}`);
  if (res?.data?.comics) {
    res.data.comics = applyFlagsToItems(res.data.comics);
  }
  return res;
}

export async function getHealth(): Promise<Record<string, unknown> | null> {
  return fetcher<Record<string, unknown>>("/");
}

const PROTECTED_STORAGE_KEYS = new Set([
  "tsukinest_recent_reads",
  "tsukinest_read_chapters",
  "tsukinest_theme",
  "tsukinest_color_scheme",
  "tsukinest_seen_notifs_v2",
]);

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
          !PROTECTED_STORAGE_KEYS.has(key)
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
