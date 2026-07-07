import { API_BASE_URL } from "@/constants/api";
import { cleanThumb } from "@/utils/image";
import type { MangaItem, MangaDetail, ChapterItem } from "@/types/manga";

function transformItem(item: Record<string, unknown>): MangaItem {
  const thumb = typeof item.thumb === "string" ? item.thumb : "";
  const badgesArr = Array.isArray(item.badges) ? (item.badges as string[]) : [];
  return {
    title: typeof item.title === "string" ? item.title : "Untitled",
    slug: typeof item.slug === "string" ? item.slug : "",
    thumb: cleanThumb(thumb),
    type:
      typeof item.type === "string"
        ? item.type.split(/\s+/)[0]
        : "MANHWA",
    latest_chapter:
      typeof item.chapter === "string"
        ? item.chapter
        : typeof item.latest_chapter === "string"
          ? item.latest_chapter
          : "Ch. ?",
    rating: item.rating ? String(item.rating) : "0",
    link: typeof item.link === "string" ? item.link : "",
    is_colored: badgesArr.includes("color"),
    is_hot: badgesArr.includes("hot"),
    synopsis: typeof item.synopsis === "string" ? item.synopsis : "",
    genres: Array.isArray(item.genres) ? (item.genres as string[]) : [],
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export async function getPopular(page = 1): Promise<{ data: MangaItem[]; total?: number }> {
  try {
    const raw = await apiFetch<{ data?: unknown[]; results?: unknown[]; total?: number }>(
      `/manga/popular?page=${page}`
    );
    const items = raw.data || raw.results || [];
    return { data: items.map((i) => transformItem(i as Record<string, unknown>)), total: raw.total };
  } catch {
    return { data: [] };
  }
}

export async function getLatest(page = 1): Promise<{ data: MangaItem[] }> {
  try {
    const raw = await apiFetch<{ data?: unknown[] }>(`/manga/latest?page=${page}`);
    return { data: (raw.data || []).map((i) => transformItem(i as Record<string, unknown>)) };
  } catch {
    return { data: [] };
  }
}

export async function getAll(page = 1): Promise<{ data: MangaItem[]; total?: number }> {
  try {
    const raw = await apiFetch<{ data?: unknown[]; total?: number }>(`/manga/all?page=${page}`);
    return { data: (raw.data || []).map((i) => transformItem(i as Record<string, unknown>)), total: raw.total };
  } catch {
    return { data: [] };
  }
}

export async function searchManga(query: string): Promise<MangaItem[]> {
  try {
    const raw = await apiFetch<{ data?: unknown[] }>(`/manga/search?q=${encodeURIComponent(query)}`);
    return (raw.data || []).map((i) => transformItem(i as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getDetail(slug: string): Promise<MangaDetail | null> {
  try {
    const raw = await apiFetch<Record<string, unknown>>(`/manga/${slug}`);
    const genreRaw = Array.isArray(raw.genres) ? raw.genres : [];
    const chaptersRaw = Array.isArray(raw.chapters) ? raw.chapters : [];
    const authorsRaw = Array.isArray(raw.authors)
      ? raw.authors
      : typeof raw.author === "string"
        ? [raw.author]
        : [];
    return {
      title: typeof raw.title === "string" ? raw.title : "Untitled",
      alternative_title: typeof raw.alternative_title === "string" ? raw.alternative_title : undefined,
      thumb: cleanThumb(typeof raw.thumb === "string" ? raw.thumb : ""),
      rating: raw.rating ? String(raw.rating) : undefined,
      status: typeof raw.status === "string" ? raw.status : undefined,
      type: typeof raw.type === "string" ? raw.type : undefined,
      author: authorsRaw[0] ?? (typeof raw.author === "string" ? raw.author : undefined),
      authors: authorsRaw as string[],
      genres: genreRaw as string[],
      synopsis: typeof raw.synopsis === "string" ? raw.synopsis : "",
      chapters: chaptersRaw.map((c, i) => {
        const ch = c as Record<string, unknown>;
        return {
          index: i,
          chapter_url: typeof ch.chapter_url === "string" ? ch.chapter_url : undefined,
          chapter_number: typeof ch.chapter_number === "string" ? ch.chapter_number : `Ch. ${i + 1}`,
          release_date: typeof ch.release_date === "string" ? ch.release_date : undefined,
          slug: typeof ch.slug === "string" ? ch.slug : "",
          views: typeof ch.views === "string" ? ch.views : undefined,
        } as ChapterItem;
      }),
      views: typeof raw.views === "string" ? raw.views : undefined,
      followers: typeof raw.followers === "string" ? raw.followers : undefined,
      release_year: typeof raw.release_year === "string" ? raw.release_year : undefined,
      total_chapters: typeof raw.total_chapters === "number" ? raw.total_chapters : chaptersRaw.length,
      updated_at: typeof raw.updated_at === "string" ? raw.updated_at : undefined,
    };
  } catch {
    return null;
  }
}

export async function getChapterPages(slug: string): Promise<string[]> {
  try {
    const raw = await apiFetch<{ data?: unknown[]; pages?: unknown[] }>(`/chapter/${slug}`);
    const pages = raw.data || raw.pages || [];
    return pages.filter((p): p is string => typeof p === "string");
  } catch {
    return [];
  }
}

export async function getMangaByGenre(genre: string, page = 1): Promise<{ data: MangaItem[]; total?: number }> {
  try {
    const raw = await apiFetch<{ data?: unknown[]; total?: number }>(
      `/manga/genre/${encodeURIComponent(genre)}?page=${page}`
    );
    return {
      data: (raw.data || []).map((i) => transformItem(i as Record<string, unknown>)),
      total: raw.total,
    };
  } catch {
    return { data: [] };
  }
}

export async function getExploreData(): Promise<{
  popular: MangaItem[];
  latest: MangaItem[];
}> {
  const [popularRes, latestRes] = await Promise.allSettled([getPopular(), getLatest()]);
  return {
    popular: popularRes.status === "fulfilled" ? popularRes.value.data.slice(0, 20) : [],
    latest: latestRes.status === "fulfilled" ? latestRes.value.data.slice(0, 20) : [],
  };
}
