import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, ChevronRight, BookOpen } from "lucide-react";

// 1. Definisikan tipe data yang ketat untuk keamanan TypeScript
interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
}

// 2. Definisikan PageProps standar Next.js 15 (params adalah Promise)
interface PageProps {
  params: Promise<{ slug: string }>;
}

const blogPosts: Record<string, BlogPost> = {
  // ═══════════════════════════════════════════════════
  // ARTIKEL 1: ACTION MC OVERPOWERED
  // ═══════════════════════════════════════════════════
  "rekomendasi-manhwa-action-mc-overpowered": {
    title: "7 Manhwa Action dengan MC Overpowered yang Wajib Dibaca",
    date: "2026-06-26",
    readTime: "6 menit",
    category: "Rekomendasi",
    content: `
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Apakah Anda menyukai karakter utama yang kuat, tangguh, dan memuaskan untuk diikuti? Genre action dengan tokoh utama yang overpowered (OP) memang menjadi favorit banyak pembaca manhwa. Berikut adalah 7 rekomendasi terbaik yang tersedia di TsukiNest.</p>
      
      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">1. Lookism</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/l/lookism/thumbnail.jpg" alt="Lookism" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8.7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 613</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Manhwa legendaris karya Park Tae Joon ini mengisahkan Park Hyung Suk, seorang remaja yang kelebihan berat badan dan sering menjadi korban perundungan. Namun, keajaiban terjadi ketika ia mendapatkan tubuh kedua yang sangat tampan dan kuat. Plot cerita berkembang dari kehidupan sekolah menjadi aksi gangster yang sangat epik.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">2. Magic Emperor (Kaisar Sihir)</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/m/magic-emperor/thumbnail.jpeg" alt="Magic Emperor" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8.5/10</span>
            <span class="text-neutral-500 text-xs">Chapter 874</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Zhuo Yifan adalah seorang kaisar sihir yang memiliki buku kuno "Sembilan Rahasia". Setelah dikhianati dan dibunuh oleh muridnya sendiri, jiwanya bereinkarnasi ke dalam tubuh Zhuo Fan, seorang pelayan keluarga. Dengan pengetahuan dan kekuatan masa lalunya, ia membangun kembali kejayaannya dari titik terendah.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">3. The Beginning After the End</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/t/the-beginning-after-the-end-the-king-grey-reincarnation/thumbnail.webp" alt="The Beginning After the End" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8.7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 241</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">King Grey, raja terkuat di dunia yang penuh konflik, bereinkarnasi ke dunia sihir dan monster sebagai Arthur Leywin. Dengan ingatan dan pengalamannya yang luar biasa, ia memulai kehidupan baru untuk melindungi orang-orang yang ia cintai dari takdir yang kelam.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">4. God-level Assassin, I'm the Shadow</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/g/god-level-assassin-im-the-shadow/thumbnail.jpg" alt="God-level Assassin" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 108</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Manhua China yang mengisahkan seorang pembunuh tingkat dewa yang bereinkarnasi ke dunia baru. Tokoh utamanya sangat ahli dalam seni pembunuhan dan selalu bergerak dari bayangan. Sangat cocok bagi Anda yang menyukai karakter utama yang misterius, dingin, dan selalu selangkah lebih maju dari musuh.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">5. Killer Peter</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/k/killer-peter/thumbnail.jpg" alt="Killer Peter" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 137</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Kolaborasi antara author White Blood dan How to Fight ini bercerita tentang seorang pembunuh legendaris yang telah lama pensiun. Ketika masa lalunya kembali menghantui, ia harus membuktikan bahwa dirinya masih yang terkuat. "Kalau begitu, akulah yang terkuat!"</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">6. Full-Time Awakening</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/f/full-time-awakening/thumbnail.jpg" alt="Full-Time Awakening" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 118</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Bai Yi, kapten Legiun Divine dan Awakener terkuat, dikhianati oleh kawannya sendiri. Setelah menyaksikan semua rekan satu timnya tewas, ia terlahir kembali 20 tahun yang lalu. Dengan pengetahuan masa depan, ia bertekad menyelamatkan mereka dan menggulingkan sistem pemerintahan yang korup.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">7. Return of the Mad Demon</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/r/return-of-the-mad-demon/thumbnail.jpg" alt="Return of the Mad Demon" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-neutral-500 text-xs">Chapter 202</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Iblis Gila yang telah mencapai puncak kekuatan bela diri kembali ke masa lalu. Dengan pengalaman ribuan tahun dan pengetahuan yang tak tertandingi, ia memulai perjalanan baru untuk membalas dendam dan menjadi yang terkuat sekali lagi. Salah satu manhwa cultivation terbaik!</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-4 text-white tracking-tight">Kesimpulan</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-4">Itulah <strong class="text-neutral-300">7 manhwa action dengan karakter utama overpowered</strong> yang wajib Anda baca di tahun 2026. Mulai dari reinkarnasi, pembunuh legendaris, hingga cultivation, semuanya memiliki keunikan masing-masing.</p>
      
      <p class="text-neutral-400 text-sm leading-relaxed mb-4">Rekomendasi utama kami adalah <strong class="text-neutral-300">Lookism</strong> dan <strong class="text-neutral-300">The Beginning After the End</strong> dengan rating 8.7/10. Keduanya memiliki plot yang menarik dan karakter utama yang sangat tangguh!</p>

      <div class="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mt-6">
        <h3 class="text-sm font-bold mb-2 text-white">🎯 Ingin Membaca Sekarang?</h3>
        <p class="text-neutral-500 text-xs mb-4 leading-relaxed">Semua manhwa di atas telah tersedia di TsukiNest dengan kualitas terjemahan terbaik dan update tercepat. Silakan mulai membaca sekarang juga!</p>
        <a href="/all" class="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95">Jelajahi Manhwa di TsukiNest <ChevronRight class="w-3 h-3" /></a>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════
  // ARTIKEL 2: TUTORIAL PEMULA
  // ═══════════════════════════════════════════════════
  "panduan-membaca-manhwa-di-tsukinest": {
    title: "Panduan Lengkap Membaca Manhwa di TsukiNest untuk Pemula",
    date: "2026-06-28",
    readTime: "4 menit",
    category: "Tutorial",
    content: `
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Selamat datang di TsukiNest! Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap. Bagi Anda yang baru pertama kali mengunjungi website kami, berikut adalah panduan lengkap untuk memulai petualangan komik Anda.</p>
      
      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">1. Menemukan Komik Favorit</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Anda dapat menemukan komik dengan beberapa cara mudah:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Gunakan fitur <strong class="text-neutral-300">Pencarian (Search)</strong> di bagian atas jika Anda sudah mengetahui judulnya</li>
        <li>Jelajahi halaman <strong class="text-neutral-300">All Series</strong> dengan fitur filter lengkap untuk menemukan komik berdasarkan genre, tipe, dan status</li>
        <li>Buka halaman <strong class="text-neutral-300">Latest</strong> untuk melihat update chapter terbaru</li>
        <li>Cek halaman <strong class="text-neutral-300">Popular</strong> untuk melihat komik yang paling banyak dibaca seperti Lookism dan Magic Emperor</li>
      </ul>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">2. Memahami Informasi Komik</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Setiap halaman detail komik menyediakan informasi penting seperti:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li><strong class="text-neutral-300">Sinopsis</strong> - Ringkasan cerita untuk memahami plot</li>
        <li><strong class="text-neutral-300">Rating</strong> - Penilaian dari pembaca lain (skala 1-10)</li>
        <li><strong class="text-neutral-300">Status</strong> - Ongoing (masih berlanjut) atau Completed (sudah tamat)</li>
        <li><strong class="text-neutral-300">Daftar Chapter</strong> - Semua episode yang tersedia</li>
        <li><strong class="text-neutral-300">Badge HOT/NEW</strong> - Penanda komik populer atau terbaru</li>
      </ul>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">3. Mode Baca yang Nyaman</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">TsukiNest menyediakan mode baca vertikal (webtoon style) yang sangat nyaman untuk dinikmati di perangkat mobile. Anda juga dapat mengaktifkan mode gelap (dark mode) untuk mengurangi ketegangan mata saat membaca di malam hari. Fitur scroll otomatis juga tersedia untuk pengalaman membaca yang lebih hands-free.</p>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">4. Fitur Library dan Bookmark</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Jangan lupa untuk menambahkan komik favorit Anda ke <strong class="text-neutral-300">Library</strong>. Fitur ini akan:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Menyimpan progres baca Anda secara otomatis</li>
        <li>Memberikan notifikasi ketika chapter terbaru dirilis</li>
        <li>Memudahkan Anda menemukan komik favorit dengan cepat</li>
        <li>Melanjutkan baca dari chapter terakhir yang dibaca</li>
      </ul>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">5. Tips Membaca di TsukiNest</h2>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Baca sinopsis terlebih dahulu untuk memastikan genre sesuai selera Anda</li>
        <li>Cek rating dan review dari pembaca lain sebelum mulai membaca</li>
        <li>Gunakan koneksi internet yang stabil untuk loading gambar yang lebih cepat</li>
        <li>Aktifkan notifikasi agar tidak ketinggalan update chapter terbaru</li>
        <li>Coba fitur "Random Pick" untuk menemukan komik baru secara acak</li>
      </ul>

      <div class="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mt-6">
        <h3 class="text-sm font-bold mb-2 text-white">🎯 Siap Memulai Petualangan?</h3>
        <p class="text-neutral-500 text-xs mb-4 leading-relaxed">Ribuan judul komik menanti Anda. Selamat membaca dan menikmati pengalaman terbaik di TsukiNest!</p>
        <a href="/all" class="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95">Mulai Baca Sekarang <ChevronRight class="w-3 h-3" /></a>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════
  // ARTIKEL 3: EDUKASI PERBEDAAN MANHWA/MANHUA/MANGA
  // ═══════════════════════════════════════════════════
  "perbedaan-manhwa-manhua-manga": {
    title: "Apa Itu Manhwa? Kenali Perbedaan Manhwa, Manhua, dan Manga",
    date: "2026-06-29",
    readTime: "5 menit",
    category: "Edukasi",
    content: `
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Dunia komik Asia sangat luas dan beragam. Seringkali pembaca pemula bingung membedakan antara Manga, Manhwa, dan Manhua. Padahal, ketiganya memiliki karakteristik, asal negara, dan gaya cerita yang sangat berbeda. Mari kita bahas satu per satu untuk membantu Anda memahami perbedaan mendasar di antara mereka.</p>
      
      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">1. Manga (Jepang 🇯🇵)</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Manga adalah komik yang berasal dari Jepang. Ciri khas utamanya adalah:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Dibaca dari <strong class="text-neutral-300">kanan ke kiri</strong> (berlawanan dengan buku Barat)</li>
        <li>Sebagian besar dicetak <strong class="text-neutral-300">hitam putih</strong> (kecuali beberapa halaman warna di awal)</li>
        <li>Memiliki gaya seni yang sangat ikonik dengan mata karakter yang besar dan ekspresif</li>
        <li>Biasanya dirilis secara berkala di majalah mingguan atau bulanan seperti Weekly Shonen Jump</li>
        <li>Genre sangat beragam: Shonen (anak laki-laki), Shojo (anak perempuan), Seinen (dewasa), dll</li>
      </ul>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Di TsukiNest, contoh manga populer termasuk <strong class="text-neutral-300">Batsu Harem</strong>, <strong class="text-neutral-300">Tougen Anki</strong>, dan <strong class="text-neutral-300">Death Penalty</strong>.</p>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">2. Manhwa (Korea Selatan 🇰🇷)</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Manhwa adalah komik asal Korea Selatan. Perbedaan paling mencolok dengan manga adalah:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Format <strong class="text-neutral-300">vertikal (scroll ke bawah)</strong>, sangat cocok untuk dibaca di smartphone</li>
        <li>Hampir selalu <strong class="text-neutral-300">berwarna penuh (full color)</strong> dengan kualitas gambar tinggi</li>
        <li>Sering diadaptasi dari Web Novel Korea yang populer</li>
        <li>Genre yang mendominasi: Action, Fantasy, Romance, School Life, Reinkarnasi</li>
        <li>Banyak mengangkat tema "dungeon", "leveling system", dan "overpowered MC"</li>
      </ul>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Di TsukiNest, contoh manhwa populer termasuk <strong class="text-neutral-300">Lookism</strong>, <strong class="text-neutral-300">The Beginning After the End</strong>, dan <strong class="text-neutral-300">Killer Peter</strong>.</p>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">3. Manhua (Tiongkok 🇨🇳)</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Manhua berasal dari Tiongkok. Sama seperti Manhwa, Manhua modern juga memiliki format vertikal dan berwarna penuh. Ciri khas Manhua:</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Sangat terkenal dengan genre <strong class="text-neutral-300">Cultivation, Martial Arts (Wuxia/Xianxia)</strong></li>
        <li>Sering mengangkat tema sistem game, reinkarnasi, dan perjalanan menjadi dewa</li>
        <li>Gaya seninya seringkali sangat detail dengan latar belakang yang megah</li>
        <li>Banyak mengadaptasi dari novel web China (seperti dari platform Qidian)</li>
        <li>MC seringkali memulai dari titik terendah lalu menjadi sangat kuat</li>
      </ul>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Di TsukiNest, contoh manhua populer termasuk <strong class="text-neutral-300">Magic Emperor</strong>, <strong class="text-neutral-300">God-level Assassin</strong>, dan <strong class="text-neutral-300">Full-Time Awakening</strong>.</p>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">Perbandingan Singkat</h2>
      <div class="overflow-x-auto mb-5">
        <table class="w-full text-xs text-neutral-400 border border-white/[0.06] rounded-lg overflow-hidden">
          <thead class="bg-[#1c1c1c]">
            <tr>
              <th class="px-3 py-2 text-left text-neutral-300">Aspek</th>
              <th class="px-3 py-2 text-left text-neutral-300">Manga</th>
              <th class="px-3 py-2 text-left text-neutral-300">Manhwa</th>
              <th class="px-3 py-2 text-left text-neutral-300">Manhua</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-white/[0.06]">
              <td class="px-3 py-2 font-medium text-neutral-300">Asal</td>
              <td class="px-3 py-2">Jepang</td>
              <td class="px-3 py-2">Korea</td>
              <td class="px-3 py-2">Tiongkok</td>
            </tr>
            <tr class="border-t border-white/[0.06]">
              <td class="px-3 py-2 font-medium text-neutral-300">Warna</td>
              <td class="px-3 py-2">Hitam Putih</td>
              <td class="px-3 py-2">Full Color</td>
              <td class="px-3 py-2">Full Color</td>
            </tr>
            <tr class="border-t border-white/[0.06]">
              <td class="px-3 py-2 font-medium text-neutral-300">Format</td>
              <td class="px-3 py-2">Kanan-Kiri</td>
              <td class="px-3 py-2">Vertikal</td>
              <td class="px-3 py-2">Vertikal</td>
            </tr>
            <tr class="border-t border-white/[0.06]">
              <td class="px-3 py-2 font-medium text-neutral-300">Genre Khas</td>
              <td class="px-3 py-2">Shonen/Shojo</td>
              <td class="px-3 py-2">Action/Romance</td>
              <td class="px-3 py-2">Cultivation</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">Kesimpulan</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Secara singkat: <strong class="text-neutral-300">Manga</strong> (Jepang, hitam putih, kanan-ke-kiri), <strong class="text-neutral-300">Manhwa</strong> (Korea, warna, vertikal), dan <strong class="text-neutral-300">Manhua</strong> (Tiongkok, warna, vertikal, tema kultivasi). Di TsukiNest, Anda bisa menemukan ketiga jenis komik ini dengan mudah!</p>

      <div class="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mt-6">
        <h3 class="text-sm font-bold mb-2 text-white">🎯 Temukan Semua Jenis Komik di Sini</h3>
        <p class="text-neutral-500 text-xs mb-4 leading-relaxed">Tidak perlu pindah website. TsukiNest menyediakan koleksi terlengkap untuk Manga, Manhwa, dan Manhua.</p>
        <a href="/all" class="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95">Lihat Semua Koleksi <ChevronRight class="w-3 h-3" /></a>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════
  // ARTIKEL 4: ROMANCE (FIX: link ke /all?genre=romance)
  // ═══════════════════════════════════════════════════
  "rekomendasi-manhwa-romance-terbaik-2026": {
    title: "10 Rekomendasi Manhwa Romance Terbaik yang Bikin Baper 2026",
    date: "2026-06-30",
    readTime: "7 menit",
    category: "Rekomendasi",
    content: `
      <p class="text-sm text-neutral-400 leading-relaxed mb-5">Genre romance selalu menjadi primadona di dunia komik. Kisah cinta yang manis, penuh konflik, dan terkadang membuat hati berdebar-debar (baper) selalu berhasil mencuri perhatian pembaca. Berikut adalah rekomendasi manhwa romance terbaik yang tersedia di TsukiNest tahun ini.</p>
      
      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">1. Affordable Romance</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://i0.wp.com/www.manhwaindo.my/wp-content/uploads/2026/05/1779711467-8854-i507676.jpg" alt="Affordable Romance" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 8/10</span>
            <span class="text-neutral-500 text-xs">Chapter 26</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Eunseol, yang bekerja sebagai akuntan di sebuah kantor pinjaman di kawasan pusat kota tua, tiba-tiba berhadapan langsung dengan seorang pria yang berbahaya namun memikat: Choi Woo-kyung. Kisah cinta yang tidak terduga antara wanita biasa dan pria misterius.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">2. How Can You Pay Back The Kindness I Raised With Obsession?</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/h/how-can-you-pay-back-the-kindness-i-raised-with-obsession/thumbnail.jpeg" alt="How Can You Pay Back" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7.7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 36</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Seorang wanita yang telah membesarkan seseorang dengan penuh kasih sayang, kini harus menghadapi obsesi yang tidak sehat. Drama psikologis yang mendalam dengan bumbu romance yang bikin baper.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">3. I Received a Request from the Villain Boss</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/i/i-received-a-request-from-the-villain-boss/thumbnail.webp" alt="I Received a Request" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7/10</span>
            <span class="text-neutral-500 text-xs">Chapter 12</span>
            <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium">✨ BARU</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Tokoh utama menerima permintaan misterius dari bos villain. Perpaduan sempurna antara genre Fantasy dan Romance dengan chemistry yang sangat menarik antara kedua karakter utamanya.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">4. Looking for the Villainess's Contract Husband</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/l/looking-for-the-villainesss-contract-husband/thumbnail.jpg" alt="Looking for the Villainess" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-neutral-500 text-xs">Chapter 16</span>
            <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium">✨ BARU</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Tropes klasik yang tidak pernah gagal! Pernikahan kontrak antara villainess dan suaminya, namun perlahan-lahan perasaan nyata mulai tumbuh. Persiapan untuk membaca tisu karena cerita ini sangat menyentuh.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">5. The Thrilling Temptation of a Boyfriend</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://i2.wp.com/www.manhwaindo.my/wp-content/uploads/2026/05/1779737458-3073-i485990.jpg" alt="The Thrilling Temptation" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7.4/10</span>
            <span class="text-neutral-500 text-xs">Chapter 26</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Godaan mendebarkan dari seorang pacar yang penuh misteri. Romance dewasa dengan plot twist yang membuat Anda tidak bisa berhenti membaca sampai chapter terakhir.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">6. The Baby Fairy is a Villain</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/t/the-baby-fairy-is-a-villain/thumbnail.webp" alt="The Baby Fairy" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7.85/10</span>
            <span class="text-neutral-500 text-xs">Chapter 62</span>
            <span class="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-medium">🔥 POPULER</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Seorang peri bayi yang ternyata adalah villain! Kisah unik yang menggabungkan elemen fantasy dengan romance. Rating 7.85/10 membuktikan kualitas cerita yang luar biasa.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">7. I Became the Most Terrifying Stepmother in History?!</h2>
      <div class="flex gap-3 mb-4">
        <div class="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-[#1c1c1c] border border-white/[0.06]">
          <img src="https://kacu.gmbr.pro/uploads/manga-images/i/i-became-the-most-terrifying-stepmother-in-history/thumbnail.jpg" alt="Terrifying Stepmother" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="bg-[#1c1c1c] border border-white/[0.06] text-neutral-300 text-[10px] px-2 py-0.5 rounded font-medium">⭐ 7.8/10</span>
            <span class="text-neutral-500 text-xs">Chapter 07</span>
            <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-medium">✨ BARU</span>
          </div>
          <p class="text-neutral-400 text-xs leading-relaxed">Reinkarnasi menjadi ibu tiri yang paling menakutkan dalam sejarah! Namun di balik reputasi yang menyeramkan, tersimpan hati yang lembut. Romance keluarga yang hangat dengan sentuhan komedi.</p>
        </div>
      </div>

      <h2 class="text-lg font-bold mt-8 mb-3 text-white tracking-tight">Tips Membaca Romance</h2>
      <p class="text-neutral-400 text-sm leading-relaxed mb-5">Pastikan Anda membaca sinopsis dan rating sebelum memulai. Beberapa manhwa romance memiliki tema yang cukup berat (drama/psikologis), sementara yang lain murni komedi romantis (fluff). Sesuaikan dengan mood Anda!</p>
      <ul class="list-disc list-inside space-y-2 text-neutral-400 text-sm mb-5 ml-2">
        <li>Cek tag/genre untuk memastikan tema sesuai selera</li>
        <li>Baca review dari pembaca lain untuk menghindari cerita yang terlalu dramatis</li>
        <li>Coba berbagai sub-genre: romcom, drama, fantasy romance, historical romance</li>
        <li>Jangan lupa simpan ke Library agar tidak kehilangan progres baca</li>
      </ul>

      <div class="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mt-6">
        <h3 class="text-sm font-bold mb-2 text-white">💖 Siap Merasakan Baper?</h3>
        <p class="text-neutral-500 text-xs mb-4 leading-relaxed">Kunjungi halaman All Series dengan filter Romance aktif untuk menemukan ratusan judul manhwa cinta lainnya.</p>
        <a href="/all?genre=16" class="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95">Baca Romance di TsukiNest <ChevronRight class="w-3 h-3" /></a>
      </div>
    `,
  },
};

// 3. Tambahkan generateStaticParams untuk Next.js SSG
export function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return { title: "Artikel Tidak Ditemukan" };
  }

  // 4. Perbaikan format plain-text untuk keperluan SEO
  const plain = post.content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 160) + "...";

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

export default async function BlogPostPage({ params }: PageProps) {
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
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> 
              {new Date(post.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="text-neutral-700">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
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
              href="/all"
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