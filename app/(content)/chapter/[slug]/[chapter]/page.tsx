// app/(content)/chapter/[slug]/[chapter]/page.tsx
// Server Component entry point for the chapter reader.
//
// URL params:
//   [slug]    = series slug  (e.g. "solo-leveling")
//   [chapter] = chapter slug (e.g. "solo-leveling-chapter-1") — passed to getRead() API

import type { Metadata } from "next";
import { ChapterReader } from "@/features/chapter/components/ChapterReader";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter } = await params;

  // Derive a human-readable chapter number from the slug
  const match = chapter.match(/(\d+(?:[.-]\d+)?)$/);
  const chapterNum = match ? match[1].replace("-", ".") : chapter;

  const title = `Bab ${chapterNum} | TsukiNest`;
  const description = `Baca chapter ${chapterNum} dari seri ${slug.replace(/-/g, " ")} di TsukiNest.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://tsukinest.my.id/chapter/${slug}/${chapter}`,
    },
    // Prevent reader pages from being indexed (avoid thin-content penalty)
    robots: { index: false, follow: false },
  };
}

export default function ChapterPage() {
  return <ChapterReader />;
}
