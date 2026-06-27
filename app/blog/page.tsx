// app/blog/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - Tips & Review Manhwa',
  description: 'Baca review, rekomendasi, dan tips seputar manhwa, manhua, dan manga terbaik di TsukiNest.',
};

// Data artikel
const blogPosts = [
  {
    slug: 'rekomendasi-manhwa-action-mc-overpowered',
    title: '7 Manhwa Action dengan MC Overpowered yang Wajib Dibaca',
    excerpt: 'Suka MC yang kuat dan badass? Ini dia rekomendasi manhwa action dengan MC OP yang bikin puas!',
    date: '2026-06-26',
    readTime: '6 menit',
    category: 'Rekomendasi',
    image: 'https://kacu.gmbr.pro/uploads/manga-images/s/solo-max-level-newbie/thumbnail.jpg',
  },
  {
    slug: 'panduan-pemula-tsukinest',
    title: 'Panduan Lengkap Membaca Manhwa di TsukiNest untuk Pemula',
    excerpt: 'Baru pertama kali dengar TsukiNest? Ini cara paling gampang buat nyari, nyimpen, dan baca komik favoritmu tanpa ribet.',
    date: '2026-06-25',
    readTime: '3 menit',
    category: 'Tutorial',
    image: 'https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Panduan+TsukiNest',
  },
  {
    slug: 'apa-itu-manhwa-dan-bedanya-dengan-manga',
    title: 'Apa Itu Manhwa? Kenali Perbedaan Manhwa, Manhua, dan Manga',
    excerpt: 'Sering ketuker bedanya komik Korea, China, dan Jepang? Yuk belajar bedanya biar makin paham pas baca di TsukiNest.',
    date: '2026-06-27',
    readTime: '4 menit',
    category: 'Edukasi',
    image: 'https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Manhwa+vs+Manga',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Blog TsukiNest
          </h1>
          <p className="text-gray-400 text-lg">
            Review, rekomendasi, dan tips seputar manhwa, manhua, dan manga
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group bg-gray-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-800 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>{new Date(post.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{post.readTime} baca</span>
                </div>
                
                <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-400 text-sm line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="mt-4 text-blue-400 text-sm font-semibold group-hover:underline">
                  Baca selengkapnya →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 text-center">
          <h3 className="text-2xl font-bold mb-2">Mau Request Artikel?</h3>
          <p className="text-gray-300 mb-4">
            Punya manhwa favorit yang mau direview? Hubungi kami!
          </p>
          <Link 
            href="/contact"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Hubungi Kami
          </Link>
        </div>
      </div>
    </main>
  );
}