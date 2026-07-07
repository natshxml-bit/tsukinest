// app/(content)/manga/[slug]/page.tsx
// Server Component entry point.
// Generates metadata server-side; delegates all UI to the feature component.

import type { Metadata } from "next";
import { fetchMangaDetail } from "@/features/manga/services/manga.service";
import { MangaDetail } from "@/features/manga/components/MangaDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchMangaDetail(slug).catch(() => null);

  const title = data?.title
    ? `${data.title} | TsukiNest`
    : "Baca Manga | TsukiNest";

  const description = data?.synopsis
    ? data.synopsis.slice(0, 155).replace(/\s+$/, "") + "…"
    : "Baca manhwa, manhua, dan manga bahasa Indonesia di TsukiNest.";

  const image = data?.thumb || "/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 600, alt: data?.title ?? "TsukiNest" }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://tsukinest.my.id/manga/${slug}`,
    },
  };
}

export default function MangaDetailPage() {
  return <MangaDetail />;
}
