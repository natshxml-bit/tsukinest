// features/chapter/utils/reader.utils.ts
import type { Timestamp } from "firebase/firestore";

/** Force HTTPS on image URLs */
export const fixUrl = (url: string) =>
  url?.replace(/^http:\/\//i, "https://") || "";

/** Format a Firestore Timestamp to a localised date string */
export const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return "";
  try {
    return ts.toDate().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "";
  }
};

/**
 * Extract the series slug from a full chapter slug.
 * E.g. "bleach-chapter-100" → "bleach"
 */
export function extractSeriesSlug(chapterSlug: string): string {
  return chapterSlug.replace(/-(?:chapter|ch|bab)-?\d+(?:-\d+)?$/i, "");
}

/** Clean up a raw chapter navigation slug returned by the API */
export function cleanNavigationSlug(raw: string | null): string | null {
  if (!raw || raw === "null") return null;
  return raw.replace(/^\/+|\/+$/g, "").split("/").pop() || null;
}
