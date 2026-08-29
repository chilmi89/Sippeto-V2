"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Package,
  MessageSquareShare,
  Ticket,
  Copy,
  Check,
  QrCode,
  Building2,
} from "lucide-react";
import {
  CartItem,
  Profile,
  Branch,
  formatCurrency,
} from "./types";
import { validateDiscountCodeAction } from "@/app/actions/discount";
import { getTenantBanksAction } from "@/app/actions/tenant-bank";

export interface CartDrawerProps {
  cart: CartItem[];
  profile: Profile;
  branches: Branch[];
  selectedBranchId: string;
  cartTotalItems: number;
  cartTotalPrice: number;
  discounts?: any[];
  activeQrCodeUrl: { url: string; source: string } | null;
  onClose: () => void;
  onUpdateQuantity: (virtualId: string, delta: number) => void;
  onCheckoutSuccess: () => void;
}

export default function CartDrawer({
  cart,
  profile,
  branches,
  selectedBranchId,
  cartTotalItems,
  cartTotalPrice,
  discounts = [],
  activeQrCodeUrl,
  onClose,
  onUpdateQuantity,
  onCheckoutSuccess,
}: CartDrawerProps) {
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutPayment, setCheckoutPayment] = useState("QRIS");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [tenantBanks, setTenantBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      getTenantBanksAction(profile.id).then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setTenantBanks(res.data);
          const primaryBank = res.data.find((b: any) => b.is_primary) || res.data[0];
          if (primaryBank) setSelectedBankId(primaryBank.id);
        }
      });
    }
  }, [profile?.id]);

  const handleCopyBank = (accNumber: string, bankName: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedBank(bankName);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const getProductEffectivePrice = (product: any) => {
    const origPrice = Number(product.sell_price);
    if (!discounts || discounts.length === 0) return origPrice;
    const matchingDisc = discounts.find(
      (d) =>
        d.is_active &&
        d.product_ids &&
        d.product_ids.length > 0 &&
        d.product_ids.includes(product.id)
    );
    if (!matchingDisc) return origPrice;

    let discAmt = 0;
    if (matchingDisc.type === "PERCENTAGE") {
      discAmt = (origPrice * matchingDisc.value) / 100;
      if (matchingDisc.max_discount && discAmt > matchingDisc.max_discount) {
        discAmt = matchingDisc.max_discount;
      }
    } else {
      discAmt = matchingDisc.value;
    }
    return Math.max(0, origPrice - discAmt);
  };

  const isAddressRequired = !(profile.metadata?.hide_checkout_address);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone || (isAddressRequired && !checkoutAddress)) {
      alert("Harap lengkapi semua data formulir pengiriman");
      return;
    }

    let targetPhone = profile.phone_number || "";
    let branchName = "";
    const uniqueBranches = Array.from(
      new Set(cart.map((item) => item.virtualProduct.branchId))
    );
    if (uniqueBranches.length === 1 && uniqueBranches[0] !== "pusat") {
      const selectedBranch = branches.find((b) => b.id === uniqueBranches[0]);
      if (selectedBranch) {
        branchName = selectedBranch.name;
        if (selectedBranch.phone_number) targetPhone = selectedBranch.phone_number;
      }
    } else if (selectedBranchId !== "all") {
      const selectedBranch = branches.find((b) => b.id === selectedBranchId);
      if (selectedBranch) {
        branchName = selectedBranch.name;
        if (selectedBranch.phone_number) targetPhone = selectedBranch.phone_number;
      }
    }

    // Bersihkan karakter non-angka (spasi, strip, tanda tambah, kurung, dll.)
    targetPhone = targetPhone.replace(/\D/g, "");
    if (targetPhone.startsWith("0")) {
      targetPhone = "62" + targetPhone.slice(1);
    }

    if (!targetPhone) {
      alert("Nomor WhatsApp untuk pemesanan tidak ditemukan. Harap hubungi toko.");
      return;
    }

    let orderRef = `ORD-${Date.now().toString().slice(-6)}`;
    try {
      const checkoutItems = cart.map((item) => ({
        product_id: item.virtualProduct.originalProduct.id,
        quantity: item.quantity,
        price: getProductEffectivePrice(item.virtualProduct.originalProduct),
      }));

      const response = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profile.id,
          branch_id:
            selectedBranchId !== "all"
              ? selectedBranchId
              : (cart[0]?.virtualProduct.branchId || null),
          customer_name: checkoutName,
          customer_phone: checkoutPhone,
          customer_address: isAddressRequired ? checkoutAddress : null,
          payment_method: checkoutPayment,
          total_price: cartTotalPrice,
          items: checkoutItems,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.order) orderRef = resData.order.reference_number;
    } catch (err) {
      console.error("Gagal mencatat checkout:", err);
    }

    const storeTitle = profile.business_name || profile.username;
    const branchGreeting = branchName ? ` (Cabang ${branchName})` : "";
    const selectedBank = tenantBanks.find((b) => b.id === selectedBankId) || tenantBanks[0];

    let message = `*Halo ${storeTitle}${branchGreeting}! Saya ingin memesan produk berikut:*\n`;
    message += `👉 *Nomor Referensi Pesanan:* ${orderRef}\n\n`;
    message += `───────────────────────\n`;
    cart.forEach((item) => {
      const vp = item.virtualProduct;
      const product = vp.originalProduct;
      const effectivePrice = getProductEffectivePrice(product);
      const subtotal = item.quantity * effectivePrice;
      message += `🛍️ *${vp.displayName}*\n`;
      message += `   ${item.quantity} x ${formatCurrency(effectivePrice)} = *${formatCurrency(subtotal)}*\n\n`;
    });
    message += `───────────────────────\n`;
    message += `💵 *Total Belanja:* ${formatCurrency(cartTotalPrice)}\n\n`;
    message += `*📋 DATA PENGIRIMAN:*\n`;
    message += `👤 *Nama Penerima:* ${checkoutName}\n`;
    message += `📞 *No. WhatsApp:* ${checkoutPhone}\n`;
    if (isAddressRequired) message += `📍 *Alamat Lengkap:* ${checkoutAddress}\n`;
    if (branchName) message += `📍 *Cabang Pengiriman:* ${branchName}\n`;
    message += `💳 *Metode Pembayaran:* ${checkoutPayment}\n`;
    if (checkoutPayment === "Transfer" && selectedBank) {
      message += `🏦 *Rekening Tujuan:* ${selectedBank.bank_name} (${selectedBank.account_number} a.n. ${selectedBank.account_name})\n`;
    }
    message += `\n_Pesanan dibuat via E-Catalog SiPetto_`;
    message += `_Pesanan dibuat via E-Catalog Sippeto_`;

    window.open(
      `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`,
      "_blank"
    );

    onCheckoutSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Keranjang Belanja</h3>
              <p className="text-xs text-slate-400 font-medium">{cartTotalItems} produk dipilih</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Cart Items */}
          <div className="flex flex-col gap-3 mb-8">
            {cart.map((item) => {
              const product = item.virtualProduct.originalProduct;
              const origPrice = Number(product.sell_price);
              const effectivePrice = getProductEffectivePrice(product);
              const hasDiscount = effectivePrice < origPrice;
              const subtotal = item.quantity * effectivePrice;
              const virtualId = item.virtualProduct.virtualId;
              return (
                <div
                  key={virtualId}
                  className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/20 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-800/50 border border-white/5 overflow-hidden shrink-0 relative">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{product.name}</h4>
                    {hasDiscount ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-400">
                          {formatCurrency(effectivePrice)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 line-through">
                          {formatCurrency(origPrice)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-blue-400">
                        {formatCurrency(origPrice)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 h-7">
                        <button
                          onClick={() => onUpdateQuantity(virtualId, -1)}
                          className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(virtualId, 1)}
                          className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-black text-white">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
              <h4 className="text-sm font-black text-white uppercase tracking-wide">
                Data Pengiriman
              </h4>
            </div>

            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
              {[
                { label: "Nama Lengkap", placeholder: "Budi Santoso", value: checkoutName, setter: setCheckoutName, type: "text" },
                { label: "No. WhatsApp", placeholder: "0812xxxxxx", value: checkoutPhone, setter: setCheckoutPhone, type: "tel" },
              ].map(({ label, placeholder, value, setter, type }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {label} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={type}
                    required
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
                  />
                </div>
              ))}

              {isAddressRequired && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Alamat Lengkap <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Alamat rumah, RT/RW, Kelurahan..."
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all resize-none"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "COD", label: "Di Tempat", icon: Package },
                    { id: "QRIS", label: "QRIS", icon: QrCode },
                    { id: "Transfer", label: "Transfer", icon: Building2 },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCheckoutPayment(id)}
                      className={`py-2.5 px-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        checkoutPayment === id
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-blue-500/20 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Info Display per Metode Pembayaran */}
                {checkoutPayment === "QRIS" && (
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center">
                    {activeQrCodeUrl ? (
                      <>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-3">
                          QRIS Pembayaran ({activeQrCodeUrl.source})
                        </span>
                        <div className="relative w-[150px] h-[150px] bg-white rounded-xl p-2 mb-2 shadow-md">
                          <Image
                            src={activeQrCodeUrl.url}
                            alt={`QRIS ${activeQrCodeUrl.source}`}
                            fill
                            className="object-contain p-2"
                            sizes="150px"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                          Scan QRIS di atas melalui e-Wallet (GoPay, OVO, Dana, ShopeePay) atau m-Banking untuk bayar instant.
                        </p>
                        <a
                          href={activeQrCodeUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-[9px] font-bold text-blue-400 hover:text-blue-300 hover:underline uppercase tracking-wider"
                        >
                          Buka QRIS Ukuran Penuh
                        </a>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-2">
                          QRIS Code Belum Diunggah
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          QRIS toko belum dikonfigurasi. Anda dapat melanjutkan pemesanan dan minta QRIS via WhatsApp.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {checkoutPayment === "Transfer" && (
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Transfer Bank Toko
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Verifikasi WA</span>
                    </div>

                    {tenantBanks.length > 0 ? (
                      tenantBanks.map((bank) => {
                        const isSelected = selectedBankId === bank.id;
                        return (
                          <div
                            key={bank.id}
                            onClick={() => setSelectedBankId(bank.id)}
                            className={`flex items-center justify-between border rounded-xl p-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-500/10 border-blue-500/40 text-white shadow-sm"
                                : "bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="selectedBank"
                                checked={isSelected}
                                onChange={() => setSelectedBankId(bank.id)}
                                className="mt-1 accent-blue-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider block">
                                    {bank.bank_name}
                                  </span>
                                  {bank.is_primary && (
                                    <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                      Utama
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-white block mt-0.5 select-all">
                                  {bank.account_number}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium block">
                                  a.n. {bank.account_name}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyBank(bank.account_number, bank.id);
                              }}
                              className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              {copiedBank === bank.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-3 bg-white/5 rounded-xl border border-white/5 p-3">
                        <span className="text-[10px] text-amber-400 font-bold block mb-1">
                          Rekening Bank Toko Belum Diatur
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Silakan selesaikan pemesanan via WhatsApp untuk meminta detail rekening toko secara langsung.
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 font-semibold text-center mt-0.5">
                      Transfer ke rekening di atas lalu lampirkan bukti transfer saat konfirmasi WhatsApp.
                    </p>
                  </div>
                )}

                {checkoutPayment === "COD" && (
                  <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Bayar Di Tempat (COD)</span>
                      <span className="text-[10px] text-slate-400 font-medium block">Bayar tunai secara langsung saat barang diantar ke lokasi Anda.</span>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="p-5 bg-slate-900/80 border-t border-white/10 shrink-0">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Pembayaran
              </span>
            </div>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-mono">
              {formatCurrency(cartTotalPrice)}
            </span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <MessageSquareShare className="w-5 h-5" /> Pesan via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
