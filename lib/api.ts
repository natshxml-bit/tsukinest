const BASE_URL = "https://cnest.up.railway.app";

// ─── Types ───────────────────────────────────────────

export interface MangaItem {
  title: string;
  slug: string;
  thumb: string;
  type: string;
  latest_chapter: string;
  rating: string;
  link: string;
  is_colored: boolean;
  is_hot: boolean;
}

export interface HomeApiResponse {
  success: boolean;
  time_ms: number;
  cached: boolean;
  count: {
    popular: number;
    latest: number;
    project: number;
  };
  data: {
    popular_today: MangaItem[];
    latest_update: MangaItem[];
    project: MangaItem[];
  };
}

export interface UpdatesApiResponse {
  success: boolean;
  data: MangaItem[];
  pagination?: {
    current_page: number;
    total_pages: number;
  };
}

export interface GenreItem {
  name: string;
  slug: string;
  count?: number;
}

export interface GenresApiResponse {
  success: boolean;
  data: GenreItem[];
}

export interface LatestApiResponse {
  success: boolean;
  data: MangaItem[];
  pagination?: {
    current_page: number;
    total_pages: number;
  };
}

export interface Chapter {
  chapter: string;
  slug: string;
  release_date?: string;
  link?: string;
}

export interface DetailApiResponse {
  success: boolean;
  data: {
    title: string;
    slug: string;
    thumb: string;
    synopsis: string;
    status: string;
    type: string;
    rating: string;
    authors?: string[];
    artists?: string[];
    genres?: string[];
    chapters: Chapter[];
  };
}

export interface ReadApiResponse {
  success: boolean;
  data: {
    title: string;
    chapter: string;
    images: string[];
    prev_chapter?: string | null;
    next_chapter?: string | null;
  };
}

export interface SearchApiResponse {
  success: boolean;
  data: MangaItem[];
}

export interface FilterApiResponse {
  success: boolean;
  data: MangaItem[];
  pagination?: {
    current_page: number;
    total_pages: number;
  };
}

// ─── Fetcher Helper ──────────────────────────────────
async function fetcher<T>(url: string): Promise<T | null> {
  try {
    // Memastikan URL valid. Kalau BASE_URL kosong, otomatis pakai relative path
    const fullUrl = BASE_URL ? `${BASE_URL}${url}` : url;
    
    // 🔥 FIX: Hapus opsi cache khusus Server Components biar aman jalan di useEffect
    const res = await fetch(fullUrl);

    if (!res.ok) {
      console.warn(`[API Warn] ${fullUrl} returned HTTP ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${BASE_URL}${url}:`, err);
    return null;
  }
}

// ─── API Functions ───────────────────────────────────

/** GET /api/home */
export async function getHome(): Promise<HomeApiResponse | null> {
  return fetcher<HomeApiResponse>("/api/home");
}

/** GET /api/updates?page=1 */
export async function getUpdates(page = 1): Promise<UpdatesApiResponse | null> {
  return fetcher<UpdatesApiResponse>(`/api/updates?page=${page}`);
}

/** GET /api/genres */
export async function getGenres(): Promise<GenresApiResponse | null> {
  return fetcher<GenresApiResponse>("/api/genres");
}

/** GET /api/genre/:slug?page=1 */
export async function getGenre(
  slug: string,
  page = 1
): Promise<LatestApiResponse | null> {
  return fetcher<LatestApiResponse>(`/api/genre/${slug}?page=${page}`);
}

/** GET /api/latest?page=1 */
export async function getLatest(page = 1): Promise<LatestApiResponse | null> {
  return fetcher<LatestApiResponse>(`/api/latest?page=${page}`);
}

/** GET /api/detail/:slug */
export async function getDetail(slug: string): Promise<DetailApiResponse | null> {
  return fetcher<DetailApiResponse>(`/api/detail/${slug}`);
}

/** GET /api/read/:slug */
export async function getRead(slug: string): Promise<ReadApiResponse | null> {
  return fetcher<ReadApiResponse>(`/api/read/${slug}`);
}

/** GET /api/search?q=keyword */
export async function searchManga(q: string): Promise<SearchApiResponse | null> {
  return fetcher<SearchApiResponse>(`/api/search?q=${encodeURIComponent(q)}`);
}

/** GET /api/filter?status=ongoing&type=manhwa&order=popular&page=1&genre=action */
export async function filterManga(params: {
  status?: string;
  type?: string;
  order?: string;
  genre?: string;
  page?: number;
}): Promise<FilterApiResponse | null> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  if (params.order) qs.set("order", params.order);
  if (params.genre) qs.set("genre", params.genre); 
  if (params.page) qs.set("page", String(params.page));
  return fetcher<FilterApiResponse>(`/api/filter?${qs.toString()}`);
}

/** GET /api/health */
export async function getHealth(): Promise<{ status: string } | null> {
  return fetcher<{ status: string }>("/api/health");
}

/** POST /api/cache/clear */
export async function clearCache(): Promise<{ success: boolean } | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/cache/clear`, {
      method: "POST",
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[API Warn] clear-cache returned HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[API Error] clear-cache:", err);
    return null;
  }
}
