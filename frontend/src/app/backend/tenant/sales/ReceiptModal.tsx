"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Printer, Receipt, X, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  ReceiptData,
  StoreProfile,
  formatCurrency,
  printReceiptPdf,
  printReceiptUsb,
  printReceiptBluetooth,
} from "./receiptUtils";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StoreProfile;
  data: ReceiptData | null;
  title?: string;
  subtitle?: string;
  showSuccessBadge?: boolean;
  onViewHistory?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  profile,
  data,
  title = "Transaksi Berhasil!",
  subtitle = "Nota siap dicetak atau disimpan ke riwayat",
  showSuccessBadge = true,
  onViewHistory,
  onEdit,
  onDelete,
}: ReceiptModalProps) {
  const [printMethod, setPrintMethod] = useState<"usb" | "bluetooth">("usb");
  const [isUsbSupported, setIsUsbSupported] = useState(false);
  const [isUsbConnected, setIsUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState("");
  const [isPrintingUsb, setIsPrintingUsb] = useState(false);

  const [selectedBtDevice, setSelectedBtDevice] = useState<any>(null);
  const [isBtConnecting, setIsBtConnecting] = useState(false);
  const [isPrintingBt, setIsPrintingBt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (navigator as any).usb) {
      setIsUsbSupported(true);
      (navigator as any).usb.getDevices().then((devices: any[]) => {
        if (devices.length > 0) {
          setIsUsbConnected(true);
          setUsbDeviceName(devices[0].productName || "Thermal Printer");
        }
      });
    }
  }, []);

  if (!isOpen || !data) return null;

  const handleConnectUsbManual = async () => {
    if (!(navigator as any).usb) return toast.error("Browser Anda tidak mendukung WebUSB.");
    try {
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (device) {
        setIsUsbConnected(true);
        setUsbDeviceName(device.productName || "Thermal Printer");
        toast.success(`Terhubung ke printer USB: ${device.productName || "Thermal Printer"}`);
      }
    } catch (e: any) {
      if (e.name !== "NotFoundError") toast.error("Gagal menghubungkan printer USB.");
    }
  };

  const handleDisconnectUsbManual = () => {
    setIsUsbConnected(false);
    setUsbDeviceName("");
    toast.info("Printer USB terputus.");
  };

  const connectBluetoothPrinter = async (forceNewScan = false) => {
    if (!(navigator as any).bluetooth) {
      throw new Error("Browser tidak mendukung Web Bluetooth.");
    }
    const BT_SERVICE_UUIDS = [
      "0000ffe0-0000-1000-8000-00805f9b34fb",
      "0000ffe5-0000-1000-8000-00805f9b34fb",
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000aabb-0000-1000-8000-00805f9b34fb",
      "0000ae30-0000-1000-8000-00805f9b34fb",
      "0000af30-0000-1000-8000-00805f9b34fb",
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
      "49535441-5254-4745-4e49-555353455256",
    ];

    const BT_NAME_PREFIXES = [
      "MTP", "PT", "RP", "Thermal", "58mm", "80mm",
      "BT_", "Printer", "POS", "Xprinter", "ZJ", "GH",
      "LP", "GP", "PP", "MA", "BP", "ECO", "BP-ECO",
    ];

    if (!forceNewScan && selectedBtDevice && selectedBtDevice.gatt.connected) {
      return selectedBtDevice;
    }

    setIsBtConnecting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          ...BT_NAME_PREFIXES.map((prefix) => ({ namePrefix: prefix })),
          ...BT_SERVICE_UUIDS.map((uuid) => ({ services: [uuid] })),
        ],
        optionalServices: BT_SERVICE_UUIDS,
      });

      await device.gatt.connect();
      setSelectedBtDevice(device);
      toast.success(`Terhubung ke Bluetooth: ${device.name || "Thermal Printer"}`);
      return device;
    } catch (e: any) {
      if (e.name !== "NotFoundError") toast.error(`Gagal konek Bluetooth: ${e.message}`);
      throw e;
    } finally {
      setIsBtConnecting(false);
    }
  };

  const handleUsbPrint = async () => {
    try {
      setIsPrintingUsb(true);
      await printReceiptUsb(profile, data);
    } finally {
      setIsPrintingUsb(false);
    }
  };

  const handleBtPrint = async () => {
    try {
      setIsPrintingBt(true);
      const device = await connectBluetoothPrinter(false);
      await printReceiptBluetooth(profile, data, device);
    } catch (e: any) {
      if (e.name !== "NotFoundError") toast.error(e.message || "Gagal mencetak Bluetooth.");
    } finally {
      setIsPrintingBt(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[350px] md:max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200 cursor-default my-auto relative p-3 sm:p-4 space-y-2.5 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Tombol Close [X] Atas Kanan */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup Nota"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* HEADER MODAL */}
        <div className="text-center space-y-0.5 pt-0.5 shrink-0 border-b border-zinc-100 pb-2">
          {showSuccessBadge ? (
            <div className="w-6.5 h-6.5 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/20 ring-2 ring-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-6.5 h-6.5 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm shadow-indigo-600/20 ring-2 ring-indigo-100">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          )}
          <h4 className="text-xs sm:text-sm font-black text-[#030037] tracking-tight leading-none pt-0.5">{title}</h4>
          <p className="text-[8.5px] sm:text-[9.5px] text-zinc-500 font-bold">{subtitle}</p>
        </div>

        {/* RESPONSIVE BODY: 1 Column on Mobile, 2 Columns on Tablet/Desktop */}
        <div className="overflow-y-auto flex-1 [scrollbar-width:thin] pr-0.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
            
            {/* LEFT COLUMN: REALISTIC DIGITAL THERMAL RECEIPT CARD */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-2 sm:p-2.5 text-left font-mono text-[9.5px] text-black shadow-inner space-y-1 relative">
              {/* Header Toko */}
              <div className="text-center pb-1 border-b border-dashed border-zinc-300 flex flex-col items-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Logo Toko"
                    className="w-9 h-9 rounded-lg object-cover mb-0.5 border border-zinc-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs mb-0.5 border border-emerald-200 shadow-2xs">
                    {(profile.business_name || "T")[0].toUpperCase()}
                  </div>
                )}
                <h5 className="font-black text-[10.5px] uppercase tracking-wider text-black leading-none">{profile.business_name || "SIPPETO POS"}</h5>
                <p className="text-[7.5px] text-zinc-600 font-sans font-bold leading-tight mt-0.5">
                  {profile.branch_name || "Cabang Utama"}
                </p>
                {profile.address && (
                  <p className="text-[7px] text-zinc-500 font-sans leading-tight mt-0.5">{profile.address}</p>
                )}
              </div>

              {/* Metadata Nota */}
              <div className="space-y-0.5 text-[8.5px] font-bold text-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor Nota:</span>
                  <span className="text-black font-black">#{data.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tanggal:</span>
                  <span>{new Date(data.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pelanggan:</span>
                  <span className="truncate max-w-[130px]">{data.customer_name || "Pembeli Umum"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pembayaran:</span>
                  <span className="text-indigo-700">{data.payment_method}</span>
                </div>
              </div>

              {/* Rincian Produk / Itemized Items */}
              {data.items && data.items.length > 0 && (
                <div className="pt-1 border-t border-dashed border-zinc-300 space-y-1">
                  {data.items.map((item, idx) => {
                    const origPrice = item.sell_price || 0;
                    const effPrice = item.effective_price ?? origPrice;
                    const hasDisc = origPrice > effPrice;
                    const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
                    const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
                    const subtotalFmt = formatCurrency(item.subtotal || effPrice * item.quantity).replace("Rp", "").trim();

                    return (
                      <div key={idx} className="text-[8.5px]">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-black break-words flex-1 leading-snug">{item.name.replace(/\s*\(x\d+\)/, "")}</span>
                          {hasDisc && (
                            <span className="text-[7px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0 rounded shrink-0">
                              Diskon
                            </span>
                          )}
                        </div>
                        {hasDisc ? (
                          <div className="text-zinc-600 text-[8px] mt-0.5">
                            <div className="text-zinc-400 line-through">
                              {item.quantity} x {origFmt}
                            </div>
                            <div className="flex justify-between items-center font-bold text-emerald-700">
                              <span>&nbsp;&nbsp;&nbsp;&nbsp;→ {effFmt}</span>
                              <span className="font-mono text-black">{subtotalFmt}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-zinc-600 text-[8px] mt-0.5">
                            <span>{item.quantity} x {origFmt}</span>
                            <span className="font-bold text-black font-mono">{subtotalFmt}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subtotal, Diskon & Total Bayar */}
              <div className="pt-1 border-t border-dashed border-zinc-300 space-y-0.5 text-[8.5px]">
                {data.subtotal > 0 && (data.product_discount > 0 || (data.global_discount && data.global_discount.amount > 0)) && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(data.subtotal)}</span>
                  </div>
                )}
                {data.product_discount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Diskon Produk:</span>
                    <span>-{formatCurrency(data.product_discount)}</span>
                  </div>
                )}
                {data.global_discount && data.global_discount.amount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Diskon ({data.global_discount.name}):</span>
                    <span>-{formatCurrency(data.global_discount.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black text-[10px] text-black pt-0.5 border-t border-zinc-300">
                  <span className="uppercase tracking-wider">TOTAL BAYAR:</span>
                  <span className="text-[#3c39d6] text-[11px] font-black font-mono">{formatCurrency(data.total_income)}</span>
                </div>
              </div>

              {/* Uang Dibayar & Kembalian */}
              {data.cash_paid !== undefined && data.cash_paid > 0 && (
                <div className="pt-1 border-t border-zinc-300 space-y-0.5 text-[8.5px]">
                  <div className="flex justify-between text-zinc-600 font-bold">
                    <span>Uang Dibayar:</span>
                    <span className="font-mono text-black">{formatCurrency(data.cash_paid)}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-[10px] text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    <span className="uppercase tracking-wider text-[9px]">Kembalian:</span>
                    <span className="font-mono text-[11px] font-black text-emerald-600">{formatCurrency(data.change || 0)}</span>
                  </div>
                </div>
              )}

              {/* Pesan Footer Nota */}
              <div className="pt-1 text-center text-[7px] font-sans text-zinc-500 border-t border-dashed border-zinc-300 space-y-0.5">
                <p className="font-bold">terima kasih atas pesanan anda .</p>
                <p className="italic">dicetak dari Sippeto POS system</p>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTION BUTTONS & THERMAL PRINTER CONTROLS */}
            <div className="space-y-2 pt-0.5">
              {/* Top PDF, History, Edit, Delete Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {onViewHistory && (
                  <button
                    type="button"
                    onClick={onViewHistory}
                    className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-lg text-[9.5px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-zinc-600" /> Lihat Riwayat
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => printReceiptPdf(profile, data)}
                  className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[9.5px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#3c39d6]" /> Cetak PDF
                </button>
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[9.5px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg text-[9.5px] font-black transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Hapus
                  </button>
                )}
              </div>

              {/* Segmented Tab Selector for Direct Thermal Printers */}
              <div className="p-0.5 bg-zinc-100 rounded-lg flex gap-1 border border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => setPrintMethod("usb")}
                  className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    printMethod === "usb"
                      ? "bg-[#3c39d6] text-white shadow-xs"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  🔌 Kabel USB
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMethod("bluetooth")}
                  className={`flex-1 py-1 text-center text-[8.5px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    printMethod === "bluetooth"
                      ? "bg-[#3c39d6] text-white shadow-xs"
                      : "text-zinc-600 hover:text-black"
                  }`}
                >
                  📶 Bluetooth
                </button>
              </div>

              {/* Direct Thermal Print Section */}
              {printMethod === "usb" ? (
                <div className="space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-200/80">
                  {isUsbSupported ? (
                    <>
                      <button
                        type="button"
                        onClick={handleUsbPrint}
                        disabled={isPrintingUsb}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#030037] hover:bg-[#3c39d6] disabled:bg-zinc-400 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                      >
                        <Printer className={`w-3.5 h-3.5 ${isPrintingUsb ? "animate-pulse" : ""}`} />
                        {isPrintingUsb ? "Mencetak..." : "Cetak Thermal via USB"}
                      </button>
                      <div className="flex items-center justify-between px-1 text-[8px] font-bold">
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isUsbConnected ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`}></span>
                          <span className="text-zinc-700 truncate max-w-[160px]">
                            {isUsbConnected ? `Terhubung (${usbDeviceName})` : "Printer USB Terputus"}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={handleConnectUsbManual}
                            className="text-[#3c39d6] hover:underline font-black cursor-pointer"
                          >
                            {isUsbConnected ? "Ganti" : "Hubungkan"}
                          </button>
                          {isUsbConnected && (
                            <button
                              type="button"
                              onClick={handleDisconnectUsbManual}
                              className="text-rose-600 hover:underline font-black cursor-pointer"
                            >
                              Putus
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full p-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold text-center rounded-lg">
                      Browser tidak mendukung USB langsung.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 bg-zinc-50 p-2 rounded-xl border border-zinc-200/80">
                  <button
                    type="button"
                    onClick={handleBtPrint}
                    disabled={isPrintingBt || isBtConnecting}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#030037] hover:bg-[#3c39d6] disabled:bg-zinc-400 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className={`w-3.5 h-3.5 ${isPrintingBt ? "animate-pulse" : ""}`} />
                    {isBtConnecting ? "Menghubungkan..." : isPrintingBt ? "Mencetak..." : "Cetak Thermal via Bluetooth"}
                  </button>
                  <div className="flex items-center justify-between px-1 text-[8px] font-bold">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedBtDevice?.gatt?.connected ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`}></span>
                      <span className="text-zinc-700 truncate max-w-[160px]">
                        {selectedBtDevice?.gatt?.connected ? `Terhubung (${selectedBtDevice.name || "Printer BT"})` : "Printer BT Belum Terhubung"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => connectBluetoothPrinter(true)}
                      className="text-[#3c39d6] hover:underline font-black cursor-pointer"
                    >
                      {selectedBtDevice?.gatt?.connected ? "Cari Ulang" : "Hubungkan"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
