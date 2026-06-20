"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import Lenis from "lenis";
import {
  ArrowRight,
  ArrowRightLeft,
  Building,
  Check,
  ChevronRight,
  Database,
  FileText,
  Globe,
  Layers,
  Lock,
  Menu,
  Moon,
  Shield,
  Smartphone,
  Store,
  Sun,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import IphoneMockup from "./_components/IphoneMockup";
import { LaptopMockup } from "./_components/LaptopMockup";

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

// ─── Animated Section Wrapper ──────────────────────────────────────────────────
function AnimSection({
  children,
  variant = fadeUp,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variants;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Theme Hook ────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setTheme(next);
  };

  return { theme, toggleTheme };
}

// ─── Counter Component ─────────────────────────────────────────────────────────
function Counter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate(latest) {
        setCount(Math.floor(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

// ─── Bento Card ────────────────────────────────────────────────────────────────
function BentoCard({
  icon,
  title,
  desc,
  className = "",
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  className?: string;
  badge?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={`group relative p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="space-y-3.5">
        <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          {badge && (
            <span className="inline-block text-[8px] font-extrabold tracking-widest uppercase bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full mb-2">
              {badge}
            </span>
          )}
          <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-yellow-300 transition-colors">
            {title}
          </h3>
          <p className="text-white/70 text-xs leading-relaxed mt-1.5">
            {desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}









// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lenisInstance, setLenisInstance] = useState<any>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });
    setLenisInstance(lenis);

    let animFrame: number;
    function raf(time: number) {
      lenis.raf(time);
      animFrame = requestAnimationFrame(raf);
    }
    animFrame = requestAnimationFrame(raf);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      lenis.destroy();
      cancelAnimationFrame(animFrame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const NAV_LINKS = [
    ["E-Catalog WA", "#ecatalog"],
    ["Fitur Utama", "#features"],
    ["Alur Kerja", "#how"],
    ["Kasir POS", "#pos"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#04003a] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-blue-500/25 selection:text-blue-200 relative">

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
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ── NAVBAR (Floating Glassmorphism Capsule) ── */}
      <div
        className={`fixed top-4 left-0 right-0 z-50 w-full max-w-7xl mx-auto px-4 md:px-8 transition-all duration-500 ${
          scrolled ? "top-3" : "top-5"
        }`}
      >
        <nav
          className={`w-full flex justify-between items-center transition-all duration-500 border rounded-2xl ${
            scrolled
              ? "py-3 px-5 md:px-7 bg-slate-950/40 backdrop-blur-2xl border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
              : "py-4 px-6 bg-white/[0.04] backdrop-blur-2xl border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <img
              src="/logo/logo_icon.png"
              alt="Sippeto"
              className="h-8 w-8 object-contain rounded-xl shadow-md transition-all duration-300 group-hover:scale-105 group-active:scale-95"
            />
            <span className="text-white font-black text-[15px] tracking-tight transition-opacity duration-300 group-hover:opacity-80">
              Sippeto
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  lenisInstance?.scrollTo(href);
                }}
                className="text-white/60 hover:text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all text-white/70"
              title="Ganti Tema"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Mulai Gratis
            </Link>
          </div>

          {/* Mobile trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl flex flex-col gap-2 md:hidden overflow-hidden z-50"
              >
                {NAV_LINKS.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="text-white/60 hover:text-white text-sm font-semibold py-1.5 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenu(false);
                      lenisInstance?.scrollTo(href);
                    }}
                  >
                    {label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-3 border-t border-white/8">
                  <Link
                    href="/login"
                    className="w-full text-center py-2.5 text-xs font-bold text-white border border-white/10 rounded-lg hover:bg-white/5"
                    onClick={() => setMobileMenu(false)}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-center py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                    onClick={() => setMobileMenu(false)}
                  >
                    Mulai Gratis
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-14 px-6 md:px-12 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left */}
          <div className="space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/8 text-[10px] font-bold text-blue-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sippeto v2.0 — Solusi Bisnis UMKM All-in-One
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="font-extrabold text-4xl sm:text-5xl md:text-[3.5rem] tracking-tight leading-[1.12] text-white"
            >
              Kelola Bisnis
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Lebih Cerdas
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="text-white/60 text-sm md:text-base leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              Satu dashboard terpadu untuk kasir POS, sinkronisasi stok cabang, pembukuan keuangan, dan katalog digital WhatsApp.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.97] transition-all text-sm"
              >
                Daftarkan Bisnis Anda
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  lenisInstance?.scrollTo("#features");
                }}
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold bg-white/5 hover:bg-white/8 rounded-xl transition-all text-sm cursor-pointer"
              >
                Lihat Fitur
              </a>
            </motion.div>

            {/* Tech badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 pt-6 border-t border-white/8 mt-6"
            >
              {[
                { icon: <Database className="w-3.5 h-3.5 text-cyan-400" />, label: "Go + Bun ORM" },
                { icon: <Lock className="w-3.5 h-3.5 text-cyan-400" />, label: "JWT + RLS Security" },
                { icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />, label: "Katalog Publik Instan" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {b.icon}
                  <span className="text-white/60 text-xs font-semibold">{b.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.25 }}
            className="relative flex items-center justify-center"
          >
            <div className="w-full max-w-[680px] relative">
              <LaptopMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <section className="py-4 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <AnimSection variant={scaleIn}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/[0.04] border border-white/8 rounded-2xl p-5 md:p-7 backdrop-blur-xl">
            {[
              { value: 1250, suffix: "+", label: "Toko Terdaftar" },
              { value: 45, prefix: "Rp ", suffix: "M+", label: "Volume Transaksi" },
              { value: 8, label: "Integrasi Cabang" },
              { value: 99, suffix: "%", label: "SLA Up-time" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
                  <Counter value={item.value} prefix={item.prefix} suffix={item.suffix} />
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </AnimSection>
      </section>

      {/* ── SECTION: E-CATALOG WHATSAPP ── */}
      <section
        id="ecatalog"
        className="py-16 px-6 md:px-12 max-w-7xl mx-auto z-10 relative"
      >
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white/[0.03] border border-white/8 rounded-3xl p-6 md:p-10 shadow-xl backdrop-blur-md overflow-hidden relative">
          {/* Ambient glow */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-blue-500/8 blur-[80px] rounded-full pointer-events-none" />

          {/* Left: Text content */}
          <AnimSection
            variant={slideLeft}
            className="lg:col-span-7 space-y-5 text-left relative z-10"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
              Katalog Digital & WhatsApp
            </span>

            <h2 className="font-extrabold text-2xl md:text-3xl text-white leading-tight">
              Katalog Toko Online <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-400">
                Terintegrasi WhatsApp
              </span>
            </h2>

            <p className="text-white/55 text-sm leading-relaxed max-w-lg">
              Buat etalase produk digital dalam hitungan menit. Terima pesanan terformat rapi langsung ke WhatsApp Anda tanpa ribet.
            </p>

            {/* Feature checklist */}
            <motion.div
              variants={staggerFast}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-3"
            >
              {[
                {
                  icon: "💬",
                  title: "Checkout WhatsApp",
                  desc: "Pesanan terformat otomatis dikirim ke chat WhatsApp admin.",
                },
                {
                  icon: "🛡️",
                  title: "Proteksi Anti-Spam",
                  desc: "Keamanan formulir melindungi dari bot tanpa verifikasi rumit.",
                },
                {
                  icon: "🔄",
                  title: "Sinkronisasi Stok",
                  desc: "Stok produk terupdate otomatis saat terjadi transaksi.",
                },
                {
                  icon: "🌐",
                  title: "Subdomain Instan",
                  desc: "Link toko profesional siap pakai tanpa instalasi server.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex gap-3 items-start group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold mb-0.5">{item.title}</p>
                    <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.97] mt-1"
            >
              Buat Katalog Toko Sekarang
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </AnimSection>

          {/* Right: iPhone Mockup */}
          <AnimSection
            variant={slideRight}
            className="lg:col-span-5 flex justify-center items-center relative py-4"
          >
            {/* Glow behind phone */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 rounded-full bg-emerald-400/10 blur-[60px]" />
            </div>
            {/* Step labels floating */}
            <div className="absolute top-6 left-0 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-emerald-300 backdrop-blur-md hidden lg:block">
              ① Pilih Produk
            </div>
            <div className="absolute top-1/2 -left-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-blue-300 backdrop-blur-md hidden lg:block">
              ② Isi Data
            </div>
            <div className="absolute bottom-8 left-0 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-yellow-300 backdrop-blur-md hidden lg:block">
              ③ Kirim via WA
            </div>
            <IphoneMockup />
          </AnimSection>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <AnimSection variant={fadeUp} className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-extrabold uppercase tracking-wider text-blue-300">
            Fitur Utama
          </span>
          <h2 className="font-extrabold text-3xl md:text-4xl text-white">
            Solusi Bisnis Lengkap <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
              Dalam Satu Dashboard
            </span>
          </h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Kelola operasional, keuangan, dan penjualan toko Anda dengan fitur-fitur handal dari Sippeto.
          </p>
        </AnimSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-12 gap-4"
        >
          <BentoCard
            className="md:col-span-8"
            icon={<Shield className="w-5 h-5 text-blue-400" />}
            badge="KEAMANAN DATA"
            title="Isolasi Data (Row Level Security)"
            desc="Keamanan data transaksi dan keuangan terjamin dengan enkripsi tingkat lanjut."
          />
          <BentoCard
            className="md:col-span-4"
            icon={<Building className="w-5 h-5 text-blue-400" />}
            badge="MULTICABANG"
            title="Manajemen Inventori"
            desc="Pantau perputaran stok di gudang maupun cabang retail secara presisi."
          />
          <BentoCard
            className="md:col-span-4"
            icon={<ArrowRightLeft className="w-5 h-5 text-blue-400" />}
            badge="LOGISTIK"
            title="Transfer Antar Cabang"
            desc="Kelola perpindahan stok antar lokasi dengan riwayat pelacakan lengkap."
          />
          <BentoCard
            className="md:col-span-8"
            icon={<Smartphone className="w-5 h-5 text-blue-400" />}
            badge="ONLINE ORDER"
            title="Secure WhatsApp Order"
            desc="Katalog publik dengan perlindungan spam untuk transaksi aman."
          />
          <BentoCard
            className="md:col-span-6"
            icon={<FileText className="w-5 h-5 text-blue-400" />}
            badge="FINANSIAL"
            title="Jurnal Keuangan"
            desc="Catat arus kas dan pantau profitabilitas bisnis secara real-time."
          />
          <BentoCard
            className="md:col-span-6"
            icon={<Globe className="w-5 h-5 text-blue-400" />}
            badge="STOREFRONT"
            title="Katalog Digital Publik"
            desc="Etalase online yang otomatis tersinkronisasi dengan stok toko Anda."
          />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white/[0.03] border border-white/8 rounded-3xl p-6 md:p-10 shadow-xl backdrop-blur-md">
          <AnimSection variant={slideLeft} className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-extrabold uppercase tracking-wider text-blue-300">
              Cara Kerja
            </span>
            <h2 className="font-extrabold text-2xl md:text-3xl text-white">
              Mulai Digitalisasi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Dalam 3 Langkah Mudah
              </span>
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-lg">
              Langkah sederhana untuk mulai menggunakan Sippeto bagi kemajuan bisnis Anda.
            </p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="space-y-5 pt-2"
            >
              {[
                {
                  step: "01",
                  title: "Registrasi Akun",
                  desc: "Buat akun bisnis Anda di Sippeto dan tentukan subdomain toko.",
                },
                {
                  step: "02",
                  title: "Setup Operasional",
                  desc: "Daftarkan cabang toko dan input data produk inventori.",
                },
                {
                  step: "03",
                  title: "Berjualan Maksimal",
                  desc: "Mulai transaksi kasir POS dan sebarkan link katalog digital.",
                },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="flex gap-4 items-start group">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-yellow-400 flex items-center justify-center font-mono text-xs font-bold group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimSection>

          <AnimSection variant={slideRight} className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm p-5 rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md text-left space-y-4">
              <h4 className="text-[10px] font-bold text-white/50 tracking-wider uppercase flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-300" />
                Contoh Subdomain
              </h4>
              <div className="space-y-2.5">
                {[
                  { n: "Kopi Aroma Nusantara", u: "sipetto.id/store/kopiaroma", l: "KA" },
                  { n: "Bakery Pastry Mantap", u: "sipetto.id/store/pastrymantap", l: "BP" },
                  { n: "Warung Sembako Jaya", u: "sipetto.id/store/sembakojaya", l: "WS" },
                ].map((t, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="p-3 rounded-xl border border-white/8 bg-slate-950/40 flex items-center justify-between hover:border-white/15 hover:bg-slate-950/60 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/20 flex items-center justify-center font-black text-[10px]">
                        {t.l}
                      </div>
                      <div className="leading-tight">
                        <span className="text-[11px] font-bold text-white block">{t.n}</span>
                        <span className="text-yellow-400/80 font-mono text-[9px]">{t.u}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </motion.div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[9px] leading-relaxed text-white/50 font-medium">
                Katalog subdomain terupdate otomatis tanpa mengganggu data keuangan internal.
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── KASIR POS SECTION ── */}
      <section id="pos" className="py-20 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <AnimSection variant={fadeUp} className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-extrabold uppercase tracking-wider text-blue-300">
            Sistem Kasir POS
          </span>
          <h2 className="font-extrabold text-3xl md:text-4xl text-white">
            Kasir Digital{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
              Offline & Online
            </span>
          </h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Transaksi tetap lancar dalam kondisi offline dan otomatis tersinkronisasi saat terhubung ke internet.
          </p>
        </AnimSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[
            {
              icon: <Zap className="w-5 h-5 text-yellow-400" />,
              title: "Transaksi Super Cepat",
              desc: "Proses pembayaran instan untuk kelancaran antrean pelanggan.",
              badge: "REAL-TIME",
            },
            {
              icon: <Database className="w-5 h-5 text-blue-400" />,
              title: "Sinkronisasi Stok",
              desc: "Inventori terpotong otomatis saat transaksi terjadi di kasir.",
              badge: "MULTI-CABANG",
            },
            {
              icon: <FileText className="w-5 h-5 text-emerald-400" />,
              title: "Laporan Penjualan",
              desc: "Analitik pendapatan harian & bulanan yang mudah dibaca.",
              badge: "ANALITIK",
            },
            {
              icon: <Lock className="w-5 h-5 text-blue-400" />,
              title: "Metode Pembayaran",
              desc: "Dukung tunai, transfer, dan QRIS dengan pembukuan terintegrasi.",
              badge: "FLEKSIBEL",
            },
            {
              icon: <Building className="w-5 h-5 text-blue-400" />,
              title: "Manajemen Shift",
              desc: "Kontrol penuh atas setoran kasir di tiap cabang toko.",
              badge: "OPERASIONAL",
            },
            {
              icon: <ArrowRightLeft className="w-5 h-5 text-blue-400" />,
              title: "Retur & Void",
              desc: "Kelola pembatalan atau pengembalian dengan sistem audit aman.",
              badge: "KONTROL",
            },
          ].map((card, i) => (
            <BentoCard
              key={i}
              icon={card.icon}
              title={card.title}
              desc={card.desc}
              badge={card.badge}
            />
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20 px-6 md:px-12 max-w-7xl mx-auto z-10">
        <AnimSection variant={scaleIn}>
          <div className="border border-white/8 bg-white/[0.03] backdrop-blur-md rounded-3xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 rounded-full bg-blue-600/5 blur-[100px]" />
            </div>

            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="font-extrabold text-3xl md:text-5xl leading-tight text-white relative z-10"
            >
              Mulai Kelola Bisnis <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Secara Digital
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="text-white/55 text-sm max-w-lg mx-auto leading-relaxed relative z-10"
            >
              Tinggalkan catatan manual. Optimalkan transaksi dan perluas jangkauan pasar Anda dengan Sippeto.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap justify-center gap-3.5 pt-2 relative z-10"
            >
              <Link
                href="/register"
                className="px-7 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-500/15 hover:scale-[1.02] active:scale-[0.97]"
              >
                Registrasi Sekarang
              </Link>
              <Link
                href="/login"
                className="px-7 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl font-semibold text-white/70 hover:text-white text-sm transition-all"
              >
                Sudah Punya Akun? Masuk
              </Link>
            </motion.div>

            {/* Social proof row */}
            <div className="flex flex-wrap justify-center gap-6 pt-4 relative z-10">
              {[
                { icon: <Check className="w-3 h-3" />, text: "Tanpa biaya setup" },
                { icon: <Check className="w-3 h-3" />, text: "Gratis 14 hari trial" },
                { icon: <Check className="w-3 h-3" />, text: "Tanpa kartu kredit" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="text-emerald-400">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ── FOOTER ── */}
      <AnimSection variant={fadeIn}>
        <footer className="max-w-7xl mx-auto px-6 md:px-12 py-10 border-t border-white/8 z-10 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Layers className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/30">
                © 2026 <strong className="text-white/50">Sippeto</strong>. Sistem
                Pembukuan & Katalog UMKM.
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30 font-semibold">
              {[["Kebijakan Privasi", "#"], ["Ketentuan Layanan", "#"], ["Bantuan", "#"]].map(
                ([label, href]) => (
                  <a key={label} href={href} className="hover:text-white/70 transition-colors">
                    {label}
                  </a>
                )
              )}
            </div>
          </div>
        </footer>
      </AnimSection>
    </div>
  );
}
