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
  Search,
  Layers
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { getPOSProductsAction, savePOSTransactionAction } from "./actions";
import { div } from "framer-motion/client";

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
let cachedGattServer: any = null;
let cachedWriteChar: any = null;
let cachedUsbDevice: any = null;

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
  const [isBtConnected, setIsBtConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);

  // USB Thermal Printer States
  const [isUsbSupported, setIsUsbSupported] = useState(false);
  const [isUsbConnected, setIsUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [isPrintingUsb, setIsPrintingUsb] = useState(false);
  const [printMethod, setPrintMethod] = useState<"bluetooth" | "usb">("usb");

  // Pagination & Search Cache optimization
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === "all" || p.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  }, [filteredProducts]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const checkBluetoothSupport = useCallback(() => {
    setIsBluetoothSupported(typeof window !== "undefined" && !!(navigator as any).bluetooth);
  }, []);

  const checkUsbSupport = useCallback(() => {
    setIsUsbSupported(typeof window !== "undefined" && !!(navigator as any).usb);
  }, []);

  useEffect(() => {
    checkBluetoothSupport();
    checkUsbSupport();
  }, [checkBluetoothSupport, checkUsbSupport]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!!(navigator as any).usb) {
        setPrintMethod("usb");
      } else if (!!(navigator as any).bluetooth) {
        setPrintMethod("bluetooth");
      }
    }
  }, []);

  useEffect(() => {
    if (cachedPrinterDevice && cachedPrinterDevice.gatt?.connected) {
      setIsBtConnected(true);
      setBluetoothDeviceName(cachedPrinterDevice.name || "Thermal Printer");
    }
    if (cachedUsbDevice && cachedUsbDevice.opened) {
      setIsUsbConnected(true);
      setUsbDeviceName(cachedUsbDevice.productName || "USB Printer");
    }
    return () => {
      if (cachedPrinterDevice && cachedPrinterDevice.gatt?.connected) {
        console.log("Disconnecting printer on page unmount...");
        cachedPrinterDevice.gatt.disconnect();
      }
    };
  }, []);

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

  const connectBluetoothPrinter = async (forceNewScan = false) => {
    if (!(navigator as any).bluetooth) {
      throw new Error("Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome versi terbaru.");
    }

    let device = cachedPrinterDevice;

    if (forceNewScan || !device) {
      if (cachedPrinterDevice?.gatt?.connected) {
        try {
          cachedPrinterDevice.gatt.disconnect();
        } catch (_) {}
      }
      cachedPrinterDevice = null;
      cachedGattServer = null;
      cachedWriteChar = null;
      setIsBtConnected(false);
      setBluetoothDeviceName(null);
      
      if (!forceNewScan && typeof (navigator as any).bluetooth.getDevices === "function") {
        try {
          const pairedDevices = await (navigator as any).bluetooth.getDevices();
          device = pairedDevices.find((d: any) => {
            const name = d.name || "";
            return BT_NAME_PREFIXES.some(p => name.startsWith(p));
          });
        } catch (e) {
          console.warn("Gagal membaca daftar perangkat terpasang:", e);
        }
      }

      if (!device) {
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            ...BT_SERVICE_UUIDS.map(u => ({ services: [u] })),
            ...BT_NAME_PREFIXES.map(p => ({ namePrefix: p })),
          ],
          optionalServices: BT_SERVICE_UUIDS,
        });
      }
      cachedPrinterDevice = device;
    }

    if (device && !device.listenerAdded) {
      device.addEventListener("gattserverdisconnected", () => {
        console.log("Printer terputus (GATT disconnected) — reset semua cache");
        // Invalidate semua cache agar reconnect dipaksa pada cetak berikutnya
        cachedGattServer = null;
        cachedWriteChar = null;
        // Jangan null-kan cachedPrinterDevice agar device object tetap tersedia untuk reconnect
        // namun tandai bahwa perlu koneksi ulang
        setIsBtConnected(false);
        setBluetoothDeviceName(null);
      });
      device.listenerAdded = true;
    }

    // Selalu reconnect jika GATT tidak terhubung (menangani auto-disconnect setelah idle)
    let server = cachedGattServer;
    if (!server || !device.gatt.connected) {
      // Reset writeChar juga karena server sudah disconnected
      cachedWriteChar = null;
      try {
        console.log("Menghubungkan ulang ke GATT server...");
        server = await device.gatt.connect();
        cachedGattServer = server;
      } catch (connectErr: any) {
        console.error("Gagal menghubungkan ke printer:", connectErr);
        cachedPrinterDevice = null;
        cachedGattServer = null;
        cachedWriteChar = null;
        setIsBtConnected(false);
        setBluetoothDeviceName(null);
        throw new Error(`Gagal terhubung ke printer. Pastikan printer menyala, berada dalam jangkauan, dan tidak terhubung ke perangkat lain.`);
      }
    }

    // Selalu discover ulang writeChar jika null (akibat disconnect)
    let writeChar = cachedWriteChar;
    if (!writeChar) {
      console.log("Mencari Write Characteristic...");
      for (const uuid of BT_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(uuid);
          const characteristics = await service.getCharacteristics();
          writeChar = characteristics.find(
            (c: any) => c.properties.write || c.properties.writeWithoutResponse
          );
          if (writeChar) break;
        } catch {
          // Lanjutkan ke UUID berikutnya
        }
      }

      if (!writeChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const service of allServices) {
            const characteristics = await service.getCharacteristics();
            writeChar = characteristics.find(
              (c: any) => c.properties.write || c.properties.writeWithoutResponse
            );
            if (writeChar) break;
          }
        } catch (svcErr: any) {
          // Jika getPrimaryServices gagal karena server disconnected, lempar error yang jelas
          console.error("getPrimaryServices gagal:", svcErr);
          cachedGattServer = null;
          cachedWriteChar = null;
          throw new Error(`Server printer terputus saat mencari service. Coba cetak lagi untuk menghubungkan ulang secara otomatis.`);
        }
      }

      if (!writeChar) {
        throw new Error("Tidak menemukan port tulis data printer (Write Characteristic)");
      }
      cachedWriteChar = writeChar;
    }

    setIsBtConnected(true);
    setBluetoothDeviceName(device.name || "Thermal Printer");
    return writeChar;
  };

  const handleConnectPrinterManual = async () => {
    try {
      setIsPrintingBt(true);
      await connectBluetoothPrinter(true);
      toast.success("Printer berhasil dihubungkan!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal menghubungkan printer: ${err.message || err}`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const handleDisconnectPrinterManual = async () => {
    try {
      if (cachedPrinterDevice?.gatt?.connected) {
        await cachedPrinterDevice.gatt.disconnect();
      }
      cachedPrinterDevice = null;
      cachedGattServer = null;
      cachedWriteChar = null;
      setIsBtConnected(false);
      setBluetoothDeviceName(null);
      toast.success("Koneksi printer diputuskan.");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memutuskan koneksi printer");
    }
  };

  const connectUsbPrinter = async (forceNewScan = false) => {
    if (!(navigator as any).usb) {
      throw new Error("Browser Anda tidak mendukung WebUSB. Silakan gunakan Google Chrome.");
    }

    let device = cachedUsbDevice;

    if (forceNewScan || !device || !device.opened) {
      cachedUsbDevice = null;
      setIsUsbConnected(false);
      setUsbDeviceName(null);

      if (!forceNewScan) {
        try {
          const pairedDevices = await (navigator as any).usb.getDevices();
          if (pairedDevices.length > 0) {
            device = pairedDevices[0];
          }
        } catch (e) {
          console.warn("Gagal membaca daftar perangkat USB terpasang:", e);
        }
      }

      if (!device) {
        device = await (navigator as any).usb.requestDevice({
          filters: []
        });
      }
      cachedUsbDevice = device;
    }

    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    let interfaceNumber: number | null = null;
    let endpointNumber: number | null = null;

    for (const config of device.configurations) {
      for (const iface of config.interfaces) {
        for (const alternate of iface.alternates) {
          if (alternate.interfaceClass === 7) {
            interfaceNumber = iface.interfaceNumber;
            const outEndpoint = alternate.endpoints.find(
              (ep: any) => ep.direction === "out" && ep.type === "bulk"
            );
            if (outEndpoint) {
              endpointNumber = outEndpoint.endpointNumber;
              break;
            }
          }
        }
        if (interfaceNumber !== null) break;
      }
      if (interfaceNumber !== null) break;
    }

    if (interfaceNumber === null || endpointNumber === null) {
      console.warn("Printer class 7 not found, trying fallback to any bulk-out endpoint...");
      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          for (const alternate of iface.alternates) {
            const outEndpoint = alternate.endpoints.find(
              (ep: any) => ep.direction === "out" && ep.type === "bulk"
            );
            if (outEndpoint) {
              interfaceNumber = iface.interfaceNumber;
              endpointNumber = outEndpoint.endpointNumber;
              break;
            }
          }
          if (interfaceNumber !== null) break;
        }
        if (interfaceNumber !== null) break;
      }
    }

    if (interfaceNumber === null || endpointNumber === null) {
      throw new Error("Tidak dapat menemukan interface/endpoint bulk out printer pada perangkat USB ini.");
    }

    try {
      await device.claimInterface(interfaceNumber);
    } catch (claimErr: any) {
      console.warn("Claim interface failed, attempting anyway:", claimErr);
    }

    setIsUsbConnected(true);
    setUsbDeviceName(device.productName || "USB Printer");

    return { device, endpointNumber, interfaceNumber };
  };

  const handleConnectUsbManual = async () => {
    try {
      setIsPrintingUsb(true);
      await connectUsbPrinter(true);
      toast.success("Printer USB berhasil dihubungkan!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal menghubungkan printer USB: ${err.message || err}`);
    } finally {
      setIsPrintingUsb(false);
    }
  };

  const handleDisconnectUsbManual = async () => {
    try {
      if (cachedUsbDevice && cachedUsbDevice.opened) {
        await cachedUsbDevice.close();
      }
      cachedUsbDevice = null;
      setIsUsbConnected(false);
      setUsbDeviceName(null);
      toast.success("Koneksi printer USB diputuskan.");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memutuskan koneksi printer USB");
    }
  };

  const handlePrintUsbDirect = async () => {
    if (!lastTransaction) return;
    try {
      setIsPrintingUsb(true);

      if (!(navigator as any).usb) {
        toast.error("Browser Anda tidak mendukung WebUSB. Silakan gunakan Google Chrome.");
        return;
      }

      const { device, endpointNumber } = await connectUsbPrinter(false);

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
      const chunkSize = 64;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await device.transferOut(endpointNumber, chunk);
      }

      toast.success("Nota berhasil dicetak via Kabel USB!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal cetak Kabel USB: ${err.message || err}`);
    } finally {
      setIsPrintingUsb(false);
    }
  };

  const handlePrintBluetoothDirect = async () => {
    if (!lastTransaction) return;
    try {
      setIsPrintingBt(true);

      if (!(navigator as any).bluetooth) {
        toast.error("Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome versi terbaru.");
        return;
      }

      // Jika cache writeChar ada tapi koneksi sudah terputus, paksa reset sebelum connect
      if (cachedWriteChar && cachedPrinterDevice && !cachedPrinterDevice.gatt?.connected) {
        console.log("Koneksi GATT terputus sejak cetak terakhir — reset cache sebelum reconnect");
        cachedGattServer = null;
        cachedWriteChar = null;
      }

      const writeChar = await connectBluetoothPrinter(false);

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
          await writeChar.writeValue(chunk);
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      toast.success("Nota berhasil dicetak via Bluetooth!");
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
            
            {/* LEFT COLUMN: Detail Transaksi & Keranjang Belanja */}
            <div className="lg:col-span-5 space-y-4">
               {/* Card 1: Detail Transaksi */}
               <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
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

               {/* Card 2: Daftar Keranjang Belanja */}
               <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
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

            {/* RIGHT COLUMN: Pilih Produk */}
             <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                
                {/* 1. Pilih Produk Ke Keranjang (Grid Visual optimized) */}
                <div className="space-y-4">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                      <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest pl-0.5">
                         Pilih Produk Ke Keranjang
                      </h3>
                      <span className="text-[10px] font-black bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full uppercase tracking-wider">
                         {filteredProducts.length} Produk Tersedia
                      </span>
                   </div>
                   
                   {/* Search Bar */}
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                         type="text" 
                         placeholder="Cari produk berdasarkan nama..." 
                         value={searchQuery}
                         onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                         }}
                         className="w-full pl-11 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:border-[#10b981] shadow-sm transition-all"
                      />
                      {searchQuery && (
                         <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655"
                         >
                            <X className="w-4 h-4" />
                         </button>
                      )}
                   </div>

                   {/* Kategori Slider */}
                   <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-thin select-none">
                      <button
                         type="button"
                         onClick={() => { setSelectedCategoryId("all"); setCurrentPage(1); }}
                         className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap ${
                            selectedCategoryId === "all"
                               ? "bg-[#3c39d6] text-white border-transparent shadow-sm"
                               : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                         }`}
                      >
                         📂 Semua Kategori
                      </button>
                      {categories.map((c) => (
                         <button
                            key={c.id}
                            type="button"
                            onClick={() => { setSelectedCategoryId(c.id); setCurrentPage(1); }}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap ${
                               selectedCategoryId === c.id
                                  ? "bg-[#3c39d6] text-white border-transparent shadow-sm"
                                  : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                            }`}
                         >
                            {c.name}
                         </button>
                      ))}
                   </div>

                   {/* Grid Produk */}
                   {paginatedProducts.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-2 bg-zinc-50/50 rounded-2xl border border-zinc-150">
                         <Package className="w-10 h-10 text-zinc-300" />
                         <span className="text-xs font-bold text-zinc-400">Tidak ada produk ditemukan</span>
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                         {paginatedProducts.map((p) => {
                            const stock = p.current_branch_stock ?? 0;
                            const isOutOfStock = stock <= 0;
                            return (
                               <div
                                  key={p.id}
                                  onClick={() => !isOutOfStock && addToCart(p)}
                                  className={`group relative p-2.5 bg-white border border-zinc-200 rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-sm ${
                                     isOutOfStock
                                        ? "opacity-50 cursor-not-allowed bg-zinc-50"
                                        : "cursor-pointer hover:border-[#10b981] hover:shadow-md hover:scale-[1.01]"
                                  }`}
                               >
                                  {/* Gambar */}
                                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-50/80 border border-zinc-100 flex items-center justify-center mb-2 shrink-0">
                                     {p.image_url ? (
                                        <img 
                                           src={p.image_url} 
                                           alt={p.name}
                                           loading="lazy"
                                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                     ) : (
                                        <Package className="w-7 h-7 text-zinc-300 group-hover:scale-110 transition-transform duration-300" />
                                     )}

                                     {/* Overlay Stock / Badge */}
                                     {isOutOfStock ? (
                                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-1">
                                           <span className="text-[8px] font-black uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded-md">
                                              Habis
                                           </span>
                                        </div>
                                     ) : stock < 10 ? (
                                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                           Stok: {stock}
                                        </span>
                                     ) : null}
                                  </div>

                                  {/* Info Produk */}
                                  <div className="space-y-1.5">
                                     <h4 className="text-[10px] font-bold text-zinc-900 leading-tight line-clamp-2 h-7" title={p.name}>
                                        {p.name}
                                     </h4>
                                     <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100">
                                        <span className="text-[11px] font-black text-emerald-600 font-mono">
                                           {formatCurrency(p.sell_price).replace("Rp", "").trim()}
                                        </span>
                                        {!isOutOfStock && stock >= 10 && (
                                           <span className="text-[9px] font-bold text-zinc-400">
                                              Stok: {stock}
                                           </span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}

                   {/* Pagination Controls */}
                   {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1.5">
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-0.5">
                            Hal {currentPage} / {totalPages} ({filteredProducts.length} Produk)
                         </span>
                         <div className="flex gap-2">
                            <button
                               type="button"
                               disabled={currentPage === 1}
                               onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                               className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer"
                            >
                               Prev
                            </button>
                            <button
                               type="button"
                               disabled={currentPage === totalPages}
                               onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                               className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer"
                            >
                               Next
                            </button>
                         </div>
                      </div>
                   )}
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
                    
                    {/* Segmented Tab Selector */}
                    <div className="p-1 bg-zinc-100 rounded-xl flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPrintMethod("usb")}
                        className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          printMethod === "usb"
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-855"
                        }`}
                      >
                        🔌 Kabel USB
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintMethod("bluetooth")}
                        className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          printMethod === "bluetooth"
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-855"
                        }`}
                      >
                        📶 Bluetooth
                      </button>
                    </div>

                    {/* Print Method Content */}
                    {printMethod === "usb" ? (
                      <div className="space-y-2">
                        {isUsbSupported ? (
                          <>
                            <button 
                               type="button"
                               onClick={handlePrintUsbDirect}
                               disabled={isPrintingUsb}
                               className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#3c39d6] hover:bg-black disabled:bg-zinc-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                               <Printer className={`w-3.5 h-3.5 ${isPrintingUsb ? "animate-pulse" : ""}`} />
                               {isPrintingUsb ? "Memproses..." : "Cetak via Kabel (Direct)"}
                            </button>
                            <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${isUsbConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}></span>
                                <span className="text-zinc-900">
                                  Status: {isUsbConnected ? `Terhubung (${usbDeviceName})` : "Terputus"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleConnectUsbManual}
                                  className="text-[#3c39d6] hover:text-black font-black hover:underline"
                                >
                                  {isUsbConnected ? "Ganti" : "Hubungkan"}
                                </button>
                                {isUsbConnected && (
                                  <button
                                    type="button"
                                    onClick={handleDisconnectUsbManual}
                                    className="text-red-600 hover:text-red-800 font-black hover:underline"
                                  >
                                    Putus
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold text-center rounded-xl">
                            <p className="text-[10px] leading-tight">
                              Kabel USB: <span className="text-red-600">Tidak didukung browser</span>
                            </p>
                            <p className="text-[8px] font-normal opacity-75 mt-1">
                              Gunakan Google Chrome atau Microsoft Edge untuk dukungan WebUSB.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isBluetoothSupported ? (
                          <>
                            <button 
                               type="button"
                               onClick={handlePrintBluetoothDirect}
                               disabled={isPrintingBt}
                               className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#3c39d6] hover:bg-black disabled:bg-zinc-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                               <Printer className={`w-3.5 h-3.5 ${isPrintingBt ? "animate-pulse" : ""}`} />
                               {isPrintingBt ? "Memproses..." : "Cetak via Bluetooth (Direct)"}
                            </button>
                            <div className="flex items-center justify-between px-1 text-[9px] font-black uppercase tracking-wider">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${isBtConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}></span>
                                <span className="text-zinc-900">
                                  Status: {isBtConnected ? `Terhubung (${bluetoothDeviceName})` : "Terputus"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleConnectPrinterManual}
                                  className="text-[#3c39d6] hover:text-black font-black hover:underline"
                                >
                                  {isBtConnected ? "Ganti" : "Hubungkan"}
                                </button>
                                {isBtConnected && (
                                  <button
                                    type="button"
                                    onClick={handleDisconnectPrinterManual}
                                    className="text-red-600 hover:text-red-800 font-black hover:underline"
                                  >
                                    Putus
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
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
                                Di Linux, pastikan user ada di grup <code className="bg-amber-100 px-1 rounded">bluetooth</code>.
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={checkBluetoothSupport}
                              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-700 py-1.5 rounded-lg transition-colors text-[9px]"
                            >
                              Cek Ulang Bluetooth
                            </button>
                          </div>
                        )}
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
