// Relative path -> selalu hit domain sendiri (Vercel/APK webview),
// gak pernah nunjuk langsung ke URL backend cnest.
// Proxy-nya ada di app/api/proxy/[...path]/route.ts.
export const API_BASE_URL = "/api/proxy";
export const SITE_URL = "https://tsukinest.my.id";
export const ANILIST_API_URL = "https://graphql.anilist.co";
export const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
export const WSRV_CDN_URL = "https://wsrv.nl";
