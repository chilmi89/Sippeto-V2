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
  Laptop
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Oleh HIMAPINNO
              </span>
            </h1>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              <strong>Sippeto</strong> lahir dari inisiatif Himpunan Mahasiswa Program Studi Informatika (**HIMAPINNO**) Universitas Nusantara PGRI Kediri. Proyek ini dikembangkan sebagai kontribusi nyata pengabdian mahasiswa dalam mempercepat digitalisasi manajemen keuangan dan katalog penjualan online bagi para pelaku UMKM lokal.
            </p>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-wider"
              >
                Coba Sippeto Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center"
          >
            <div className="w-full max-w-lg aspect-square relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-2xl p-4">
              <img
                src="/about_us_hero.png"
                alt="Tentang Kami - Kolaborasi Tim Sippeto"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </motion.div>
        </section>

        {/* ── VISI & MISI PROYEK ── */}
        <section className="space-y-12">
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

        {/* ── TIM PENGEMBANG ── */}
        <section className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] font-extrabold uppercase tracking-wider text-purple-400">
              Tim Inovator
            </span>
            <h2 className="text-3xl font-bold text-white">Profil Tim Pengembang</h2>
            <p className="text-white/60 text-xs md:text-sm">
              Mahasiswa bertalenta di balik perancangan dan implementasi sistem informasi Sippeto.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder / Dev Card */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <img
                src="/founder_avatar.png"
                alt="Muhammad Ilham"
                className="w-24 h-24 rounded-2xl object-cover border border-white/10"
              />
              <div className="space-y-2 text-center sm:text-left">
                <span className="inline-block text-[8px] font-black tracking-widest uppercase bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                  Lead Developer
                </span>
                <h4 className="text-base font-bold text-white">Muhammad Ilham</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">HIMAPINNO UNP KEDIRI</p>
                <p className="text-white/70 text-xs leading-relaxed">
                  Fokus mengembangkan arsitektur backend Go (Gin Framework) serta optimasi performa query database relasional.
                </p>
              </div>
            </motion.div>

            {/* UI/UX / System Analyst Card */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <img
                src="/vet_avatar.png"
                alt="Riska Amanda"
                className="w-24 h-24 rounded-2xl object-cover border border-white/10"
              />
              <div className="space-y-2 text-center sm:text-left">
                <span className="inline-block text-[8px] font-black tracking-widest uppercase bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Lead UI/UX & System Analyst
                </span>
                <h4 className="text-base font-bold text-white">Riska Amanda</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">HIMAPINNO UNP KEDIRI</p>
                <p className="text-white/70 text-xs leading-relaxed">
                  Merancang alur navigasi user-friendly, integrasi desain Tailwind, serta memastikan kompatibilitas halaman mobile-first.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── KERJA SAMA & MITRA ── */}
        <section className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white/[0.03] border border-white/8 rounded-3xl p-6 md:p-10 shadow-xl backdrop-blur-md overflow-hidden relative">
          <div className="absolute -left-20 -top-20 w-72 h-72 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="lg:col-span-6 space-y-6 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-yellow-500/25 bg-yellow-500/5 text-[9px] font-extrabold uppercase tracking-wider text-yellow-300">
              Kerja Sama Mitra
            </span>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Kolaborasi & Kemitraan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-400">
                Pemberdayaan Ekonomi
              </span>
            </h2>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed">
              HIMAPINNO UNP Kediri mengundang seluruh pegiat UMKM kuliner, retail, fashion, hingga jasa di wilayah Kediri untuk berpartisipasi dan memanfaatkan platform Sippeto guna mengoptimalkan pencatatan penjualan dan promosi usaha.
            </p>
            <div className="space-y-3.5">
              {[
                "Kemitraan uji coba dan implementasi sistem secara cuma-cuma.",
                "Pelatihan dan bimbingan teknis penggunaan dashboard keuangan mahasiswa.",
                "Pendampingan publikasi katalog online untuk memperluas pasar digital.",
                "Saran & umpan balik berkelanjutan untuk optimalisasi fitur Sippeto."
              ].map((text, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/80 text-xs">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center relative z-10">
            <div className="p-8 rounded-2xl border border-white/8 bg-slate-950/40 text-left space-y-6 w-full max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Hubungi Kami (HIMAPINNO)</h4>
                  <p className="text-[10px] text-zinc-500">Hubungi kami untuk kerja sama uji coba</p>
                </div>
              </div>
              <div className="space-y-3.5 text-xs text-white/70">
                <p>Ingin bergabung sebagai mitra uji coba atau memiliki masukan mengenai fitur pengembangan Sippeto? Hubungi narahubung organisasi kami:</p>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/40">Email:</span>
                    <span className="text-yellow-300 font-mono">himapinno@unpkediri.ac.id</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Sekretariat:</span>
                    <span className="text-yellow-300 font-mono">Kampus UNP Kediri, Jawa Timur</span>
                  </div>
                </div>
              </div>
            </div>
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
              &ldquo;Teknologi bukan sekadar baris kode, melainkan jembatan solusi untuk memajukan perekonomian masyarakat lokal. Sippeto hadir untuk mewujudkan itu.&ldquo;
            </blockquote>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">HIMAPINNO UNP Kediri</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Informatika &bull; Kreativitas &bull; Inovasi</p>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />

    </div>
  );
}
