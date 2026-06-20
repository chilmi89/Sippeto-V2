"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Bell, ShoppingBag, AlertTriangle, RefreshCw, X, ChevronRight, Download } from "lucide-react";
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
      {/* Floating Action Button (FAB) - Visible on all screen sizes */}
      <div className="fixed bottom-6 right-6 z-[999] animate-in fade-in duration-300">
        <button
          onClick={handleToggle}
          className="relative w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer select-none active:scale-95 border border-indigo-500/20"
          aria-label="Notifikasi Melayang"
        >
          <Bell className="w-6 h-6 animate-pulse" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-indigo-600 flex items-center justify-center leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* iPhone Mockup Modal Dialog - Positioned exactly above the FAB */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-5 duration-250 max-h-[calc(100vh-120px)] pointer-events-auto">
          {/* iPhone Mockup Container - iPhone 12 mini Style (Taller 19.5:9 Aspect Ratio) */}
          <div className="relative w-[240px] h-[520px] bg-[#0c0c0e] rounded-[40px] border-[6px] border-[#1d1d1f] shadow-2xl ring-4 ring-black/40 flex flex-col overflow-hidden select-none">
              {/* iPhone 12 mini Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[18px] bg-black rounded-b-[12px] z-[100] flex items-center justify-center">
                {/* Speaker Line */}
                <div className="w-8 h-[2px] bg-[#1a1a1c] rounded-full absolute top-[3px]" />
                {/* Camera Dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#09090b] absolute right-5 top-[5px] border border-[#1e1e20]" />
              </div>

              {/* Inner Screen */}
              <div className="absolute inset-[5px] bg-[#fafafa] rounded-[34px] overflow-hidden flex flex-col border border-zinc-200">
                {/* iPhone Status Bar (Time & battery shifted to side corners around Notch) */}
                <div className="h-8 px-4 pt-2.5 flex justify-between items-center text-[8px] text-zinc-800 font-extrabold tracking-tight shrink-0 select-none z-50">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1.5 border border-zinc-500 rounded-[2px] p-[1px] flex items-center">
                      <span className="w-full h-full bg-emerald-500 rounded-[1px]" />
                    </span>
                  </div>
                </div>

                {/* iPhone App Bar */}
                <div className="h-9 bg-white border-b border-zinc-100 px-4 flex justify-between items-center shrink-0 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-800 tracking-tight">Notifikasi</span>
                  </div>
                  <button
                    onClick={fetchNotifications}
                    disabled={isLoading}
                    className="p-1 rounded-lg hover:bg-zinc-50 transition-colors text-zinc-400 hover:text-indigo-600 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* iPhone App Tabs */}
                <div className="flex border-b border-zinc-100 bg-white">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[9px] font-black uppercase tracking-wider transition-all border-b-2 ${
                      activeTab === "orders"
                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/20"
                        : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Orders
                    {(data?.pendingOrdersCount ?? 0) > 0 && (
                      <span className="min-w-[15px] h-[15px] px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                        {data?.pendingOrdersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("stocks")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[9px] font-black uppercase tracking-wider transition-all border-b-2 ${
                      activeTab === "stocks"
                        ? "text-amber-600 border-amber-500 bg-amber-50/20"
                        : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Stok
                    {(data?.lowStockCount ?? 0) > 0 && (
                      <span className="min-w-[15px] h-[15px] px-1 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                        {data?.lowStockCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Screen Content Feed */}
                <div className="flex-1 overflow-y-auto overscroll-contain bg-zinc-50/80 p-3 space-y-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {isLoading && !data ? (
                    // App skeleton list
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-white border border-zinc-150 rounded-xl flex gap-2 animate-pulse">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 bg-zinc-100 rounded w-2/3" />
                            <div className="h-2 bg-zinc-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeTab === "orders" ? (
                    // TAB: orders
                    (data?.pendingOrders?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center gap-2.5 py-16 text-center px-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h6 className="text-[10px] font-black text-zinc-800">Tidak ada pesanan pending</h6>
                        <p className="text-[8px] text-zinc-400 font-semibold leading-relaxed">
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
                            className="bg-white border border-zinc-150 p-3 rounded-xl flex items-start gap-2 shadow-sm cursor-pointer hover:border-indigo-400 active:scale-[0.98] transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black text-zinc-800 truncate block">
                                  {order.customer_name}
                                </span>
                                <span className="text-[7.5px] text-zinc-400 font-bold shrink-0">
                                  {timeAgo(order.created_at)}
                                </span>
                              </div>
                              <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">
                                #{order.reference_number}
                              </span>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-50">
                                <span className="text-[9px] font-black text-indigo-600 font-mono">
                                  {formatCurrency(order.total_price)}
                                </span>
                                <span className="text-[7px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                  Pending
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // TAB: low stock products
                    (data?.lowStockProducts?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center gap-2.5 py-16 text-center px-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h6 className="text-[10px] font-black text-zinc-800">Stok Cabang Aman</h6>
                        <p className="text-[8px] text-zinc-400 font-semibold leading-relaxed">
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
                            className="bg-white border border-zinc-150 p-3 rounded-xl flex items-start gap-2 shadow-sm cursor-pointer hover:border-amber-400 active:scale-[0.98] transition-all"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              product.stock <= 0 ? "bg-rose-50 border border-rose-100 text-rose-600" : "bg-amber-50 border border-amber-100 text-amber-600"
                            }`}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black text-zinc-800 truncate block">
                                  {product.product_name}
                                </span>
                              </div>
                              <span className="text-[8px] text-zinc-400 font-bold block mt-0.5 truncate">
                                {product.branch_name}
                              </span>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-50">
                                <span className={`text-[9px] font-black font-mono ${
                                  product.stock <= 0 ? "text-rose-600" : "text-amber-600"
                                }`}>
                                  Stok: {product.stock} (Min: {product.min_stock})
                                </span>
                                <span className={`text-[7px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                  product.stock <= 0 ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                                }`}>
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

                {/* iPhone Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-300 rounded-full z-50 select-none pointer-events-none" />
              </div>

              {/* Side button accents */}
              <div className="absolute right-[-4px] top-20 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
              <div className="absolute left-[-4px] top-16 w-[3px] h-6 bg-neutral-700 rounded-r-sm" />
              <div className="absolute left-[-4px] top-24 w-[3px] h-6 bg-[#1d1d1f] rounded-r-sm" />
            </div>
        </div>
      )}
    </>
  );
};
