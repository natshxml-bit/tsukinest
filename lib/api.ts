// lib/api.ts
const BASE_URL = "https://nest-network.up.railway.app";

// ─── Types (Disesuaikan dengan API Komiku) ────

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
  chapters?: { 
    chapter_url: string;
    chapter_title: string;
    released_time: string;
  }[];
  _raw?: any; 
}

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
  data: {
    title: string;
    slug: string;
    thumbnail: string;
    type: string;
    author: string;
    status: string;
    genres: string[];
    synopsis: string;
    chapters: { title: string; slug: string }[];
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

// ─── Format Helpers (Fitur Bendera Negara Global) ────
export function formatMangaType(rawType: string): string {
  if (!rawType) return "MANGA";
  const typeUpper = rawType.toUpperCase();
  
  if (typeUpper.includes("MANHWA")) return "🇰🇷 " + typeUpper;
  if (typeUpper.includes("MANHUA")) return "🇨🇳 " + typeUpper;
  if (typeUpper.includes("MANGA")) return "🇯🇵 " + typeUpper;
  
  return typeUpper;
}

function applyFlagsToItems(items: MangaItem[] | undefined): MangaItem[] {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    type: formatMangaType(item.type)
  }));
}

// ─── Fetcher Helper ──────────────────────────────────
async function fetcher<T>(endpoint: string): Promise<T | null> {
  try {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${BASE_URL}${path}`;
    
    const res = await fetch(fullUrl, { cache: "no-store" });

    if (!res.ok) {
      console.warn(`[API Warn] ${fullUrl} returned HTTP ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[API Error] fetching ${endpoint}:`, err);
    return null;
  }
}

// ─── API Functions ───────────────────────────────────

export async function getHome(): Promise<HomeApiResponse | null> {
  const res = await fetcher<HomeApiResponse>("/home");
  if (res && res.data) {
    res.data.popular_today = applyFlagsToItems(res.data.popular_today);
    res.data.project_update = applyFlagsToItems(res.data.project_update);
    res.data.latest_update = applyFlagsToItems(res.data.latest_update);
    res.data.recommendations = applyFlagsToItems(res.data.recommendations);
  }
  return res;
}

export async function getDetail(slug: string): Promise<DetailApiResponse | null> {
  const res = await fetcher<DetailApiResponse>(`/detail/${slug}`);
  
  if (res && res.data) {
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
  const res = await fetcher<SearchApiResponse>(`/search?q=${encodeURIComponent(q)}&page=${page}`);
  if (res && res.data && res.data.comics) {
    res.data.comics = applyFlagsToItems(res.data.comics);
  }
  return res;
}

// FIX: Tambahin fungsi getGenre di sini biar Vercel nggak error
export async function getGenre(genreSlug: string, page = 1): Promise<any | null> {
  const res = await fetcher<any>(`/genre/${genreSlug}?page=${page}`);
  
  if (res && res.data) {
    // Kalau response API balikin list array langsung
    if (Array.isArray(res.data)) {
      res.data = applyFlagsToItems(res.data);
    } 
    // Kalau response API balikin object { results: [...] }
    else if (res.data.results && Array.isArray(res.data.results)) {
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
  if (res && res.data && res.data.comics) {
    res.data.comics = applyFlagsToItems(res.data.comics);
  }
  return res;
}

export async function getHealth(): Promise<any | null> {
  return fetcher<any>("/");
}

// ─── Utility Functions ───────────────────────────────

export async function clearCache(): Promise<{ success: boolean; message?: string }> {
  try {
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("cache") || key.includes("tsukinest") || key.includes("komiku"))) {
          if (!key.includes("firebase") && key !== "tsukinest_recent_reads") {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
    }

    return { success: true, message: "Cache lokal berhasil dibersihkan" };
  } catch (error) {
    console.error("Gagal clear cache:", error);
    return { success: false, message: "Gagal membersihkan cache" };
  }
}
