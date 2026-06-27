import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, ChevronRight, BookOpen } from "lucide-react";

const blogPosts: Record<string, any> = {
  "rekomendasi-manhwa-action-mc-overpowered": {
    title: "7 Manhwa Action dengan MC Overpowered yang Wajib Dibaca",
    date: "2026-06-26",
    readTime: "6 menit",
    category: "Rekomendasi",
    content: `
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Apakah Anda menyukai karakter utama yang kuat, tangguh, dan memuaskan untuk diikuti? Anda tidak sendirian! Genre action dengan tokoh utama yang overpowered (OP) memang menjadi favorit banyak pembaca manhwa. Mulai dari karakter yang awalnya lemah lalu berkembang menjadi sangat kuat, hingga yang memang sudah memiliki kekuatan luar biasa sejak awal, semuanya tersedia dalam daftar rekomendasi kami.</p>
      
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Kami telah merangkum <strong class="text-neutral-300">7 manhwa action terbaik dengan karakter utama overpowered</strong> yang wajib Anda baca. Dari yang sudah tamat hingga yang masih ongoing, setiap judul memiliki keunikan tersendiri. Mari kita bahas satu per satu!</p>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">1. Magic Academy's Genius Blinker</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="http://kacu.gmbr.pro/uploads/manga-images/m/magic-academys-genius-blinker/thumbnail.jpeg" alt="Magic Academy's Genius Blinker" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 100</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Manhwa ini menceritakan tentang seorang karakter yang memiliki kemampuan unik di akademi sihir. Tokoh utamanya sangat cerdas dan selalu selangkah lebih maju dari musuh-musuhnya. Bagi Anda yang menyukai setting akademi sihir seperti Harry Potter namun dalam versi manhwa Korea, judul ini sangat direkomendasikan!</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">2. Lookism</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="http://kacu.gmbr.pro/uploads/manga-images/l/lookism/thumbnail.jpg" alt="Lookism" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8.7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 613</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Lookism merupakan salah satu manhwa legendaris yang sangat populer. Kisah ini mengisahkan Park Hyung Suk yang awalnya menjadi korban perundungan karena fisiknya yang gemuk, namun tiba-tiba ia mendapatkan kemampuan untuk berpindah ke tubuh kedua yang sangat tampan dan kuat. Plot cerita semakin berkembang dari kehidupan sekolah menjadi aksi gangster yang epik.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">3. Solo Max-Level Newbie</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/s/solo-max-level-newbie/thumbnail.jpg" alt="Solo Max-Level Newbie" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8.75/10</span>
            <span class="text-neutral-500 text-xs">Chapter 265</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed mb-2"><strong class="text-neutral-300">Sinopsis:</strong> Jinhyuk, seorang YouTuber game, adalah satu-satunya orang yang telah melihat akhir dari game [Tower of Trials]. Namun, ketika popularitas game tersebut menurun, menjadi sulit baginya untuk terus mencari nafkah sebagai YouTuber game. Karena ia sudah mengetahui akhir permainan, ia memutuskan untuk berhenti bermain. Namun pada hari itu, [Tower of Trials] menjadi kenyataan, dan Jinhyuk, yang mengetahui setiap detail dalam game tersebut, mengambil alih segalanya lebih cepat daripada yang bisa dilakukan siapa pun!</p>
          <p class="text-neutral-400 text-xs leading-relaxed">Tokoh utamanya mengetahui semua rahasia game karena telah memainkannya hingga tamat. Ketika game tersebut menjadi kenyataan, ia langsung menjadi sangat kuat dan melakukan hal-hal yang tidak dapat dilakukan oleh orang lain.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">4. God-level Assassin, I'm the Shadow</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/g/god-level-assassin-im-the-shadow/thumbnail.jpg" alt="God-level Assassin" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 108</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Manhua China yang satu ini mengisahkan seorang pembunuh tingkat dewa yang bereinkarnasi ke dunia baru. Tokoh utamanya sangat ahli dalam seni pembunuhan dan selalu bergerak dari bayangan. Sangat cocok bagi Anda yang menyukai karakter utama yang misterius, dingin, dan selalu selangkah lebih maju dari musuh.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">5. Genius Martial Arts Trainer</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/g/genius-martial-arts-trainer/thumbnail.jpg" alt="Genius Martial Arts Trainer" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-neutral-500 text-xs">Chapter 116</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Tokoh utama dalam manhwa ini tidak hanya ahli dalam pertarungan, tetapi juga sangat terampil dalam melatih orang lain. Ia memiliki kemampuan untuk melihat potensi tersembunyi dari murid-muridnya dan melatih mereka menjadi petarung yang hebat.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-4 text-white tracking-tight">Kesimpulan</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-4">Itulah <strong class="text-neutral-300">5 manhwa action dengan karakter utama overpowered</strong> yang wajib Anda baca di tahun 2026. Mulai dari setting akademi sihir, kehidupan sekolah, hingga reinkarnasi, semuanya memiliki keunikan masing-masing.</p>
      
      <p class="text-neutral-400 text-sm leading-relaxed mb-4">Rekomendasi utama kami adalah <strong class="text-neutral-300">Solo Max-Level Newbie</strong> dan <strong class="text-neutral-300">Lookism</strong>. Keduanya memiliki plot yang menarik dan karakter utama yang sangat tangguh!</p>

      <div class="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mt-6">
        <h3 class="text-sm font-bold mb-2 text-white">🎯 Ingin Membaca Sekarang?</h3>
        <p class="text-neutral-500 text-xs mb-4 leading-relaxed">Semua manhwa di atas telah tersedia di TsukiNest dengan kualitas terjemahan terbaik dan update tercepat. Silakan mulai membaca sekarang juga!</p>
        <a href="/explore" class="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95">Jelajahi Manhwa di TsukiNest <ChevronRight class="w-3 h-3" /></a>
      </div>
    `,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return { title: "Artikel Tidak Ditemukan" };
  }

  const plain = post.content.replace(/<[^>]*>/g, "").substring(0, 160);

  return {
    title: post.title,
    description: plain,
    openGraph: {
      title: post.title,
      description: plain,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <article className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
        </Link>

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-3">
            <span className="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 px-2 py-0.5 rounded-md font-medium uppercase tracking-wide">
              {post.category}
            </span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(post.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight leading-snug">{post.title}</h1>
        </header>

        {/* Content */}
        <div className="text-neutral-400" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Share & CTA */}
        <div className="mt-8 bg-[#141414] border border-white/[0.05] rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold mb-1.5">Suka Artikel Ini?</h3>
          <p className="text-neutral-500 text-xs mb-4 leading-relaxed">
            Baca artikel lainnya atau langsung baca manhwa favorit Anda di TsukiNest!
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95"
            >
              Baca Artikel Lain
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 text-xs px-4 py-2.5 rounded-lg font-medium transition-colors active:scale-95"
            >
              Jelajahi Manhwa
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
