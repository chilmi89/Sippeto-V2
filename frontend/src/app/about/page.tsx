"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Heart, 
  Target, 
  Users, 
  Sparkles, 
  Quote, 
  ArrowRight,
  Handshake,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

// Animation presets
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#04003a] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-blue-500/25 selection:text-blue-200 relative flex flex-col justify-between">
      
      {/* ── FIXED GRADIENT BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ overflow: "clip" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, #1a3a8f 0%, #04003a 70%)",
          }}
        />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 py-16 space-y-24">
        
        {/* ── HERO SECTION ── */}
        <section className="grid lg:grid-cols-2 gap-12 items-center pt-8">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/8 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
              Karya Inovasi Mahasiswa UNP Kediri
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Sippeto — Inovasi Digital
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
                Oleh HIMAPINNO
              </span>
            </h1>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              <strong className="text-white">Sippeto</strong> lahir dari inisiatif Himpunan Mahasiswa Program Studi Informatika (<span className="text-amber-300 font-bold">HIMAPINNO</span>) Universitas Nusantara PGRI Kediri. Proyek ini dikembangkan sebagai kontribusi nyata pengabdian mahasiswa dalam mempercepat digitalisasi manajemen keuangan dan katalog penjualan online bagi para pelaku UMKM lokal.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-wider"
              >
                Coba Sippeto Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#visi-misi"
                className="inline-flex items-center gap-2 px-5 py-3 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs"
              >
                Pelajari Visi Kami
              </a>
            </div>

            {/* Quick trust tags */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/8 text-xs text-white/50 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Informatika UNP Kediri
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Pengabdian Masyarakat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Solusi Nyata UMKM
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center w-full"
          >
            {/* Ambient colorful backdrop glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-cyan-400/25 blur-3xl rounded-3xl opacity-75 pointer-events-none" />

            <div className="w-full max-w-xl relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950/70 backdrop-blur-2xl shadow-2xl p-3 sm:p-4 group">
              {/* Photo Container matching exact 3:2 aspect ratio */}
              <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-white shadow-inner">
                <img
                  src="/himapino.jpeg"
                  alt="Tim Pengembang Sippeto - HIMAPINNO UNP Kediri"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>

              {/* Bottom Caption Pill */}
              <div className="mt-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-xs">
                    HIMAPINNO UNP Kediri
                  </span>
                </div>
                <span className="text-[11px] text-white/50 font-medium">
                  Tim Inovasi & Pengembang 2026
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── VISI & MISI PROYEK ── */}
        <section id="visi-misi" className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
              Visi & Misi
            </span>
            <h2 className="text-3xl font-bold text-white">Tujuan Pengembangan Sippeto</h2>
            <p className="text-white/60 text-xs md:text-sm">
              Mewujudkan kemandirian UMKM melalui pemanfaatan teknologi informasi terintegrasi dan berdaya guna tinggi.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            <motion.div 
              variants={fadeUp}
              className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-4 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Inovasi Teknologi</h3>
              <p className="text-white/70 text-xs leading-relaxed">
                Membangun aplikasi web dengan arsitektur modern (Next.js & Golang) untuk memastikan kecepatan akses, keamanan data tingkat tinggi, dan kestabilan sistem.
              </p>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-4 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Kebutuhan Nyata UMKM</h3>
              <p className="text-white/70 text-xs leading-relaxed">
                Menyediakan modul Kasir (POS) multi-cabang, rekap transaksi harian, dan etalase katalog WA untuk menyelesaikan tantangan pembukuan manual pelaku usaha kecil.
              </p>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-4 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Tri Dharma Perguruan Tinggi</h3>
              <p className="text-white/70 text-xs leading-relaxed">
                Sebagai sarana aktualisasi keilmuan informatika mahasiswa UNP Kediri dalam wujud pengabdian masyarakat guna mendorong roda ekonomi lokal.
              </p>
            </motion.div>
          </motion.div>
        </section>

    

        {/* ── KERJA SAMA & MITRA (FULL WIDTH ELEGANT SHOWCASE) ── */}
        <section className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-2xl overflow-hidden relative text-center space-y-10">
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-extrabold uppercase tracking-widest text-amber-300 backdrop-blur-md">
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              Kemitraan Terbuka UMKM
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Kolaborasi & Kemitraan <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
                Pemberdayaan UMKM Lokal
              </span>
            </h2>

            <p className="text-white/65 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              HIMAPINNO UNP Kediri membuka ruang kolaborasi seluas-luasnya bagi pegiat usaha kuliner, retail, fashion, hingga jasa untuk mendigitalisasi operasional kasir dan katalog online secara mandiri dan berkelanjutan.
            </p>
          </div>

          {/* 4 Cards Grid - Full Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-left">
            {[
              {
                title: "100% Bebas Biaya",
                desc: "Uji coba dan implementasi sistem tanpa pungutan biaya langganan.",
                icon: "✨"
              },
              {
                title: "Bimbingan Teknis",
                desc: "Pendampingan langsung oleh mahasiswa informatika UNP Kediri.",
                icon: "🎓"
              },
              {
                title: "Katalog Online Instan",
                desc: "Publikasi etalase toko dan sistem pesanan terintegrasi WhatsApp.",
                icon: "🌐"
              },
              {
                title: "Dukungan Berkelanjutan",
                desc: "Fitur aplikasi terus disempurnakan sesuai masukan nyata pelaku usaha.",
                icon: "⚡"
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-amber-400/30 hover:bg-white/[0.06] transition-all duration-300 space-y-2 group"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Clean Action CTA & Narahubung */}
          <div className="pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-wider"
            >
              Daftarkan Toko UMKM Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="mailto:himapinno@unpkediri.ac.id"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              Kontak: himapinno@unpkediri.ac.id
            </a>
          </div>
        </section>

        {/* ── QUOTE SECTION ── */}
        <section className="flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-3xl relative rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10 bg-gradient-to-br from-[#120f4c]/50 to-[#030037]/70 backdrop-blur-xl shadow-xl text-center space-y-6"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
              <Quote className="w-6 h-6 transform rotate-180" />
            </div>
            <blockquote className="text-base md:text-lg font-medium text-white/90 italic leading-relaxed">
              &ldquo;Teknologi bukan sekadar baris kode, melainkan jembatan solusi untuk memajukan perekonomian masyarakat lokal. <span>Sippeto</span> hadir untuk mewujudkan itu.&ldquo;
            </blockquote>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">- Chill Dev-</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Informatika &bull; Kreativitas &bull; Inovasi</p>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />

    </div>
  );
}
