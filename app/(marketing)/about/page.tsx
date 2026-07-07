import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Target, Zap, Smartphone, Gift, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang TsukiNest",
  description: "Pelajari lebih lanjut tentang TsukiNest, platform baca manhwa, manhua, dan manga bahasa Indonesia terbaik dan terlengkap.",
  openGraph: {
    title: "Tentang TsukiNest",
    description: "Platform baca manhwa, manhua, dan manga bahasa Indonesia terbaik dan terlengkap.",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Tentang TsukiNest</h1>
          <p className="text-neutral-500 text-sm">Platform baca komik Asia terbaik di Indonesia</p>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Siapa Kami */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Siapa Kami?</h2>
            </div>
            <div className="text-neutral-400 text-sm leading-relaxed space-y-3">
              <p>
                TsukiNest adalah platform baca komik Asia (manhwa, manhua, dan manga) berbahasa Indonesia yang didirikan dengan passion untuk memberikan pengalaman membaca terbaik bagi para penggemar komik di Indonesia.
              </p>
              <p>
                Kami menyediakan ribuan judul komik dari berbagai genre dengan update chapter yang rutin setiap hari. Dari action, romance, fantasy, hingga slice of life — semua ada di TsukiNest!
              </p>
            </div>
          </section>

          {/* Visi & Misi */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Visi & Misi</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1.5">Visi</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Menjadi platform baca komik Asia nomor 1 di Indonesia yang menyediakan konten berkualitas, terupdate, dan mudah diakses oleh semua penggemar komik.
                </p>
              </div>
              <div className="border-t border-white/[0.05] pt-4">
                <h3 className="text-sm font-semibold text-white mb-1.5">Misi</h3>
                <ul className="text-neutral-400 text-sm space-y-2 list-disc list-inside">
                  <li>Menyediakan ribuan judul manhwa, manhua, dan manga terlengkap</li>
                  <li>Update chapter setiap hari dengan kualitas terjemahan terbaik</li>
                  <li>Memberikan pengalaman membaca yang nyaman dan user-friendly</li>
                  <li>Membangun komunitas pembaca komik yang solid di Indonesia</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Kenapa Memilih */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Kenapa Memilih TsukiNest?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, title: "Koleksi Lengkap", desc: "Ribuan judul dari berbagai genre" },
                { icon: Zap, title: "Update Cepat", desc: "Chapter baru setiap hari" },
                { icon: Smartphone, title: "Mobile Friendly", desc: "Responsif di semua perangkat" },
                { icon: Gift, title: "Gratis", desc: "Akses tanpa batasan" },
              ].map((f) => (
                <div key={f.title} className="bg-[#1c1c1c] border border-white/[0.06] rounded-lg p-3.5">
                  <f.icon className="w-4 h-4 text-neutral-400 mb-2" />
                  <h3 className="text-xs font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Hubungi Kami */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">Hubungi Kami</h2>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              Punya pertanyaan, saran, atau ingin berkolaborasi? Jangan ragu untuk menghubungi kami!
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:contact@tsukinest.my.id"
                className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-3.5 py-2 rounded-lg transition-colors active:scale-95"
              >
                <Mail className="w-3.5 h-3.5" /> contact@tsukinest.my.id
              </a>
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-neutral-600 text-xs space-y-1">
          <p>© {new Date().getFullYear()} TsukiNest. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-neutral-400 transition-colors">Terms</Link>
            <Link href="/dmca" className="hover:text-neutral-400 transition-colors">DMCA</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
