// config/api.config.ts
// API endpoint configuration.
// This re-exports from constants/api.ts for a single source of truth,
// and adds any additional API-related configuration.

export {
  API_BASE_URL,
  SITE_URL,
  ANILIST_API_URL,
  IMGBB_UPLOAD_URL,
  WSRV_CDN_URL,
} from "@/constants/api";

/** Default ISR revalidation interval in seconds */
export const DEFAULT_REVALIDATE = 60;

/** Wsrv.nl image proxy parameters */
export const WSRV_DEFAULTS = {
  width: 600,
  format: "webp",
  quality: 85,
} as const;

/** Maximum chapters shown by default in ChapterList before "Show all" */
export const CHAPTER_PAGE_SIZE = 15;
