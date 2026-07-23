"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import {
  Search,
  Calendar,
  ShoppingCart,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Printer,
  X,
  Package,
  User,
  ArrowLeft,
  Plus,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Hash,
  ShoppingBag,
  CreditCard,
  XCircle,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { deleteSalesTransactionAction, getSalesHistoryPageData } from "../actions";
import ReceiptModal from "../ReceiptModal";
import { printReceiptPdf, buildReceiptDataFromSaleTransaction } from "../receiptUtils";

interface TransactionItem {
  id: string;
  name: string;
  amount: number;
  quantity: number | null;
  product_id: string | null;
  payment_method_id: string | null;
  categories?: { name: string } | null;
  payment_methods?: { name: string } | null;
}

interface SaleTransaction {
  id: string;
  reference_number: string | null;
  transaction_date: string;
  total_income: number;
  description: string | null;
  customer_name: string | null;
  created_at: string;
  transaction_items: TransactionItem[];
  branch_id: string | null;
  order_status: number | null;
}

interface SalesHistoryTableProps {
  initialData: SaleTransaction[];
  total: number;
  totalPages: number;
  stats: {
    totalRevenue: number;
    totalItems: number;
  };
  businessName: string;
  avatarUrl?: string | null;
  address?: string | null;
  searchParams: {
    search?: string;
    dateStart?: string;
    dateEnd?: string;
    page?: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  products?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  payment_method: string;
  total_price: string;
  status: "PENDING" | "SUCCESS" | "CANCELLED";
  created_at: string;
  branches?: {
    name: string;
  } | null;
  order_items: OrderItem[];
}

const wrapText = (text: string, maxWidth: number = 32): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxWidth) {
        let remaining = word;
        while (remaining.length > maxWidth) {
          lines.push(remaining.slice(0, maxWidth));
          remaining = remaining.slice(maxWidth);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
};

export default function SalesHistoryTable({
  initialData,
  total,
  totalPages,
  stats,
  businessName,
  avatarUrl,
  address,
  searchParams
}: SalesHistoryTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Cache & Dynamic States for POS Sales History
  const [data, setData] = useState<SaleTransaction[]>(initialData);
  const [totalCount, setTotalCount] = useState(total);
  const [pagesCount, setPagesCount] = useState(totalPages);
  const [currentStats, setCurrentStats] = useState(stats);
  const [currentPage, setCurrentPage] = useState(searchParams.page ? Number(searchParams.page) : 1);
  const [isLoading, setIsLoading] = useState(false);

  // Direct Thermal Printing States (WebUSB & WebBluetooth)
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

  const cacheRef = useRef<Record<string, { data: SaleTransaction[]; total: number; totalPages: number; stats: any }>>({});

  // Sync state & cache when server-side props change (e.g. after deletion or order confirmation)
  useEffect(() => {
    setData(initialData);
    setTotalCount(total);
    setPagesCount(totalPages);
    setCurrentStats(stats);
    setCurrentPage(searchParams.page ? Number(searchParams.page) : 1);

    const initialKey = `${searchVal}_${dateStartVal}_${dateEndVal}_${searchParams.page ? Number(searchParams.page) : 1}`;
    cacheRef.current[initialKey] = {
      data: initialData,
      total,
      totalPages,
      stats
    };
  }, [initialData, total, totalPages, stats, searchParams.page]);

  // Client-side fetching with cache (Stale-While-Revalidate without blocking loader)
  const fetchData = async (search: string, dateStart: string, dateEnd: string, page: number) => {
    const cacheKey = `${search}_${dateStart}_${dateEnd}_${page}`;

    // Update URL query parameters silently
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateStart) params.set("dateStart", dateStart);
    if (dateEnd) params.set("dateEnd", dateEnd);
    if (page > 1) params.set("page", String(page));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", newUrl);

    // If cached, restore instantly
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setData(cached.data);
      setTotalCount(cached.total);
      setPagesCount(cached.totalPages);
      setCurrentStats(cached.stats);
      setCurrentPage(page);
      return;
    }

    try {
      setIsLoading(true);
      const res = await getSalesHistoryPageData({
        search,
        dateStart,
        dateEnd,
        page,
        limit: 5
      });

      if (res.status === "success" && res.data) {
        const resultData = {
          data: res.data as SaleTransaction[],
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          stats: res.stats || { totalRevenue: 0, totalItems: 0 }
        };

        // Cache the result
        cacheRef.current[cacheKey] = resultData;

        setData(resultData.data);
        setTotalCount(resultData.total);
        setPagesCount(resultData.totalPages);
        setCurrentStats(resultData.stats);
        setCurrentPage(page);
      } else {
        toast.error(res.message || "Gagal memuat data penjualan.");
      }
    } catch {
      toast.error("Kesalahan jaringan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  // State lokal untuk filter input
  const [searchVal, setSearchVal] = useState(searchParams.search || "");
  const [dateStartVal, setDateStartVal] = useState(searchParams.dateStart || "");
  const [dateEndVal, setDateEndVal] = useState(searchParams.dateEnd || "");

  // Tab State
  const [activeTab, setActiveTab] = useState<"offline" | "online">("offline");

  // E-Catalog Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [searchQueryOnline, setSearchQueryOnline] = useState("");
  const [onlineStatusFilter, setOnlineStatusFilter] = useState<"ALL" | "PENDING" | "SUCCESS" | "CANCELLED">("ALL");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    orderId: string;
    reference: string;
    newStatus: "SUCCESS" | "CANCELLED";
    message: string;
  }>({
    isOpen: false,
    orderId: "",
    reference: "",
    newStatus: "SUCCESS",
    message: "",
  });

  // Fetch paginated E-Catalog Orders
  const fetchOrders = async (page = 1, search = "", status = "ALL") => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "5" });
      if (search) params.set("search", search);
      if (status && status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/backend/tenant/orders?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setOrders(result.data || []);
        setOrdersPage(result.page || 1);
        setOrdersTotalPages(result.totalPages || 1);
        setOrdersTotal(result.total || 0);
        // Hitung total PENDING dari response
        if (result.page === 1 && search === "" && (!status || status === "ALL")) {
          setPendingOrdersCount(prev => prev);
        }
      }
    } catch {
      console.error("Kesalahan jaringan pesanan online.");
    }
  };

  // Fetch count of PENDING orders separately on mount
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/backend/tenant/orders?limit=1&status=PENDING");
        if (res.ok) {
          const result = await res.json();
          setPendingOrdersCount(result.total || 0);
        }
      } catch {}
    };
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (activeTab === "online") {
      fetchOrders(1, searchQueryOnline, onlineStatusFilter);
    }
  }, [activeTab]);

  const onlineSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleOnlineSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQueryOnline(value);
    if (onlineSearchTimeoutRef.current) clearTimeout(onlineSearchTimeoutRef.current);
    onlineSearchTimeoutRef.current = setTimeout(() => {
      fetchOrders(1, value, onlineStatusFilter);
    }, 400);
  };

  const handleOnlineStatusFilter = (status: "ALL" | "PENDING" | "SUCCESS" | "CANCELLED") => {
    setOnlineStatusFilter(status);
    fetchOrders(1, searchQueryOnline, status);
  };

  const handleOrdersPageChange = (newPage: number) => {
    fetchOrders(newPage, searchQueryOnline, onlineStatusFilter);
  };

  const triggerUpdateStatus = (orderId: string, reference: string, newStatus: "SUCCESS" | "CANCELLED") => {
    const message = newStatus === "SUCCESS"
      ? `Konfirmasi lunas pesanan ${reference}? Tindakan ini akan memotong stok produk dan mencatat pemasukan keuangan secara otomatis.`
      : `Batalkan pesanan ${reference}?`;
      
    setConfirmModal({
      isOpen: true,
      orderId,
      reference,
      newStatus,
      message,
    });
  };

  const handleConfirmAction = async () => {
    const { orderId, newStatus } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch("/api/backend/tenant/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(newStatus === "SUCCESS" ? "Pembayaran berhasil dikonfirmasi & stok berkurang!" : "Pesanan berhasil dibatalkan.");
        fetchOrders(1, searchQueryOnline, onlineStatusFilter);
        router.refresh();
      } else {
        toast.error(data.error || "Gagal memperbarui status pesanan.");
      }
    } catch {
      toast.error("Kesalahan jaringan saat memproses aksi.");
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const [selectedTx, setSelectedTx] = useState<SaleTransaction | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchVal(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchData(value, dateStartVal, dateEndVal, 1);
    }, 400);
  };

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateStartVal(value);
    fetchData(searchVal, value, dateEndVal, 1);
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateEndVal(value);
    fetchData(searchVal, dateStartVal, value, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchData(searchVal, dateStartVal, dateEndVal, newPage);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data penjualan ini? Stok akan dikembalikan secara otomatis.")) return;
    try {
      const res = await deleteSalesTransactionAction(id);
      if (res.status === "success") {
        toast.success("Data penjualan berhasil dihapus");
        if (selectedTx?.id === id) setSelectedTx(null);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menghapus data penjualan");
      }
    } catch {
      toast.error("Kesalahan jaringan");
    }
  };

  const handlePrintNota = async (tx: SaleTransaction) => {
    await printReceiptPdf(
      {
        business_name: businessName,
        branch_name: "Cabang Utama",
        address: address,
        avatar_url: avatarUrl,
      },
      buildReceiptDataFromSaleTransaction(tx)
    );
  };

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

  const handlePrintUsbDirect = async (tx: SaleTransaction) => {
    if (!(navigator as any).usb) {
      toast.error("Browser Anda tidak mendukung WebUSB.");
      return;
    }
    try {
      setIsPrintingUsb(true);
      const paired = await (navigator as any).usb.getDevices();
      let device = paired.length > 0 ? paired[0] : await (navigator as any).usb.requestDevice({ filters: [] });
      if (!device.opened) await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);

      let interfaceNumber: number | null = null;
      let endpointNumber: number | null = null;
      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          for (const alternate of iface.alternates) {
            const outEndpoint = alternate.endpoints.find((ep: any) => ep.direction === "out" && ep.type === "bulk");
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
      if (interfaceNumber === null || endpointNumber === null) throw new Error("Endpoint USB tidak ditemukan.");
      try { await device.claimInterface(interfaceNumber); } catch (_) {}

      const encoder = new TextEncoder();
      const ESC = "\x1b";
      const GS = "\x1d";
      const LF = "\n";

      let data = "";
      data += ESC + "@";
      data += ESC + "a" + "\x01";
      data += ESC + "!" + "\x10";
      data += (businessName || "SIPPETO POS").toUpperCase() + LF;
      data += ESC + "!" + "\x00";

      if (address) data += address + LF;
      data += "--------------------------------" + LF;

      data += ESC + "a" + "\x00";
      data += `Nota : #${tx.reference_number}` + LF;
      data += `Tgl  : ${new Date(tx.transaction_date).toLocaleDateString("id-ID")}` + LF;
      data += `Cust : ${tx.customer_name || "Pembeli Umum"}` + LF;
      const payMethod = tx.transaction_items[0]?.payment_methods?.name || "Tunai";
      data += `Bayar: ${payMethod}` + LF;
      data += "--------------------------------" + LF;

      tx.transaction_items.forEach((item) => {
        const cleanName = item.name.replace(/\s*\(x\d+\)/, "");
        const qty = item.quantity || 1;
        const unitPrice = Math.round(item.amount / qty);
        const nameLines = wrapText(cleanName, 32);
        nameLines.forEach((l: string) => { data += l + LF; });

        const qtyText = `${qty} x ${new Intl.NumberFormat("id-ID").format(unitPrice)}`;
        const subtotalText = new Intl.NumberFormat("id-ID").format(item.amount);
        const spacesCount = 32 - qtyText.length - subtotalText.length;
        if (spacesCount >= 1) {
          data += qtyText + " ".repeat(spacesCount) + subtotalText + LF;
        } else {
          data += qtyText + LF;
          data += " ".repeat(Math.max(0, 32 - subtotalText.length)) + subtotalText + LF;
        }
      });

      data += "--------------------------------" + LF;
      const totalText = "TOTAL BAYAR:";
      const totalVal = new Intl.NumberFormat("id-ID").format(Number(tx.total_income));
      const totalSpaces = 32 - totalText.length - totalVal.length;
      data += totalText + " ".repeat(Math.max(1, totalSpaces)) + totalVal + LF + LF;

      data += ESC + "a" + "\x01";
      data += "terima kasih atas pesanan anda ." + LF;
      data += "dicetak dari Sippeto POS system" + LF;
      data += LF + LF + LF;
      data += GS + "V" + "\x41" + "\x03";

      const bytes = encoder.encode(data);
      for (let i = 0; i < bytes.length; i += 64) {
        await device.transferOut(endpointNumber, bytes.slice(i, i + 64));
      }
      toast.success("Nota berhasil dicetak via USB!");
    } catch (e: any) {
      if (e.name !== "NotFoundError") toast.error(`Gagal cetak USB: ${e.message || e}`);
    } finally {
      setIsPrintingUsb(false);
    }
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

  const handlePrintBluetoothDirect = async (tx: SaleTransaction) => {
    try {
      setIsPrintingBt(true);
      const device = await connectBluetoothPrinter(false);
      if (!device || !device.gatt || !device.gatt.connected) {
        throw new Error("Printer Bluetooth tidak terhubung.");
      }

      const server = device.gatt;
      const services = await server.getPrimaryServices();
      let targetChar: any = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetChar = char;
            break;
          }
        }
        if (targetChar) break;
      }

      if (!targetChar) throw new Error("Karakteristik Bluetooth tidak ditemukan.");

      const encoder = new TextEncoder();
      const ESC = "\x1b";
      const GS = "\x1d";
      const LF = "\n";

      let data = "";
      data += ESC + "@";
      data += ESC + "a" + "\x01";
      data += ESC + "!" + "\x10";
      data += (businessName || "SIPPETO POS").toUpperCase() + LF;
      data += ESC + "!" + "\x00";

      if (address) data += address + LF;
      data += "--------------------------------" + LF;

      data += ESC + "a" + "\x00";
      data += `Nota : #${tx.reference_number}` + LF;
      data += `Tgl  : ${new Date(tx.transaction_date).toLocaleDateString("id-ID")}` + LF;
      data += `Cust : ${tx.customer_name || "Pembeli Umum"}` + LF;
      const payMethod = tx.transaction_items[0]?.payment_methods?.name || "Tunai";
      data += `Bayar: ${payMethod}` + LF;
      data += "--------------------------------" + LF;

      tx.transaction_items.forEach((item) => {
        const cleanName = item.name.replace(/\s*\(x\d+\)/, "");
        const qty = item.quantity || 1;
        const unitPrice = Math.round(item.amount / qty);
        const nameLines = wrapText(cleanName, 32);
        nameLines.forEach((l: string) => { data += l + LF; });

        const qtyText = `${qty} x ${new Intl.NumberFormat("id-ID").format(unitPrice)}`;
        const subtotalText = new Intl.NumberFormat("id-ID").format(item.amount);
        const spacesCount = 32 - qtyText.length - subtotalText.length;
        if (spacesCount >= 1) {
          data += qtyText + " ".repeat(spacesCount) + subtotalText + LF;
        } else {
          data += qtyText + LF;
          data += " ".repeat(Math.max(0, 32 - subtotalText.length)) + subtotalText + LF;
        }
      });

      data += "--------------------------------" + LF;
      const totalText = "TOTAL BAYAR:";
      const totalVal = new Intl.NumberFormat("id-ID").format(Number(tx.total_income));
      const totalSpaces = 32 - totalText.length - totalVal.length;
      data += totalText + " ".repeat(Math.max(1, totalSpaces)) + totalVal + LF + LF;

      data += ESC + "a" + "\x01";
      data += "terima kasih atas pesanan anda ." + LF;
      data += "dicetak dari Sippeto POS system" + LF;
      data += LF + LF + LF;
      data += GS + "V" + "\x41" + "\x03";

      const bytes = encoder.encode(data);
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await targetChar.writeValue(chunk);
      }
      toast.success("Nota berhasil dicetak via Bluetooth!");
    } catch (e: any) {
      if (e.name !== "NotFoundError") toast.error(`Gagal cetak Bluetooth: ${e.message || e}`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(v);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-20 px-4 sm:px-6 py-2" style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/backend/tenant/sales")}
              className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-[#3c39d6] uppercase tracking-widest transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Kembali ke Kasir
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-1 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              Riwayat Penjualan POS
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#030037] tracking-tighter">
            Data <span className="text-[#3c39d6]">Penjualan Kasir</span>
          </h1>
          <p className="text-zinc-400 text-xs font-medium">
            Semua transaksi yang dicatat melalui kasir POS — bisa diedit, lihat nota, dan hapus.
          </p>
        </div>

        <button
          onClick={() => router.push("/backend/tenant/sales")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3c39d6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a28b8] transition-all shadow-lg shadow-indigo-200 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Transaksi Baru
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Omzet (Halaman ini)
          </span>
          <h3 className="text-lg font-black text-emerald-600 tracking-tight">
            {formatCurrency(currentStats.totalRevenue)}
          </h3>
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data.length} nota
          </span>
        </div>
        <div className="bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Total Item Terjual
          </span>
          <h3 className="text-lg font-black text-[#3c39d6] tracking-tight">
            {currentStats.totalItems.toLocaleString("id-ID")} pcs
          </h3>
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <Package className="w-3 h-3" />
            semua produk
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-[#030037] p-5 rounded-2xl shadow-lg flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
            Rata-Rata Nota
          </span>
          <h3 className="text-lg font-black text-emerald-400 tracking-tight">
            {data.length > 0
              ? formatCurrency(currentStats.totalRevenue / data.length)
              : "Rp 0"}
          </h3>
          <span className="text-[10px] text-white/40 font-medium flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            per transaksi
          </span>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div className="flex gap-2 border-b border-zinc-150 pb-px">
        <button 
          onClick={() => setActiveTab("offline")} 
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all select-none flex items-center gap-2 ${
            activeTab === "offline" 
              ? 'border-[#3c39d6] text-black' 
              : 'border-transparent text-zinc-500 hover:text-black'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Penjualan Kasir (POS)
        </button>
        <button 
          onClick={() => setActiveTab("online")} 
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all select-none flex items-center gap-2 relative ${
            activeTab === "online" 
              ? 'border-emerald-500 text-black' 
              : 'border-transparent text-zinc-500 hover:text-black'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Pesanan Online (E-Catalog)
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-sm">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* === TAB 1: KASIR OFFLINE === */}
      {activeTab === "offline" && (
        <>
          {/* Filter Bar */}
      <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari no. nota atau nama pelanggan..."
            className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#3c39d6] focus:bg-white transition-all text-zinc-800 placeholder:font-medium"
            value={searchVal}
            onChange={handleSearchChange}
          />
        </div>
        {/* Date range */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              className="bg-transparent border-0 text-xs font-bold text-zinc-700 focus:ring-0 outline-none w-32"
              value={dateStartVal}
              onChange={handleDateStartChange}
            />
          </div>
          <span className="text-zinc-300 text-xs">—</span>
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              className="bg-transparent border-0 text-xs font-bold text-zinc-700 focus:ring-0 outline-none w-32"
              value={dateEndVal}
              onChange={handleDateEndChange}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">No. Nota</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pelanggan</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produk</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center">
                        <ShoppingCart className="w-7 h-7 text-zinc-300" />
                      </div>
                      <div>
                        <p className="font-black text-zinc-700 text-sm">Belum ada data penjualan</p>
                        <p className="text-xs text-zinc-400 font-medium mt-1">
                          Mulai transaksi dari halaman kasir POS
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/backend/tenant/sales")}
                        className="flex items-center gap-2 px-5 py-2 bg-[#3c39d6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a28b8] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Buka Kasir
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((tx) => {
                  const itemsCount = tx.transaction_items.reduce(
                    (s, i) => s + (i.quantity || 1),
                    0
                  );
                  const productNames = tx.transaction_items
                    .slice(0, 2)
                    .map((i) => i.name.replace(/\s*\(x\d+\)/, ""))
                    .join(", ");
                  const moreCount = tx.transaction_items.length - 2;

                  return (
                    <tr
                      key={tx.id}
                      className="group border-b border-zinc-50 hover:bg-zinc-50/70 transition-colors animate-in fade-in duration-150"
                    >
                      {/* Nota */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                            <Hash className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-800">
                              {tx.reference_number || "—"}
                            </p>
                            <span className="flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              <span className="text-[9px] font-bold text-emerald-600">Lunas</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-zinc-705 text-zinc-800">{formatDate(tx.transaction_date)}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {new Date(tx.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>

                      {/* Pelanggan */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span className="text-xs font-bold text-zinc-705 text-zinc-800">
                            {tx.customer_name || "Pembeli Umum"}
                          </span>
                        </div>
                      </td>

                      {/* Produk */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs font-bold text-zinc-705 text-zinc-800 truncate max-w-[180px]">
                            {productNames}
                            {moreCount > 0 && (
                              <span className="text-zinc-400 font-medium"> +{moreCount} lainnya</span>
                            )}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            {itemsCount} item · {tx.transaction_items.length} produk
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-emerald-600">
                          {formatCurrency(Number(tx.total_income))}
                        </p>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-2 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-[#3c39d6] hover:border-indigo-100 shadow-sm transition-all"
                            title="Lihat Detail Nota"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintNota(tx)}
                            className="p-2 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-emerald-500 hover:border-emerald-100 shadow-sm transition-all"
                            title="Cetak Nota PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/backend/tenant/sales?id=${tx.id}`)}
                            className="p-2 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-amber-500 hover:border-amber-100 shadow-sm transition-all"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 bg-white border border-zinc-100 rounded-lg text-zinc-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagesCount > 1 && (
          <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-zinc-400">
              Menampilkan {data.length} dari {totalCount} nota penjualan
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <span className="text-xs font-black text-zinc-705 text-zinc-800 px-2">
                {currentPage} / {pagesCount}
              </span>
              <button
                disabled={currentPage >= pagesCount}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* === TAB 2: PESANAN ONLINE (E-CATALOG) === */}
      {activeTab === "online" && (
        <>
          {/* Filter Bar Online */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari No. Referensi atau Nama Pelanggan..."
                value={searchQueryOnline}
                onChange={handleOnlineSearchChange}
                className="w-full bg-zinc-50 border border-zinc-200 text-black p-2.5 pl-9 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
              {(["ALL", "PENDING", "SUCCESS", "CANCELLED"] as const).map((status) => {
                const label = status === "ALL" ? "Semua" : status === "PENDING" ? "Baru / Pending" : status === "SUCCESS" ? "Konfirmasi Lunas" : "Dibatalkan";
                const isActive = onlineStatusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleOnlineStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all select-none border shrink-0 ${
                      isActive 
                        ? "bg-[#030037] border-[#030037] text-white shadow-md shadow-[#030037]/10" 
                        : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Content Area */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-300">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-sm font-bold text-[#030037]">Tidak Ada Pesanan Ditemukan</h3>
              <p className="text-xs text-zinc-400 font-semibold max-w-xs leading-relaxed">Belum ada pesanan online yang sesuai dengan filter atau pencarian Anda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const isExpanded = !!expandedOrders[order.id];
                const isPending = order.status === "PENDING";
                const isSuccess = order.status === "SUCCESS";
                const isWorking = !!actionLoading[order.id];

                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
                      isExpanded ? "ring-1 ring-primary/20 border-primary/20" : "border-zinc-100 hover:shadow-md"
                    }`}
                  >
                    {/* Status Stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isPending ? "bg-amber-500" : isSuccess ? "bg-emerald-500" : "bg-zinc-300"
                    }`} />

                    {/* Primary Card View */}
                    <div className="p-5 pl-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        {/* Reference */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-900 tracking-wider font-mono bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-200">
                              {order.reference_number}
                            </span>
                            {order.branches && (
                              <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 uppercase">
                                {order.branches.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-xs font-bold text-[#030037] truncate">{order.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <a 
                              href={`https://wa.me/${order.customer_phone.startsWith("0") ? "62" + order.customer_phone.slice(1) : order.customer_phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              {order.customer_phone}
                              <ExternalLink className="w-3 h-3 text-emerald-500" />
                            </a>
                          </div>
                        </div>

                        {/* Payment & Price */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-xs font-bold text-zinc-900">{order.payment_method}</span>
                          </div>
                          <div className="text-sm font-black text-[#030037]">
                            {formatCurrency(Number(order.total_price))}
                          </div>
                        </div>

                        {/* Badge */}
                        <div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isPending 
                              ? "bg-amber-50 text-amber-600 border border-amber-100" 
                              : isSuccess 
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                          }`}>
                            {isPending ? "Pending" : isSuccess ? "Lunas" : "Dibatalkan"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-zinc-100">
                        {isPending && (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => triggerUpdateStatus(order.id, order.reference_number, "SUCCESS")}
                              disabled={isWorking}
                              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Lunas
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerUpdateStatus(order.id, order.reference_number, "CANCELLED")}
                              disabled={isWorking}
                              className="flex-1 sm:flex-none px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 border border-zinc-200"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Batalkan
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpandOrder(order.id)}
                          className="p-2 hover:bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-400 hover:text-black transition-all shrink-0"
                          title="Lihat Detail Barang"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pl-6 border-t border-zinc-100 bg-zinc-50/40 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
                          {/* Products Table (7 columns) */}
                          <div className="md:col-span-7 space-y-3">
                            <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5" /> Daftar Barang Pesanan
                            </h5>
                            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <th className="p-3 pl-4">Produk</th>
                                    <th className="p-3 text-center">Jumlah</th>
                                    <th className="p-3 text-right">Harga</th>
                                    <th className="p-3 text-right pr-4">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-zinc-100">
                                  {order.order_items.map((item) => {
                                    const productName = item.products?.name || "Produk Tidak Diketahui";
                                    const priceNum = Number(item.price);
                                    const subtotal = item.quantity * priceNum;
                                    return (
                                      <tr key={item.id} className="hover:bg-zinc-50/50 text-black font-bold">
                                        <td className="p-3 pl-4 font-bold text-zinc-900">{productName}</td>
                                        <td className="p-3 text-center text-zinc-500">{item.quantity}</td>
                                        <td className="p-3 text-right text-zinc-500">{formatCurrency(priceNum)}</td>
                                        <td className="p-3 text-right pr-4 text-zinc-900">{formatCurrency(subtotal)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Address info (5 columns) */}
                          <div className="md:col-span-5 space-y-3">
                            <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> Informasi Alamat
                            </h5>
                            <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 shadow-sm text-xs">
                              {order.customer_address ? (
                                <div className="flex gap-2.5">
                                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Alamat Pengiriman</span>
                                    <p className="text-black font-bold leading-relaxed">{order.customer_address}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2.5 text-zinc-400 items-center py-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="italic font-semibold">Tidak memerlukan alamat pengiriman (Ambil Sendiri / Toko Offline).</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination for Online Orders */}
          {ordersTotalPages > 1 && (
            <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between gap-4 bg-white rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-zinc-400">
                Menampilkan {orders.length} dari {ordersTotal} pesanan
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={ordersPage <= 1}
                  onClick={() => handleOrdersPageChange(ordersPage - 1)}
                  className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
                </button>
                <span className="text-xs font-black text-zinc-800 px-2">
                  {ordersPage} / {ordersTotalPages}
                </span>
                <button
                  disabled={ordersPage >= ordersTotalPages}
                  onClick={() => handleOrdersPageChange(ordersPage + 1)}
                  className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Detail Nota using shared ReceiptModal */}
      {selectedTx && (
        <ReceiptModal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          profile={{
            business_name: businessName,
            branch_name: "Cabang Utama",
            address: address,
            avatar_url: avatarUrl,
          }}
          data={buildReceiptDataFromSaleTransaction(selectedTx)}
          title="Detail Nota POS"
          subtitle={`#${selectedTx.reference_number || "—"}`}
          showSuccessBadge={false}
          onEdit={() => {
            const id = selectedTx.id;
            setSelectedTx(null);
            router.push(`/backend/tenant/sales?id=${id}`);
          }}
          onDelete={() => {
            const id = selectedTx.id;
            setSelectedTx(null);
            handleDelete(id);
          }}
        />
      )}
      {/* Custom Confirmation Modal E-Catalog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col items-center text-center gap-4">
            
            {confirmModal.newStatus === "SUCCESS" ? (
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#030037] leading-tight">
                {confirmModal.newStatus === "SUCCESS" ? "Konfirmasi Pembayaran Lunas" : "Batalkan Pesanan"}
              </h3>
              <p className="text-xs text-zinc-900 font-bold px-2 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all border border-zinc-200"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-3 text-white text-xs font-bold rounded-xl transition-all shadow-md ${
                  confirmModal.newStatus === "SUCCESS" 
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10" 
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                }`}
              >
                {confirmModal.newStatus === "SUCCESS" ? "Ya, Konfirmasi Lunas" : "Ya, Batalkan"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
