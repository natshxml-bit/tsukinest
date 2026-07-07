export function fixUrl(url: string): string {
  if (!url) return "";
  return url.replace(/^http:\/\//i, "https://").replace(/([^:]\/)\/+/g, "$1");
}

export function cleanThumb(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = url;
  if (finalUrl.includes("<")) {
    const match = finalUrl.match(/src=["']([^"']+)["']/i);
    if (match) finalUrl = match[1];
  }
  return fixUrl(finalUrl);
}

export function cleanThumbWithProxy(url: string): string {
  if (!url) return "/no-image.png";
  let finalUrl = cleanThumb(url);

  if (finalUrl.startsWith("http") && !finalUrl.includes("wsrv.nl") && !finalUrl.includes("kitsu.io")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(finalUrl)}&w=400&output=webp&q=70`;
  }
  return finalUrl;
}

export function getOriginalUrl(url: string): string {
  if (!url) return "";
  try {
    if (url.includes("wsrv.nl")) {
      const urlObj = new URL(url);
      const originalUrl = urlObj.searchParams.get("url");
      if (originalUrl) return fixUrl(decodeURIComponent(originalUrl));
    }
  } catch {
    // ignore
  }
  return cleanThumb(url);
}
