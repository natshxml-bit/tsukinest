// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Data artikel
const blogPosts: Record<string, any> = {
  'rekomendasi-manhwa-action-mc-overpowered': {
    title: '7 Manhwa Action dengan MC Overpowered yang Wajib Dibaca',
    date: '2026-06-26',
    readTime: '6 menit',
    category: 'Rekomendasi',
    content: `
      <p class="text-lg text-gray-300 mb-6">Apakah Anda menyukai karakter utama yang kuat, tangguh, dan memuaskan untuk diikuti? Anda tidak sendirian! Genre action dengan tokoh utama yang overpowered (OP) memang menjadi favorit banyak pembaca manhwa. Mulai dari karakter yang awalnya lemah lalu berkembang menjadi sangat kuat, hingga yang memang sudah memiliki kekuatan luar biasa sejak awal, semuanya tersedia dalam daftar rekomendasi kami.</p>
      
      <p class="text-gray-300 mb-6">Kami telah merangkum <strong>7 manhwa action terbaik dengan karakter utama overpowered</strong> yang wajib Anda baca. Dari yang sudah tamat hingga yang masih ongoing, setiap judul memiliki keunikan tersendiri. Mari kita bahas satu per satu!</p>

      <h2 class="text-3xl font-bold mt-10 mb-4 text-blue-400">1. Magic Academy's Genius Blinker</h2>
      <div class="flex gap-4 mb-4">
        <div class="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img src="http://kacu.gmbr.pro/uploads/manga-images/m/magic-academys-genius-blinker/thumbnail.jpeg" alt="Magic Academy's Genius Blinker" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-yellow-600 text-white text-xs px-2 py-1 rounded">⭐ 7/10</span>
            <span class="text-gray-500 text-sm">Chapter 100</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">Manhwa ini menceritakan tentang seorang karakter yang memiliki kemampuan unik di akademi sihir. Tokoh utamanya sangat cerdas dan selalu selangkah lebih maju dari musuh-musuhnya. Bagi Anda yang menyukai setting akademi sihir seperti Harry Potter namun dalam versi manhwa Korea, judul ini sangat direkomendasikan!</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold mt-10 mb-4 text-purple-400">2. Lookism</h2>
      <div class="flex gap-4 mb-4">
        <div class="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img src="http://kacu.gmbr.pro/uploads/manga-images/l/lookism/thumbnail.jpg" alt="Lookism" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-yellow-600 text-white text-xs px-2 py-1 rounded">⭐ 8.7/10</span>
            <span class="text-gray-500 text-sm">Chapter 613</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">Lookism merupakan salah satu manhwa legendaris yang sangat populer. Kisah ini mengisahkan Park Hyung Suk yang awalnya menjadi korban perundungan karena fisiknya yang gemuk, namun tiba-tiba ia mendapatkan kemampuan untuk berpindah ke tubuh kedua yang sangat tampan dan kuat. Plot cerita semakin berkembang dari kehidupan sekolah menjadi aksi gangster yang epik. Rating 8.7 pun masih terasa terlalu rendah menurut penilaian kami!</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold mt-10 mb-4 text-green-400">3. Solo Max-Level Newbie</h2>
      <div class="flex gap-4 mb-4">
        <div class="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/s/solo-max-level-newbie/thumbnail.jpg" alt="Solo Max-Level Newbie" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-yellow-600 text-white text-xs px-2 py-1 rounded">⭐ 8.75/10</span>
            <span class="text-gray-500 text-sm">Chapter 265</span>
            <span class="bg-red-600 text-white text-xs px-2 py-1 rounded">🔥 POPULER</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed mb-2"><strong>Sinopsis:</strong> Jinhyuk, seorang YouTuber game, adalah satu-satunya orang yang telah melihat akhir dari game [Tower of Trials]. Namun, ketika popularitas game tersebut menurun, menjadi sulit baginya untuk terus mencari nafkah sebagai YouTuber game. Karena ia sudah mengetahui akhir permainan, ia memutuskan untuk berhenti bermain. Namun pada hari itu, [Tower of Trials] menjadi kenyataan, dan Jinhyuk, yang mengetahui setiap detail dalam game tersebut, mengambil alih segalanya lebih cepat daripada yang bisa dilakukan siapa pun!</p>
          <p class="text-gray-300 text-sm leading-relaxed">Tokoh utamanya mengetahui semua rahasia game karena telah memainkannya hingga tamat. Ketika game tersebut menjadi kenyataan, ia langsung menjadi sangat kuat dan melakukan hal-hal yang tidak dapat dilakukan oleh orang lain. <em>"Saya akan menunjukkan kepada Anda seperti apa seorang profesional sejati."</em> - Sebuah kutipan yang sangat mengesankan!</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold mt-10 mb-4 text-red-400">4. God-level Assassin, I'm the Shadow</h2>
      <div class="flex gap-4 mb-4">
        <div class="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/g/god-level-assassin-im-the-shadow/thumbnail.jpg" alt="God-level Assassin" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-yellow-600 text-white text-xs px-2 py-1 rounded">⭐ 7/10</span>
            <span class="text-gray-500 text-sm">Chapter 108</span>
            <span class="bg-red-600 text-white text-xs px-2 py-1 rounded">🔥 POPULER</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">Manhua China yang satu ini mengisahkan seorang pembunuh tingkat dewa yang bereinkarnasi ke dunia baru. Tokoh utamanya sangat ahli dalam seni pembunuhan dan selalu bergerak dari bayangan. Sangat cocok bagi Anda yang menyukai karakter utama yang misterius, dingin, dan selalu selangkah lebih maju dari musuh. Aksi pertarungannya brutal dan sangat memuaskan!</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold mt-10 mb-4 text-cyan-400">5. Genius Martial Arts Trainer</h2>
      <div class="flex gap-4 mb-4">
        <div class="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/g/genius-martial-arts-trainer/thumbnail.jpg" alt="Genius Martial Arts Trainer" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-gray-500 text-sm">Chapter 116</span>
            <span class="bg-red-600 text-white text-xs px-2 py-1 rounded">🔥 POPULER</span>
          </div>
          <p class="text-gray-300 text-sm leading-relaxed">Tokoh utama dalam manhwa ini tidak hanya ahli dalam pertarungan, tetapi juga sangat terampil dalam melatih orang lain. Ia memiliki kemampuan untuk melihat potensi tersembunyi dari murid-muridnya dan melatih mereka menjadi petarung yang hebat. Setting seni bela dirinya sangat menarik, ditambah dengan unsur komedi yang membuat cerita tidak membosankan.</p>
        </div>
      </div>

      <h2 class="text-3xl font-bold mt-10 mb-6 text-white">Kesimpulan</h2>
      <p class="text-gray-300 mb-4">Itulah <strong>5 manhwa action dengan karakter utama overpowered</strong> yang wajib Anda baca di tahun 2026. Mulai dari setting akademi sihir, kehidupan sekolah, hingga reinkarnasi, semuanya memiliki keunikan masing-masing.</p>
      
      <p class="text-gray-300 mb-4">Rekomendasi utama kami adalah <strong>Solo Max-Level Newbie</strong> dan <strong>Lookism</strong>. Keduanya memiliki plot yang menarik dan karakter utama yang sangat tangguh!</p>

      <div class="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mt-8">
        <h3 class="text-xl font-bold mb-3">🎯 Ingin Membaca Sekarang?</h3>
        <p class="text-gray-300 mb-4">Semua manhwa di atas telah tersedia di TsukiNest dengan kualitas terjemahan terbaik dan update tercepat. Silakan mulai membaca sekarang juga!</p>
        <a href="/explore" class="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">Jelajahi Manhwa di TsukiNest →</a>
      </div>
    `,
  },
};

// generateMetadata dengan async params (Next.js 15/16)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];
  
  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan',
    };
  }

  return {
    title: post.title,
    description: post.content.replace(/<[^>]*>/g, '').substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.replace(/<[^>]*>/g, '').substring(0, 160),
      type: 'article',
      publishedTime: post.date,
    },
  };
}

// Component dengan async params (Next.js 15/16)
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/blog" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-semibold">
              {post.category}
            </span>
            <span>{new Date(post.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>•</span>
            <span>{post.readTime} baca</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {post.title}
          </h1>
        </header>

        {/* Content */}
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share & CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4">Suka Artikel Ini?</h3>
          <p className="text-gray-300 mb-4">
            Baca artikel lainnya atau langsung baca manhwa favorit Anda di TsukiNest!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/blog"
              className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Baca Artikel Lain
            </Link>
            <Link 
              href="/explore"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Jelajahi Manhwa
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}