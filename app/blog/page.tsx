import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, CalendarDays, ChevronRight, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Tips & Review Manhwa",
  description: "Baca review, rekomendasi, dan tips seputar manhwa, manhua, dan manga terbaik di TsukiNest.",
};

const blogPosts = [
  {
    slug: "rekomendasi-manhwa-action-mc-overpowered",
    title: "7 Manhwa Action dengan MC Overpowered yang Wajib Dibaca",
    excerpt: "Suka MC yang kuat dan badass? Ini dia rekomendasi manhwa action dengan MC OP yang bikin puas!",
    date: "2026-06-26",
    readTime: "6 menit",
    category: "Rekomendasi",
    image: "https://kacu.gmbr.pro/uploads/manga-images/s/solo-max-level-newbie/thumbnail.jpg",
  },
  {
    slug: "panduan-pemula-tsukinest",
    title: "Panduan Lengkap Membaca Manhwa di TsukiNest untuk Pemula",
    excerpt: "Baru pertama kali dengar TsukiNest? Ini cara paling gampang buat nyari, nyimpen, dan baca komik favoritmu tanpa ribet.",
    date: "2026-06-25",
    readTime: "3 menit",
    category: "Tutorial",
    image: "https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Panduan+TsukiNest",
  },
  {
    slug: "apa-itu-manhwa-dan-bedanya-dengan-manga",
    title: "Apa Itu Manhwa? Kenali Perbedaan Manhwa, Manhua, dan Manga",
    excerpt: "Sering ketuker bedanya komik Korea, China, dan Jepang? Yuk belajar bedanya biar makin paham pas baca di TsukiNest.",
    date: "2026-06-27",
    readTime: "4 menit",
    category: "Edukasi",
    image: "https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Manhwa+vs+Manga",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Blog TsukiNest</h1>
          <p className="text-neutral-500 text-sm">Review, rekomendasi, dan tips seputar komik</p>
        </div>

        {/* Blog Grid */}
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-[#141414] border border-white/[0.05] rounded-xl overflow-hidden active:scale-[0.98] transition-transform"
            >
              {/* Image */}
              <div className="relative h-44 bg-[#1c1c1c] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-[#1c1c1c]/90 backdrop-blur-sm border border-white/[0.06] text-neutral-300 text-[10px] px-2.5 py-1 rounded-md font-medium uppercase tracking-wide">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-2.5">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(post.date).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className="text-neutral-700">•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>

                <h2 className="text-sm font-semibold text-white group-hover:text-neutral-300 transition-colors line-clamp-2 leading-snug mb-2">
                  {post.title}
                </h2>

                <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed mb-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 group-hover:text-white transition-colors">
                  Baca selengkapnya <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-[#141414] border border-white/[0.05] rounded-xl p-5 text-center">
          <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">Mau Request Artikel?</h3>
          <p className="text-neutral-500 text-xs mb-4 leading-relaxed">
            Punya manhwa favorit yang mau direview? Hubungi kami!
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95"
          >
            Hubungi Kami
          </Link>
        </div>
      </div>
    </main>
  );
}
