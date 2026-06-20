"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Tipe data produk demo ────────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  {
    id: "p1",
    name: "House Blend Coffee Beans",
    subtitle: "250g · Arabica",
    price: 85000,
    tag: "TERLARIS",
    emoji: "☕",
    color: "bg-amber-50",
    accent: "text-amber-700",
  },
  {
    id: "p2",
    name: "Signature Butter Croissant",
    subtitle: "Freshly Baked Daily",
    price: 35000,
    tag: "FAVORIT",
    emoji: "🥐",
    color: "bg-orange-50",
    accent: "text-orange-700",
  },
] as const;

const BUYER = {
  name: "Budi Santoso",
  address: "Desa Toyoresmi, Kediri",
};

// ─── Step 0 — Katalog Produk ──────────────────────────────────────────────────
function StepCatalog() {
  return (
    <motion.div
      key="step-catalog"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
      className="flex-1 flex flex-col justify-between p-3 text-left overflow-hidden"
    >
      <div className="space-y-2.5">
        <div className="pb-2 border-b border-zinc-100">
          <span className="text-[6px] font-extrabold text-blue-600 uppercase tracking-widest block">
            Mitra UMKM Sippeto
          </span>
          <h5 className="text-[11px] font-black text-slate-800 leading-tight">
            Kopi Desa Toyoresmi
          </h5>
          <p className="text-[6.5px] text-zinc-500 mt-0.5 font-semibold">
            Katalog Produk Resmi &amp; Terpercaya
          </p>
        </div>

        <div className="space-y-2">
          {DEMO_PRODUCTS.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-zinc-100 p-2 rounded-xl flex gap-2 shadow-sm"
            >
              {/* Emoji sebagai pengganti gambar */}
              <div
                className={`w-11 h-11 rounded-lg ${p.color} flex items-center justify-center text-xl shrink-0`}
              >
                {p.emoji}
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h6 className="text-[8px] font-black text-slate-800 leading-tight line-clamp-1">
                      {p.name}
                    </h6>
                    <span className="text-[5px] font-bold bg-blue-50 text-blue-600 px-1 py-0.5 rounded shrink-0">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[6px] text-zinc-400 font-medium mt-0.5">{p.subtitle}</p>
                  <span className="text-[7.5px] text-blue-500 font-mono font-black mt-1 block">
                    Rp {p.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-zinc-50">
                  <span className="text-[5.5px] text-emerald-600 font-bold">● Stok Ready</span>
                  <button className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[7px] font-black flex items-center gap-0.5 active:scale-95 shadow-sm">
                    <Plus className="w-2 h-2 stroke-[3]" /> Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl text-[6.5px] text-blue-700 font-semibold leading-relaxed mt-2">
        🎁 Pilih produk dan lanjutkan ke keranjang belanja.
      </div>
    </motion.div>
  );
}

// ─── Step 1 — Konfirmasi Pesanan ──────────────────────────────────────────────
function StepCheckout() {
  return (
    <motion.div
      key="step-checkout"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="flex-1 flex flex-col justify-between p-3 text-left overflow-hidden"
    >
      <div className="space-y-3">
        <div>
          <span className="text-[6px] font-extrabold text-blue-600 uppercase tracking-widest block">
            Keranjang Belanja
          </span>
          <h5 className="text-[11px] font-black text-slate-800 leading-tight">
            Konfirmasi Pesanan
          </h5>
        </div>

        {/* Order summary */}
        <div className="bg-white border border-zinc-100 p-2 rounded-xl shadow-sm text-[7.5px] space-y-1.5">
          {DEMO_PRODUCTS.map((p) => (
            <div key={p.id} className="flex justify-between font-medium">
              <span className="text-zinc-700">
                1× {p.emoji} {p.name.split(" ").slice(0, 3).join(" ")}
              </span>
              <span className="font-mono font-bold text-slate-800">
                Rp {p.price.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
          <div className="border-t border-zinc-100 pt-1.5 flex justify-between font-black">
            <span className="text-slate-700">Total Bayar</span>
            <span className="font-mono text-blue-600 text-[8.5px]">
              Rp {DEMO_PRODUCTS.reduce((s, p) => s + p.price, 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Shipping info */}
        <div className="space-y-1.5">
          <span className="text-[5.5px] font-extrabold text-zinc-500 uppercase tracking-wider">
            Informasi Pengiriman
          </span>
          <div className="bg-white border border-zinc-100 p-2 rounded-xl space-y-1.5 shadow-sm">
            {[
              { label: "Nama Penerima", value: BUYER.name },
              { label: "Alamat Kirim", value: BUYER.address },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <label className="text-[5px] font-black uppercase text-zinc-400 block">
                  {f.label}
                </label>
                <div className="w-full bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5 text-[7px] font-bold text-black">
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="w-full mt-2 bg-emerald-600 text-white rounded-xl py-2 flex items-center justify-center gap-1.5 text-[8.5px] font-black tracking-wide shadow-md">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        Checkout via WhatsApp
      </button>
    </motion.div>
  );
}

// ─── Step 2 — WhatsApp Chat ───────────────────────────────────────────────────
function StepWhatsApp() {
  const total = DEMO_PRODUCTS.reduce((s, p) => s + p.price, 0);

  return (
    <motion.div
      key="step-whatsapp"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className="flex-1 flex flex-col text-left overflow-hidden"
    >
      {/* WA Header */}
      <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-black text-white">
          KT
        </div>
        <div>
          <h6 className="text-[8.5px] font-black text-white leading-none">
            Kopi Desa Toyoresmi
          </h6>
          <span className="text-[5.5px] text-emerald-300 font-bold block">
            ● Online &amp; Aktif
          </span>
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 bg-[#ece5dd] p-2.5 flex flex-col justify-end min-h-0 overflow-hidden">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="max-w-[88%] bg-[#dcf8c6] self-end rounded-lg p-2 shadow-sm"
        >
          <p className="font-mono text-[6px] text-zinc-800 leading-[1.6]">
            *PESANAN BARU — SIPETTO*{"\n"}
            {"——————————————\n"}
            Nama: *{BUYER.name}*{"\n"}
            Alamat: *{BUYER.address}*{"\n"}
            Toko: *Kopi Desa Toyoresmi*{"\n\n"}
            Detail Belanjaan:{"\n"}
            {DEMO_PRODUCTS.map(
              (p) =>
                `- 1× ${p.name} (Rp ${p.price.toLocaleString("id-ID")})\n`
            )}
            {"\n"}*Total: Rp {total.toLocaleString("id-ID")}*{"\n"}
            {"——————————————\n"}
            Mohon segera diproses ya, min!
          </p>
          <span className="text-[5px] text-zinc-500 font-bold text-right block mt-1">
            09:42 ✓✓
          </span>
        </motion.div>
      </div>

      {/* WA input */}
      <div className="bg-[#f4f4f4] p-1.5 flex gap-1.5 items-center shrink-0 border-t border-zinc-200">
        <div className="flex-1 bg-white border border-zinc-200 rounded-full px-2 py-1 text-[7px] text-zinc-400">
          Ketik pesan...
        </div>
        <div className="w-6 h-6 rounded-full bg-[#25d366] flex items-center justify-center shrink-0">
          <ArrowRight className="w-3 h-3 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Indikator Langkah ────────────────────────────────────────────────────────
const STEP_LABELS = ["Katalog", "Pesanan", "WhatsApp"] as const;

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1.5 shrink-0 bg-white border-t border-zinc-100">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-400 ${
              i === step ? "bg-blue-600 scale-125" : "bg-zinc-300"
            }`}
          />
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`h-[1px] w-5 transition-all duration-500 ${
                i < step ? "bg-blue-400" : "bg-zinc-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Export: IphoneMockup ────────────────────────────────────────────────
export default function IphoneMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStep((prev) => (prev + 1) % 3),
      4800
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: 220, height: 450 }}
    >
      {/* Phone frame */}
      <div className="absolute inset-0 bg-neutral-900 rounded-[40px] border-[3px] border-neutral-700 shadow-2xl ring-4 ring-neutral-700/20" />

      {/* Dynamic island */}
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-30 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 border border-neutral-700 absolute left-2" />
        <div className="w-4 h-1.5 rounded-full bg-neutral-800 absolute right-2" />
      </div>

      {/* Screen */}
      <div className="absolute inset-[6px] bg-zinc-50 rounded-[34px] overflow-hidden flex flex-col border border-zinc-200">
        {/* Status bar */}
        <div className="h-9 px-5 pt-2.5 flex justify-between items-center text-[8px] text-zinc-700 font-bold tracking-tight shrink-0">
          <span>09:41</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 border border-zinc-400 rounded-[2px] p-[1px] flex items-center">
              <span className="w-full h-full bg-emerald-500 rounded-[1px]" />
            </span>
          </div>
        </div>

        {/* App bar */}
        <div className="h-8 bg-white border-b border-zinc-100 px-3.5 flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-blue-600 tracking-tight">Sippeto</span>
            <span className="text-[7px] text-zinc-400 font-medium">Store</span>
          </div>
          <div className="relative p-1">
            <ShoppingCart className="w-3.5 h-3.5 text-zinc-600" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 text-white rounded-full flex items-center justify-center text-[5.5px] font-black">
              {step === 0 ? "2" : step === 1 ? "2" : "✓"}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && <StepCatalog />}
            {step === 1 && <StepCheckout />}
            {step === 2 && <StepWhatsApp />}
          </AnimatePresence>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />
      </div>

      {/* Side button */}
      <div className="absolute right-[-4px] top-20 w-[3px] h-8 bg-neutral-600 rounded-l-sm" />
      <div className="absolute left-[-4px] top-16 w-[3px] h-6 bg-neutral-600 rounded-r-sm" />
      <div className="absolute left-[-4px] top-24 w-[3px] h-6 bg-neutral-600 rounded-r-sm" />
    </div>
  );
}
