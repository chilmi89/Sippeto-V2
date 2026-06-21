"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Check,
  Printer,
  X,
  Package,
  Store,
  ChevronDown,
  Edit2,
  Receipt,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { getPOSProductsAction, savePOSTransactionAction } from "./actions";

// Bluetooth thermal printer constants
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

// Cache printer device instance at page session level (prevents re-pairing on same page load)
let cachedPrinterDevice: any = null;

const getQuickCashPresets = (total: number): number[] => {
  if (total <= 0) return [10000, 20000, 50000, 100000];
  const presets = new Set<number>();
  const nominals = [10000, 20000, 50000, 100000];
  for (const nom of nominals) {
    if (nom > total) {
      presets.add(nom);
    }
  }
  const nearest10k = Math.ceil(total / 10000) * 10000;
  if (nearest10k > total) presets.add(nearest10k);
  const nearest50k = Math.ceil(total / 50000) * 50000;
  if (nearest50k > total) presets.add(nearest50k);
  return Array.from(presets).sort((a, b) => a - b).slice(0, 3);
};

interface Product {
  id: string;
  name: string;
  sell_price: number;
  base_price: number;
  image_url: string | null;
  category_id: string | null;
  product_categories?: {
    name: string;
  } | null;
  current_branch_stock?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface POSFormProps {
  profile: any;
  branches: Branch[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  txCategories: any[];
  initialProducts: Product[];
  initialBranchId: string;
  editTransaction: any;
  editId: string | null;
}

export default function POSForm({
  profile,
  branches,
  categories,
  paymentMethods,
  txCategories,
  initialProducts,
  initialBranchId,
  editTransaction,
  editId
}: POSFormProps) {
  const router = useRouter();

  // Selection States
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Cart & Transaction Form States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [inputQty, setInputQty] = useState<number>(1);

  const [cashPaid, setCashPaid] = useState<string>("");

  // Loadings
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Search & Filter & Bluetooth States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const checkBluetoothSupport = useCallback(() => {
    setIsBluetoothSupported(typeof window !== "undefined" && !!(navigator as any).bluetooth);
  }, []);

  useEffect(() => {
    checkBluetoothSupport();
  }, [checkBluetoothSupport]);

  // Searched Products for custom combobox
  const searchedProducts = useMemo(() => {
    if (!productSearchQuery) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [products, productSearchQuery]);

  // Initialize form values
  useEffect(() => {
    if (editTransaction) {
      setReference(editTransaction.reference_number || "");
      setDate(editTransaction.transaction_date?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setDescription(editTransaction.description || "");
      setCustomerName(editTransaction.customer_name || "");
      if (editTransaction.customer_phone) setCustomerPhone(editTransaction.customer_phone);
      if (editTransaction.customer_address) setCustomerAddress(editTransaction.customer_address);

      if (editTransaction.items?.length > 0) {
        const firstItemPaymentId = editTransaction.items[0].payment_method_id;
        if (firstItemPaymentId) setPaymentMethodId(firstItemPaymentId);
      }

      // Rebuild keranjang (gabungkan item dengan product_id yang sama)
      const rebuiltCart: CartItem[] = [];
      for (const item of editTransaction.items) {
        if (item.product_id) {
          const found = products.find((p) => p.id === item.product_id);
          if (found) {
            const existing = rebuiltCart.find((c) => c.product.id === item.product_id);
            if (existing) {
              existing.quantity += item.quantity || 1;
            } else {
              rebuiltCart.push({ product: found, quantity: item.quantity || 1 });
            }
          }
        }
      }
      setCart(rebuiltCart);
    } else {
      const now = new Date();
      setDate(now.toISOString().split("T")[0]);
      setReference(`POS-${now.getTime().toString().slice(-6)}`);
      if (paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find(
          (pm) =>
            pm.name.toLowerCase().includes("tunai") ||
            pm.name.toLowerCase().includes("cash")
        ) || paymentMethods[0];
        setPaymentMethodId(defaultMethod.id);
      }
    }
  }, [editTransaction, paymentMethods]);

  // Fetch Products based on selected branch changes
  const fetchProductsForBranch = useCallback(async (bId: string) => {
    if (!bId) return;
    try {
      const res = await getPOSProductsAction(profile.tenant_owner_id, bId);
      if (res.status === "success" && res.data) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui data produk cabang");
    }
  }, [profile.tenant_owner_id]);

  useEffect(() => {
    if (selectedBranchId !== initialBranchId) {
      fetchProductsForBranch(selectedBranchId);
      setCart([]); // Reset keranjang jika ganti cabang untuk konsistensi stok
    }
  }, [selectedBranchId, fetchProductsForBranch, initialBranchId]);

  // Cart operations
  const addToCart = (product: Product) => {
    const stockLimit = product.current_branch_stock ?? 0;
    const existing = cart.find(item => item.product.id === product.id);

    if (existing) {
      if (existing.quantity >= stockLimit) {
        toast.warning(`Stok produk tidak mencukupi (Maksimal: ${stockLimit} pcs)`);
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      if (stockLimit <= 0) {
        toast.warning("Stok produk habis!");
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    const stockLimit = item.product.current_branch_stock ?? 0;

    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty > stockLimit) {
      toast.warning(`Stok produk terbatas pada ${stockLimit} pcs`);
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i));
    }
  };

  const handleQtyInput = (productId: string, val: string) => {
    const num = parseInt(val);
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const stockLimit = item.product.current_branch_stock ?? 0;

    if (isNaN(num) || num <= 0) {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: 1 } : i));
    } else if (num > stockLimit) {
      toast.warning(`Stok produk terbatas pada ${stockLimit} pcs`);
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: stockLimit } : i));
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: num } : i));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleAddProductFromSelect = () => {
    if (!selectedProductId) return toast.warning("Silakan pilih produk terlebih dahulu");
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const stockLimit = prod.current_branch_stock ?? 0;
    if (stockLimit <= 0) {
      toast.warning("Stok produk habis!");
      return;
    }

    const existing = cart.find(item => item.product.id === prod.id);
    const currentQty = existing ? existing.quantity : 0;
    const targetQty = currentQty + inputQty;

    if (targetQty > stockLimit) {
      toast.warning(`Stok tidak mencukupi. Maksimal stok: ${stockLimit}`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === prod.id 
          ? { ...item, quantity: targetQty } 
          : item
      ));
    } else {
      setCart([...cart, { product: prod, quantity: inputQty }]);
    }
    
    setSelectedProductId("");
    setProductSearchQuery("");
    setInputQty(1);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0);

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) return toast.warning("Keranjang belanja masih kosong");
    if (!paymentMethodId) return toast.warning("Mohon pilih metode pembayaran");

    try {
      setIsSubmitting(true);
      
      const targetCat = txCategories.find(c => c.type === "pemasukan" && c.name.toLowerCase().includes("penjualan")) 
                        || txCategories.find(c => c.type === "pemasukan") 
                        || { id: null };

      const itemsPayload = cart.map(item => ({
        name: `${item.product.name} (x${item.quantity})`,
        amount: item.product.sell_price * item.quantity,
        category_id: targetCat.id,
        payment_method_id: paymentMethodId,
        type: "INCOME",
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const isEditMode = !!editId;

      const payload = {
        ...(isEditMode && { id: editId }),
        profile_id: profile.tenant_owner_id,
        branch_id: selectedBranchId,
        reference_number: reference,
        transaction_date: date,
        description: description || "Transaksi POS Kasir",
        customer_name: customerName || "Pembeli Umum",
        customer_phone: customerPhone || null,
        customer_address: customerAddress || null,
        order_status: 6,
        items: itemsPayload
      };

      const res = await savePOSTransactionAction(payload);

      if (res.status === "success") {
        const numericCashPaid = Number(cashPaid) || 0;
        const changeAmount = numericCashPaid > cartSubtotal ? numericCashPaid - cartSubtotal : 0;

        setLastTransaction({
          ...res.data,
          items: cart,
          customer_name: customerName || "Pembeli Umum",
          payment_method: paymentMethods.find(pm => pm.id === paymentMethodId)?.name || "Tunai",
          cash_paid: numericCashPaid,
          change: changeAmount
        });

        if (isEditMode) {
          toast.success("Transaksi berhasil diperbarui dan stok telah disesuaikan!");
        } else {
          toast.success("Transaksi kasir berhasil disimpan!");
        }
        
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setDescription("");
        setCashPaid("");
        
        fetchProductsForBranch(selectedBranchId);

        const now = new Date();
        setReference(`POS-${now.getTime().toString().slice(-6)}`);
        
        setShowReceiptModal(true);
      } else {
        toast.error(res.message || "Gagal memproses transaksi");
      }

    } catch (e) {
      toast.error("Kesalahan jaringan saat memproses transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastTransaction) return;

    const doc = new jsPDF({
      unit: "mm",
      format: [80, 150]
    });

    const activeBranchName = branches.find(b => b.id === selectedBranchId)?.name || "Cabang Utama";

    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text(profile.business_name.toUpperCase(), 40, 10, { align: "center" });

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(activeBranchName, 40, 14, { align: "center" });
    
    let currentY = 14;
    if (profile.address) {
      doc.setFontSize(7);
      const splitAddress = doc.splitTextToSize(profile.address, 70);
      splitAddress.forEach((line: string) => {
        currentY += 4;
        doc.text(line, 40, currentY, { align: "center" });
      });
    }

    doc.setFontSize(8);
    currentY += 4;
    doc.text("---------------------------------", 40, currentY, { align: "center" });
    
    doc.text(`Nota : #${lastTransaction.reference_number}`, 5, currentY + 5);
    doc.text(`Tgl  : ${new Date(lastTransaction.transaction_date || "").toLocaleDateString()}`, 5, currentY + 9);
    doc.text(`Cust : ${lastTransaction.customer_name}`, 5, currentY + 13);
    doc.text(`Bayar: ${lastTransaction.payment_method}`, 5, currentY + 17);
    
    currentY += 22;
    doc.text("---------------------------------", 40, currentY, { align: "center" });
    
    let yPos = currentY + 5;
    lastTransaction.items.forEach((item: CartItem) => {
      const name = item.product.name.slice(0, 18);
      const qtyText = `${item.quantity} x ${formatCurrency(item.product.sell_price).replace("Rp", "").trim()}`;
      const subtotalText = formatCurrency(item.product.sell_price * item.quantity).replace("Rp", "").trim();

      doc.setFont("courier", "bold");
      doc.text(name, 5, yPos);
      doc.setFont("courier", "normal");
      doc.text(qtyText, 5, yPos + 4);
      doc.text(subtotalText, 75, yPos + 4, { align: "right" });
      yPos += 9;
    });

    doc.text("---------------------------------", 40, yPos, { align: "center" });
    doc.setFont("courier", "bold");
    doc.text("TOTAL :", 5, yPos + 5);
    const totalAmount = lastTransaction.items.reduce((sum: number, item: any) => sum + (item.product.sell_price * item.quantity), 0);
    doc.text(formatCurrency(totalAmount).replace("Rp", "").trim(), 75, yPos + 5, { align: "right" });

    let nextY = yPos + 9;
    if (lastTransaction.cash_paid !== undefined && lastTransaction.cash_paid > 0) {
      doc.setFont("courier", "normal");
      doc.text("BAYAR :", 5, nextY);
      doc.text(formatCurrency(lastTransaction.cash_paid).replace("Rp", "").trim(), 75, nextY, { align: "right" });
      nextY += 4;
      doc.text("KEMBALI:", 5, nextY);
      doc.text(formatCurrency(lastTransaction.change || 0).replace("Rp", "").trim(), 75, nextY, { align: "right" });
      nextY += 5;
    } else {
      nextY += 5;
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.text("Terima kasih atas kunjungan Anda !", 40, nextY + 5, { align: "center" });
    doc.text("Sippeto POS System", 40, nextY + 9, { align: "center" });

    const pdfBlobUrl = doc.output("bloburl");
    window.open(pdfBlobUrl);
  };

  const handlePrintBluetoothDirect = async () => {
    if (!lastTransaction) return;
    try {
      setIsPrintingBt(true);

      if (!(navigator as any).bluetooth) {
        toast.error("Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome versi terbaru.");
        return;
      }

      let device: any = cachedPrinterDevice;

      // 1. Coba gunakan printer dari cache sesi halaman terlebih dahulu
      if (device) {
        console.log("Menggunakan printer Bluetooth dari cache sesi halaman:", device.name);
      }

      // 2. Jika tidak ada di cache, coba dapatkan perangkat yang sudah di-pair sebelumnya
      if (!device && typeof (navigator as any).bluetooth.getDevices === "function") {
        try {
          const pairedDevices = await (navigator as any).bluetooth.getDevices();
          device = pairedDevices.find((d: any) => {
            const name = d.name || "";
            return BT_NAME_PREFIXES.some(p => name.startsWith(p));
          });
          if (device) {
            console.log("Menggunakan printer Bluetooth terpasang:", device.name);
            cachedPrinterDevice = device;
          }
        } catch (e) {
          console.warn("Gagal membaca daftar perangkat terpasang:", e);
        }
      }

      // 3. Jika tidak ditemukan perangkat terpasang, tampilkan dialog pencarian
      if (!device) {
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            ...BT_SERVICE_UUIDS.map(u => ({ services: [u] })),
            ...BT_NAME_PREFIXES.map(p => ({ namePrefix: p })),
          ],
          optionalServices: BT_SERVICE_UUIDS,
        });
        cachedPrinterDevice = device;
      }

      if (!device.gatt) throw new Error("Perangkat tidak mendukung GATT");

      let server: any = null;
      try {
        server = await device.gatt.connect();
      } catch (connectErr: any) {
        console.error("Gagal menghubungkan ke cached printer:", connectErr);
        // Reset cache agar kueri pencarian baru dapat dipicu kembali jika terjadi kegagalan koneksi
        cachedPrinterDevice = null;
        throw new Error(`Gagal terhubung ke printer. Pastikan printer menyala dan berada dalam jangkauan. (${connectErr.message || connectErr})`);
      }
      if (!server) throw new Error("Gagal menghubungkan ke printer");

      // Auto-discover write characteristic across all known service UUIDs
      let writeChar: any = null;
      for (const uuid of BT_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(uuid);
          const characteristics = await service.getCharacteristics();
          writeChar = characteristics.find(
            (c: any) => c.properties.write || c.properties.writeWithoutResponse
          );
          if (writeChar) break;
        } catch {
          // Try next UUID
        }
      }

      // Fallback: try all available services on device
      if (!writeChar) {
        const allServices = await server.getPrimaryServices();
        for (const service of allServices) {
          const characteristics = await service.getCharacteristics();
          writeChar = characteristics.find(
            (c: any) => c.properties.write || c.properties.writeWithoutResponse
          );
          if (writeChar) break;
        }
      }

      if (!writeChar) throw new Error("Tidak menemukan port tulis data printer");

      const encoder = new TextEncoder();
      const ESC = "\x1b";
      const GS = "\x1d";
      const LF = "\n";

      let data = "";
      data += ESC + "@";
      data += ESC + "a" + "\x01";
      data += ESC + "!" + "\x10";
      data += (profile.business_name || "TOKO UMKM").toUpperCase() + LF;
      data += ESC + "!" + "\x00";

      const activeBranchName = branches.find(b => b.id === selectedBranchId)?.name || "Cabang Utama";
      data += activeBranchName + LF;
      if (profile.address) {
        data += profile.address + LF;
      }
      data += "--------------------------------" + LF;

      data += ESC + "a" + "\x00";
      data += `Nota : #${lastTransaction.reference_number}` + LF;
      data += `Tgl  : ${new Date(lastTransaction.transaction_date || "").toLocaleDateString("id-ID")}` + LF;
      data += `Cust : ${lastTransaction.customer_name}` + LF;
      data += `Bayar: ${lastTransaction.payment_method}` + LF;
      data += "--------------------------------" + LF;

      lastTransaction.items.forEach((item: CartItem) => {
        const name = item.product.name.slice(0, 18);
        const qtyText = `${item.quantity} x ${formatCurrency(item.product.sell_price).replace("Rp", "").trim()}`;
        const subtotalText = formatCurrency(item.product.sell_price * item.quantity).replace("Rp", "").trim();

        data += name + LF;
        const spacesCount = 32 - qtyText.length - subtotalText.length;
        const spaces = " ".repeat(Math.max(1, spacesCount));
        data += qtyText + spaces + subtotalText + LF;
      });

      data += "--------------------------------" + LF;

      const totalText = "TOTAL :";
      const totalVal = formatCurrency(lastTransaction.items.reduce((sum: number, i: CartItem) => sum + (i.product.sell_price * i.quantity), 0)).replace("Rp", "").trim();
      const totalSpaces = 32 - totalText.length - totalVal.length;
      data += totalText + " ".repeat(Math.max(1, totalSpaces)) + totalVal + LF;

      if (lastTransaction.cash_paid !== undefined && lastTransaction.cash_paid > 0) {
        const bayarText = "BAYAR :";
        const bayarVal = formatCurrency(lastTransaction.cash_paid).replace("Rp", "").trim();
        const bayarSpaces = 32 - bayarText.length - bayarVal.length;
        data += bayarText + " ".repeat(Math.max(1, bayarSpaces)) + bayarVal + LF;

        const kembaliText = "KEMBALI:";
        const kembaliVal = formatCurrency(lastTransaction.change || 0).replace("Rp", "").trim();
        const kembaliSpaces = 32 - kembaliText.length - kembaliVal.length;
        data += kembaliText + " ".repeat(Math.max(1, kembaliSpaces)) + kembaliVal + LF;
      }
      data += LF;

      data += ESC + "a" + "\x01";
      data += "Terima kasih atas kunjungan Anda!" + LF;
      data += "Sippeto POS System" + LF;
      data += LF + LF + LF;

      data += GS + "V" + "\x41" + "\x03";

      const bytes = encoder.encode(data);
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        try {
          if (writeChar.writeWithoutResponse) {
            await writeChar.writeWithoutResponse(chunk);
          } else if (writeChar.writeValueWithResponse) {
            await writeChar.writeValueWithResponse(chunk);
          } else {
            await writeChar.writeValue(chunk);
          }
        } catch {
          // Fallback: try writeValue if the preferred method fails
          await writeChar.writeValue(chunk);
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      toast.success("Nota berhasil dicetak via Bluetooth!");
      await device.gatt.disconnect();
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal cetak Bluetooth: ${err.message || err}`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  const isCashPayment = selectedPaymentMethod?.name.toLowerCase().includes("tunai") || selectedPaymentMethod?.name.toLowerCase().includes("cash");
  const numericCashPaid = Number(cashPaid) || 0;
  const changeAmount = numericCashPaid > cartSubtotal ? numericCashPaid - cartSubtotal : 0;
  const isPaymentEnough = !isCashPayment || numericCashPaid >= cartSubtotal;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col pb-10" style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      <div className="max-w-[1600px] mx-auto w-full px-3 lg:px-4 py-3 space-y-3">
        
        {/* Header POS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/50 pb-2">
           <div>
              <div className="flex items-center gap-1.5">
                 <div className={`w-3 h-1 rounded-full ${editId ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                    {editId ? 'Mode Edit' : 'Point of Sale'}
                 </span>
              </div>
              <h1 className="text-lg font-black text-[#030037] tracking-tight mt-0.5">
                 {editId ? 'Edit' : 'Kasir'} & <span className="text-[#3c39d6]">{editId ? 'Koreksi Transaksi' : 'Penjualan'}</span>
              </h1>
              {profile && (
                 <div className="mt-1 flex flex-col gap-0.5 text-black">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                       <Store className="w-3.5 h-3.5 text-[#3c39d6]" />
                       {profile.business_name || "TOKO UMKM"}
                    </span>
                    {profile.address && (
                       <span className="text-[10px] text-zinc-500 font-bold ml-5">
                          {profile.address}
                       </span>
                    )}
                 </div>
              )}
           </div>

           {/* Header Right: Branch Selector + Riwayat */}
           <div className="flex items-center gap-2 shrink-0">
              {!editId && (
                <button
                  onClick={() => router.push('/backend/tenant/sales/history')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-600 hover:text-[#3c39d6] hover:border-indigo-200 rounded-xl shadow-sm text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <Receipt className="w-3 h-3" />
                  Riwayat
                </button>
              )}

              {/* Branch Lock/Selector */}
               <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2.5 rounded-xl shadow-sm max-w-[260px]">
                  <Store className="w-4 h-4 text-[#3c39d6]" />
                  <div className="flex-1 min-w-0">
                     <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider leading-none mb-1">Cabang Aktif</span>
                     <select
                       disabled={!!profile.userBranchId}
                       className="w-full bg-transparent border-0 p-0 text-xs font-bold text-black focus:ring-0 outline-none cursor-pointer appearance-none disabled:bg-transparent"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} {profile.userBranchId === b.id ? "(Anda)" : ""}
                        </option>
                      ))}
                    </select>
                 </div>
                 {!profile.userBranchId && <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />}
              </div>
           </div>
        </div>

         {/* Edit Mode Banner */}
         {editId && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 p-2.5 rounded-xl shadow-sm">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Edit2 className="w-3 h-3 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 leading-none">Mode Koreksi Aktif</p>
                <p className="text-xs font-bold text-amber-750 truncate mt-0.5">
                  Mengedit nota <span className="font-black">#{reference}</span>. Simpan perubahan untuk update.
                </p>
              </div>
              <button
                onClick={() => router.push('/backend/tenant/sales/history')}
                title="Batal Edit"
                className="p-1.5 bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200 rounded-lg transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
         )}

         {/* Layout Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* LEFT COLUMN: Detail Transaksi */}
             <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest border-b border-zinc-200 pb-3">
                   Detail Transaksi
                </h3>

                <div className="space-y-4">
                   {/* Row 1: Nota & Tanggal */}
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">No. Nota</label>
                         <input 
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10 shadow-sm transition-all"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Tanggal</label>
                         <input 
                            type="date"
                            className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10 shadow-sm transition-all"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                         />
                      </div>
                   </div>

                  {/* Row 2: Nama Pelanggan */}
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Pelanggan</label>
                      <div className="relative flex items-center">
                         <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                         <input 
                            type="text" 
                            placeholder="Pembeli Umum (Default)" 
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10 text-black shadow-sm transition-all"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                         />
                      </div>
                   </div>

                  {/* Row 3: Metode Pembayaran */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Metode Bayar</label>
                      <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map(pm => {
                          const isActive = paymentMethodId === pm.id;
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethodId(pm.id)}
                              className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 select-none ${
                                isActive 
                                  ? "bg-[#10b981] border-[#10b981] text-white shadow-md shadow-emerald-500/20" 
                                  : "bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-800 shadow-sm"
                              }`}
                            >
                              <CreditCard className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                              <span className="text-[10px] truncate max-w-full text-center leading-tight font-black">{pm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                   </div>

                  {/* Uang Dibayar & Kembalian (Khusus Pembayaran Tunai) */}
                   {isCashPayment && (
                      <div className="space-y-2 border-t border-zinc-200/50 pt-3">
                         <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Uang Dibayar (Tunai)</label>
                         <div className="relative flex items-center">
                            <span className="absolute left-3 text-sm font-black text-zinc-900">Rp</span>
                            <input 
                               type="number" 
                               placeholder="0" 
                               className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold outline-none text-black shadow-sm transition-all focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10"
                               value={cashPaid}
                               onChange={(e) => setCashPaid(e.target.value)}
                            />
                         </div>
                         
                         {/* Tombol Pintas Uang */}
                         <div className="flex flex-wrap gap-1.5">
                            <button 
                               type="button" 
                               onClick={() => setCashPaid(cartSubtotal.toString())} 
                               className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded text-xs font-black text-zinc-900 transition-colors uppercase tracking-wider"
                            >
                               Uang Pas
                            </button>
                            {getQuickCashPresets(cartSubtotal).map((preset) => (
                               <button 
                                  key={preset}
                                  type="button" 
                                  onClick={() => setCashPaid(preset.toString())} 
                                  className="px-3 py-1.5 bg-zinc-100 hover:bg-[#10b981] hover:text-white border border-zinc-300 rounded text-xs font-black text-zinc-900 transition-colors"
                               >
                                  {formatCurrency(preset).replace("Rp", "").trim()}
                               </button>
                            ))}
                         </div>

                         {/* Info Kembalian */}
                         <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider pl-0.5 pt-2 border-t border-zinc-100">
                            <span className="text-zinc-500">Kembalian:</span>
                            <span className={`font-mono text-lg font-black ${isPaymentEnough ? "text-emerald-600" : "text-red-500"}`}>
                               {formatCurrency(changeAmount)}
                            </span>
                         </div>
                      </div>
                   )}

                  {/* Total Summary */}
                   <div className="bg-gradient-to-br from-[#030037] to-[#120f4c] text-white p-4.5 rounded-2xl flex justify-between items-center shadow-sm border border-white/5">
                      <div>
                         <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block leading-none mb-1">Total Belanja</span>
                         <span className="text-xs font-bold text-white/50">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)} produk
                         </span>
                      </div>
                      <span className="text-2xl font-black font-mono text-emerald-400">
                         {formatCurrency(cartSubtotal)}
                      </span>
                   </div>

                  {/* Actions */}
                   <div className="flex gap-2 pt-2.5">
                      <button 
                         disabled={isSubmitting}
                         onClick={() => {
                            if (editId) {
                              router.push('/backend/tenant/sales/history');
                            } else if (cart.length > 0 && confirm("Kosongkan keranjang?")) {
                              setCart([]);
                            }
                         }}
                         className="px-4.5 py-3.5 bg-zinc-150 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-300 disabled:opacity-50 shadow-sm"
                      >
                         {editId ? "Batal Edit" : "Reset"}
                      </button>
                      <button
                         onClick={handleSubmitTransaction}
                         disabled={cart.length === 0 || isSubmitting || (isCashPayment && !isPaymentEnough)}
                         className={`flex-1 py-3.5 text-white transition-all font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                           editId 
                             ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                             : "bg-[#10b981] hover:bg-[#059669] shadow-emerald-500/15"
                         }`}
                      >
                         {isSubmitting ? <Check className="w-4 h-4 animate-pulse" /> : (editId ? <Edit2 className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
                         {isSubmitting ? "Memproses..." : (editId ? "Simpan Perubahan" : "Bayar & Selesaikan")}
                      </button>
                   </div>
               </div>
            </div>

            {/* RIGHT COLUMN: Pilih Produk & Keranjang Belanja */}
             <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                
                {/* 1. Pilih Produk Ke Keranjang */}
                <div>
                   <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest pl-0.5 mb-3">
                      Pilih Produk Ke Keranjang
                   </h3>
                   
                   <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      {/* Dropdown Select Product (Searchable Combobox) */}
                      <div className="flex-1 min-w-0 relative">
                         <input
                            type="text"
                            placeholder="Ketik untuk mencari produk..."
                            value={productSearchQuery}
                            onFocus={() => setShowProductDropdown(true)}
                            onChange={(e) => {
                               setProductSearchQuery(e.target.value);
                               setShowProductDropdown(true);
                               if (selectedProductId) setSelectedProductId("");
                            }}
                            className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:border-[#10b981] shadow-sm transition-all"
                         />
                        
                        {showProductDropdown && (
                           <>
                              {/* Overlay Backdrop to close dropdown */}
                              <div 
                                 className="fixed inset-0 z-10" 
                                 onClick={() => setShowProductDropdown(false)}
                              />
                              <div data-lenis-prevent className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-25 divide-y divide-zinc-100 scrollbar-thin">
                                 {searchedProducts.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-zinc-400 font-bold text-center">
                                       Produk tidak ditemukan
                                    </div>
                                 ) : (
                                    searchedProducts.map((p) => {
                                       const stock = p.current_branch_stock ?? 0;
                                       const isOutOfStock = stock <= 0;
                                       return (
                                          <button
                                             key={p.id}
                                             type="button"
                                             disabled={isOutOfStock}
                                             onClick={() => {
                                                setSelectedProductId(p.id);
                                                setProductSearchQuery(p.name);
                                                setShowProductDropdown(false);
                                             }}
                                             className={`w-full px-4 py-3 text-left text-sm font-bold transition-all duration-150 flex items-center justify-between gap-4 border-l-2 border-transparent ${
                                                isOutOfStock
                                                   ? "opacity-50 cursor-not-allowed bg-zinc-50 text-zinc-400"
                                                   : "hover:bg-emerald-50/50 hover:border-emerald-500 text-zinc-900"
                                             }`}
                                          >
                                             <span className="truncate flex-1 min-w-0 text-zinc-900 font-semibold text-left">{p.name}</span>
                                             <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                                   isOutOfStock 
                                                      ? "bg-zinc-100 text-zinc-400" 
                                                      : stock < 10 
                                                         ? "bg-amber-50 border border-amber-200/50 text-amber-600" 
                                                         : "bg-emerald-50 border border-emerald-100/50 text-emerald-600"
                                                }`}>
                                                   Stok: {stock}
                                                </span>
                                             </div>
                                          </button>
                                       );
                                    })
                                 )}
                              </div>
                           </>
                        )}
                     </div>

                      {/* Qty Input Controls */}
                      <div className="flex items-center justify-center gap-2 bg-white border border-zinc-300 px-3.5 py-2.5 rounded-xl w-36 shrink-0 shadow-sm">
                         <button
                            type="button"
                            onClick={() => setInputQty(Math.max(1, inputQty - 1))}
                            className="p-1.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                         >
                            <Minus className="w-3.5 h-3.5" />
                         </button>
                         <input
                            type="number"
                            className="w-12 border-none bg-transparent text-center text-sm font-bold focus:ring-0 p-0 text-zinc-900"
                            value={inputQty}
                            min={1}
                            onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value) || 1))}
                         />
                         <button
                            type="button"
                            onClick={() => setInputQty(inputQty + 1)}
                            className="p-1.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                         >
                            <Plus className="w-3.5 h-3.5" />
                         </button>
                      </div>
 
                      {/* Tombol Tambah */}
                      <button
                         type="button"
                         onClick={handleAddProductFromSelect}
                         className="px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                      >
                         <Plus className="w-4 h-4" /> Tambah
                      </button>
                  </div>
               </div>

               {/* 2. Daftar Keranjang Belanja */}
               <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest flex items-center gap-2">
                         <ShoppingCart className="w-4.5 h-4.5 text-[#3c39d6]" /> Keranjang Belanja
                      </h3>
                      <span className="text-[10px] font-black bg-[#3c39d6]/10 text-[#3c39d6] px-2.5 py-1 rounded-full">
                         {cart.length} produk terpilih
                      </span>
                   </div>
 
                   <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/30 shadow-sm">
                      <div data-lenis-prevent className="max-h-[380px] overflow-y-auto scrollbar-thin">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                  <th className="px-4 py-3">Produk</th>
                                  <th className="px-4 py-3 text-right">Harga</th>
                                  <th className="px-4 py-3 text-center">Qty</th>
                                  <th className="px-4 py-3 text-right">Subtotal</th>
                                  <th className="px-4 py-3 text-center">Aksi</th>
                               </tr>
                            </thead>
                           <tbody className="divide-y divide-zinc-150">
                              {cart.length === 0 ? (
                                 <tr>
                                    <td colSpan={5} className="py-16 text-center text-zinc-400 bg-white">
                                       <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                                       <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Keranjang masih kosong</p>
                                    </td>
                                 </tr>
                              ) : (
                                  cart.map((item) => (
                                     <tr key={item.product.id} className="hover:bg-zinc-100/50 bg-white transition-all text-xs font-bold text-zinc-900 border-b border-zinc-100">
                                        <td className="px-4 py-4">
                                           <div className="whitespace-normal break-words max-w-[180px] sm:max-w-[240px]" title={item.product.name}>
                                              {item.product.name}
                                           </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono">
                                           {formatCurrency(item.product.sell_price)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center gap-0.5 bg-white border border-zinc-300 px-1.5 py-0.5 rounded-md w-16 mx-auto">
                                             <button 
                                                type="button"
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="p-0.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                             >
                                                <Minus className="w-2.5 h-2.5" />
                                             </button>
                                             <input 
                                                type="text" 
                                                className="w-6 border-none bg-transparent text-center text-[10px] font-bold focus:ring-0 p-0 text-zinc-900"
                                                value={item.quantity}
                                                onChange={(e) => handleQtyInput(item.product.id, e.target.value)}
                                             />
                                             <button 
                                                type="button"
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="p-0.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                             >
                                                <Plus className="w-2.5 h-2.5" />
                                             </button>
                                          </div>
                                       </td>
                                        <td className="px-4 py-4 text-right font-mono text-emerald-600">
                                           {formatCurrency(item.product.sell_price * item.quantity)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                           <button 
                                              type="button"
                                              onClick={() => removeFromCart(item.product.id)}
                                              className="p-1.5 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 rounded-md transition-all shadow-sm"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>

            </div>

         </div>

      {/* Success Modal Receipt */}
      {showReceiptModal && lastTransaction && (
        <div 
          onClick={() => {
             setShowReceiptModal(false);
             if (editId) {
                router.push('/backend/tenant/sales');
             }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
           <div 
             onClick={(e) => e.stopPropagation()}
             className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-150 cursor-default"
           >
              <div className="p-6 text-center space-y-4">
                 <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Check className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-black text-[#030037]">Transaksi Berhasil!</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Nota pembayaran berhasil dicatat ke database keuangan.</p>
                 </div>

                 <div className="bg-[#f8f9fa] border border-zinc-200/80 p-4 rounded-2xl text-left text-xs font-bold text-zinc-700 space-y-2">
                    <div className="flex justify-between">
                       <span className="text-zinc-400">Nomor Nota:</span>
                       <span className="text-[#030037]">#{lastTransaction.reference_number}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-zinc-400">Nama Pembeli:</span>
                       <span>{lastTransaction.customer_name}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-200/50 pt-2 mt-2 font-black text-sm">
                       <span className="text-zinc-900">Total:</span>
                       <span className="text-emerald-600">
                          {formatCurrency(lastTransaction.items ? lastTransaction.items.reduce((sum: number, item: any) => sum + (item.product.sell_price * item.quantity), 0) : 0)}
                       </span>
                    </div>
                    {lastTransaction.cash_paid !== undefined && lastTransaction.cash_paid > 0 && (
                       <>
                          <div className="flex justify-between border-t border-zinc-200/30 pt-2 text-xs font-bold text-zinc-700">
                             <span className="text-zinc-400">Bayar (Tunai):</span>
                             <span className="font-mono text-zinc-900">{formatCurrency(lastTransaction.cash_paid)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-zinc-700">
                             <span className="text-zinc-400">Kembalian:</span>
                             <span className="font-mono text-emerald-600">{formatCurrency(lastTransaction.change || 0)}</span>
                          </div>
                       </>
                    )}
                 </div>

                 <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                       <button 
                          onClick={() => { setShowReceiptModal(false); router.push('/backend/tenant/sales/history'); }}
                          className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                       >
                          Lihat Riwayat
                       </button>
                       <button 
                          onClick={handlePrintReceipt}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                       >
                          <Printer className="w-3 h-3" /> Cetak PDF
                       </button>
                    </div>
                    
                    {isBluetoothSupported ? (
                       <button 
                          onClick={handlePrintBluetoothDirect}
                          disabled={isPrintingBt}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#3c39d6] hover:bg-black disabled:bg-zinc-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                       >
                          <Printer className={`w-3.5 h-3.5 ${isPrintingBt ? "animate-pulse" : ""}`} />
                          {isPrintingBt ? "Menghubungkan Printer..." : "Cetak Bluetooth (Direct)"}
                       </button>
                    ) : (
                       <div className="w-full p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold text-center rounded-xl space-y-1.5">
                          <p className="text-[10px] leading-tight">
                            Printer Bluetooth: <span className="text-red-600">Tidak tersedia</span>
                          </p>
                          <p className="text-[8px] font-normal opacity-75">
                            Browser: Chrome | HTTPS
                          </p>
                          {navigator.userAgent.includes("Linux") && (
                            <p className="text-[8px] font-normal leading-tight">
                              Di Linux, pastikan: &nbsp;
                              <code className="bg-amber-100 px-1 rounded">sudo apt install bluez</code> &nbsp;
                              dan user ada di grup <code className="bg-amber-100 px-1 rounded">bluetooth</code>.
                              Restart Chrome setelahnya.
                            </p>
                          )}
                          <div className="flex gap-1.5 justify-center mt-1">
                            <button
                              onClick={checkBluetoothSupport}
                              className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 px-2.5 py-1.5 rounded-lg transition-colors text-[9px]"
                            >
                              <Package className="w-2.5 h-2.5" /> Cek Ulang
                            </button>
                            <button
                              onClick={handlePrintReceipt}
                              className="flex items-center gap-1 bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1.5 rounded-lg transition-colors text-[9px]"
                            >
                              <Printer className="w-2.5 h-2.5" /> Cetak PDF
                            </button>
                          </div>
                       </div>
                    )}

                     <button
                        onClick={() => {
                           setShowReceiptModal(false);
                           if (editId) {
                              router.push('/backend/tenant/sales');
                           }
                        }}
                        className="w-full py-2 text-zinc-400 hover:text-zinc-600 text-[10px] font-bold tracking-widest transition-colors"
                     >
                        + Transaksi Baru
                     </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      </div>
    </div>
  );
}
