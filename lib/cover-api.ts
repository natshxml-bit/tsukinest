const MANGADEX_API = "https://api.mangadex.org";
const MANGADEX_CDN = "https://uploads.mangadex.org/covers";
const CACHE_KEY = "tsukinest_cover_cache";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 hari

function getCache(): Record<string, { url: string; ts: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(title: string, url: string) {
  if (typeof window === "undefined") return;
  const cache = getCache();
  cache[title.toLowerCase().trim()] = { url, ts: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCached(title: string): string | null {
  const hit = getCache()[title.toLowerCase().trim()];
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) return null;
  return hit.url;
}

// Cek apakah thumb dari API utama kosong/broken
export function isThumbBroken(thumb: string | undefined): boolean {
  if (!thumb) return true;
  const t = thumb.toLowerCase();
  return t.includes("no-image") || t.includes("placehold") || t.includes("blank") || t === "";
}

// Fetch cover dari MangaDex → AniList
export async function fetchOpenSourceCover(title: string): Promise<string | null> {
  const cached = getCached(title);
  if (cached) return cached;

  try {
    // 1. MangaDex
    const res = await fetch(
      `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=3&includes[]=cover_art`,
      { signal: AbortSignal.timeout(4000) }
    );
    const json = await res.json();
    const manga = json.data?.[0];
    if (manga) {
      const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
      const fileName = cover?.attributes?.fileName;
      if (fileName) {
        const url = `${MANGADEX_CDN}/${manga.id}/${fileName}.512.jpg`;
        setCache(title, url);
        return url;
      }
    }
  } catch {
    // lanjut fallback
  }

  try {
    // 2. AniList
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query($s:String){Media(search:$s,type:MANGA){coverImage{large}}}`,
        variables: { s: title },
      }),
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json();
    const cover = json?.data?.Media?.coverImage?.large;
    if (cover) {
      setCache(title, cover);
      return cover;
    }
  } catch {
    // silent fail
  }

  return null;
}
