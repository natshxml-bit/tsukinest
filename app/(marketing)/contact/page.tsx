// app/contact/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Shield,
  Scale,
  MessageCircle,
  ExternalLink,
  HelpCircle,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Hubungi tim TsukiNest untuk pertanyaan, saran, atau kolaborasi.",
};

const contacts = [
  {
    href: "mailto:contact@tsukinest.my.id",
    label: "Email",
    desc: "Kirim email kepada kami",
    email: "contact@tsukinest.my.id",
    icon: Mail,
  },
  {
    href: "mailto:dmca@tsukinest.my.id",
    label: "DMCA & Copyright",
    desc: "Laporan hak cipta",
    email: "dmca@tsukinest.my.id",
    icon: Shield,
  },
  {
    href: "mailto:legal@tsukinest.my.id",
    label: "Legal",
    desc: "Urusan hukum & bisnis",
    email: "legal@tsukinest.my.id",
    icon: Scale,
  },
  {
    href: "mailto:support@tsukinest.my.id",
    label: "Support",
    desc: "Bantuan & teknis",
    email: "support@tsukinest.my.id",
    icon: MessageCircle,
  },
];

const socials = [
  { href: "https://twitter.com/tsukinest", label: "X / Twitter", icon: "𝕏" },
  { href: "https://instagram.com/tsukinest", label: "Instagram", icon: "📷" },
  { href: "https://github.com/natshxml-bit/tsukinest", label: "GitHub", icon: "⚡" },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Hubungi Kami</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Punya pertanyaan, saran, atau ingin berkolaborasi? Kami siap mendengar dari Anda!
        </p>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {contacts.map((c) => (
            <a
              key={c.email}
              href={c.href}
              className="group bg-[#141414] border border-white/[0.05] rounded-xl p-4 hover:bg-[#1c1c1c] transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#262626] transition-colors">
                  <c.icon className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold">{c.label}</h3>
              </div>
              <p className="text-neutral-500 text-[11px] mb-1.5">{c.desc}</p>
              <p className="text-neutral-300 text-xs font-mono">{c.email}</p>
            </a>
          ))}
        </div>

        {/* Social Media */}
        <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">Media Sosial</h2>
          </div>
          <p className="text-neutral-500 text-xs mb-4 leading-relaxed">
            Follow kami untuk update terbaru dan berita menarik:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-3.5 py-2 rounded-lg transition-colors active:scale-95"
              >
                <span className="text-sm">{s.icon}</span>
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ Link */}
        <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">Sering Bertanya?</h2>
          </div>
          <p className="text-neutral-500 text-xs mb-4 leading-relaxed">
            Cek halaman FAQ kami untuk jawaban atas pertanyaan yang sering diajukan:
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-white/[0.06] hover:bg-[#262626] text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Lihat FAQ
          </Link>
        </section>

        {/* Response Time */}
        <div className="mt-8 flex items-center justify-center gap-2 text-neutral-600 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <p>Waktu respons rata-rata: 24-48 jam</p>
        </div>
      </div>
    </main>
  );
}
