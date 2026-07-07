export function formatMangaType(rawType: string): string {
  if (!rawType) return "MANGA";
  const typeUpper = rawType.toUpperCase();
  if (typeUpper.includes("MANHWA")) return "🇰🇷 " + typeUpper;
  if (typeUpper.includes("MANHUA")) return "🇨🇳 " + typeUpper;
  if (typeUpper.includes("MANGA")) return "🇯🇵 " + typeUpper;
  return typeUpper;
}

export function getGreeting(): { text: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Selamat Pagi", icon: "☀️" };
  if (hour >= 12 && hour < 15) return { text: "Selamat Siang", icon: "🌤️" };
  if (hour >= 15 && hour < 18) return { text: "Selamat Sore", icon: "🌅" };
  return { text: "Selamat Malam", icon: "🌙" };
}

export function timeAgo(date: Date | { toDate: () => Date } | number | null): string {
  if (!date) return "Baru saja";
  const now = new Date();
  let past: Date;
  if (typeof date === "number") {
    past = new Date(date);
  } else if ("toDate" in date) {
    past = date.toDate();
  } else {
    past = date;
  }
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

export function getRelativeTime(timestamp?: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt`;
  if (h < 24) return `${h} jam`;
  if (d < 30) return `${d} hr`;
  if (d < 365) return `${Math.floor(d / 30)} bln`;
  return `${Math.floor(d / 365)} thn`;
}
