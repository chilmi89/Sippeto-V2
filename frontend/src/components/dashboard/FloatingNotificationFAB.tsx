"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Bell, ShoppingBag, AlertTriangle, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getNotificationsAction } from "@/app/actions/notification";

interface PendingOrder {
  id: string;
  reference_number: string;
  customer_name: string;
  total_price: number;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  product_name: string;
  branch_name: string;
  stock: number;
  min_stock: number;
}

interface NotificationData {
  totalCount: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  pendingOrders: PendingOrder[];
  lowStockProducts: LowStockProduct[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
};

export const FloatingNotificationFAB = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "stocks">("orders");
  const [seenCount, setSeenCount] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationsAction();
      if (result.status === "success") {
        setData(result as unknown as NotificationData);
      }
    } catch (err) {
      console.error("Gagal fetch notifikasi:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalCount = data?.totalCount ?? 0;
  const unreadCount = Math.max(0, totalCount - seenCount);
  const hasUnread = unreadCount > 0;

  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      setSeenCount(totalCount);
      fetchNotifications();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) - Biru Putih */}
      <div className="fixed bottom-6 right-6 z-[999] animate-in fade-in duration-300">
        <button
          onClick={handleToggle}
          className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer select-none active:scale-95 border-2 border-white/20"
          aria-label="Notifikasi Melayang"
        >
          <Bell className="w-6 h-6 animate-pulse" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-blue-600 flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-[998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Standard Rectangular Notification Card Popover (Tema Biru Putih) */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] w-[320px] sm:w-[360px] h-[480px] max-h-[calc(100vh-120px)] bg-white rounded-2xl border border-blue-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
          {/* Header Biru */}
          <div className="h-14 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  Notifikasi
                </h4>
                <p className="text-[10px] text-blue-100 font-medium">
                  {totalCount > 0 ? `${totalCount} item perlu perhatian` : "Pusat Pemberitahuan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                title="Muat Ulang"
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-blue-100 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup"
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-blue-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Putih dengan Aksen Biru */}
          <div className="flex border-b border-blue-50 bg-blue-50/40 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Orders
              {(data?.pendingOrdersCount ?? 0) > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center leading-none">
                  {data?.pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("stocks")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === "stocks"
                  ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Stok
              {(data?.lowStockCount ?? 0) > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center leading-none">
                  {data?.lowStockCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50/20">
            {isLoading && !data ? (
              // Skeleton loading items
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-white border border-blue-100 rounded-xl flex gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-blue-50 rounded w-2/3" />
                      <div className="h-2.5 bg-blue-50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === "orders" ? (
              // TAB: Pending Orders
              (data?.pendingOrders?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h6 className="text-sm font-bold text-slate-900">
                    Tidak ada pesanan pending
                  </h6>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                    Semua pesanan Anda telah berhasil diproses.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/backend/tenant/sales/history");
                      }}
                      className="bg-white border border-blue-100 hover:border-blue-400 p-3 rounded-xl flex items-start gap-3 shadow-xs cursor-pointer active:scale-[0.99] transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate block group-hover:text-blue-600">
                            {order.customer_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium shrink-0">
                            {timeAgo(order.created_at)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          #{order.reference_number}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-50">
                          <span className="text-xs font-bold text-blue-600 font-mono">
                            {formatCurrency(order.total_price)}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // TAB: Low Stock Products
              (data?.lowStockProducts?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h6 className="text-sm font-bold text-slate-900">
                    Stok Cabang Aman
                  </h6>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                    Seluruh inventaris stok cabang dalam kondisi mencukupi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/backend/tenant/stocks");
                      }}
                      className="bg-white border border-blue-100 hover:border-blue-400 p-3 rounded-xl flex items-start gap-3 shadow-xs cursor-pointer active:scale-[0.99] transition-all group"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          product.stock <= 0
                            ? "bg-rose-50 border border-rose-100 text-rose-600"
                            : "bg-amber-50 border border-amber-100 text-amber-600"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate block group-hover:text-blue-600">
                            {product.product_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
                          {product.branch_name}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-50">
                          <span
                            className={`text-xs font-bold font-mono ${
                              product.stock <= 0 ? "text-rose-600" : "text-amber-600"
                            }`}
                          >
                            Stok: {product.stock} (Min: {product.min_stock})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              product.stock <= 0
                                ? "text-rose-700 bg-rose-50 border-rose-200"
                                : "text-amber-700 bg-amber-50 border-amber-200"
                            }`}
                          >
                            {product.stock <= 0 ? "HABIS" : "MENIPIS"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};


