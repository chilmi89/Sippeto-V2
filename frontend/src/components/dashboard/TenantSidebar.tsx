"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/context/SidebarContext";
import { fetchMeOnce } from "@/lib/auth/fetchMe";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  UserCircle,
  Settings,
  HelpCircle,
  X,
  History,
  Receipt,
  ChevronDown,
  Sliders,
  Globe,
  ShoppingBag,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download
} from "lucide-react";

type NavItem = {
  icon: any;
  label: string;
  href: string;
  permission?: string;
  subItems?: { label: string; href: string; permission?: string }[];
};

const tenantNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/backend/tenant" },
  { 
    icon: ShoppingCart, 
    label: "POS Kasir (Penjualan)", 
    href: "/backend/tenant/sales",
    subItems: [
      { label: "Kasir", href: "/backend/tenant/sales" },
      { label: "Data Penjualan & Pesanan", href: "/backend/tenant/sales/history" },
    ]
  },
  { 
    icon: Package, 
    label: "Produk", 
    href: "/backend/tenant/products", 
    subItems: [
      { label: "Daftar Produk", href: "/backend/tenant/products", permission: "kelola_produk" },
      { label: "Kelola Stok", href: "/backend/tenant/stocks", permission: "kelola_stok" },
    ]
  },
  { icon: Store, label: "Kelola Cabang", href: "/backend/tenant/branches", permission: "kelola_cabang" },
  {
    icon: Receipt,
    label: "Pencatatan Transaksi",
    href: "/backend/tenant/transactions",
    subItems: [
      { label: "Pencatatan - Transaksi", href: "/backend/tenant/transactions" },
      { label: "Riwayat - Transaksi", href: "/backend/tenant/transactions/history" },
    ]
  },
  { 
    icon: BarChart3, 
    label: "Laporan", 
    href: "/backend/tenant/reports",
    subItems: [
      { label: "Laporan Harian", href: "/backend/tenant/reports/daily" },
      { label: "Laporan Mingguan", href: "/backend/tenant/reports/weekly" },
      { label: "Laporan Bulanan", href: "/backend/tenant/reports/monthly" },
      { label: "Laporan Tahunan", href: "/backend/tenant/reports/yearly" },
    ]
  },
  { icon: UserCircle, label: "Profil & Toko Saya", href: "/backend/tenant/profile" },
];

export const TenantSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, closeSidebar, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [origin, setOrigin] = useState("");

  // 1. Fetch data user sekali saat mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    fetchMeOnce().then(data => {
        if (data) {
          if (data.branch_id) {
            setUserBranchId(data.branch_id as string);
          }
          if (data.permissions) {
            setUserPermissions(data.permissions as string[]);
          }
          if (data.username) {
            setUsername(data.username as string);
          }
          if (data.business_name) {
            setBusinessName(data.business_name as string);
          }
        }
        setLoadingPermissions(false);
      })
      .catch(() => {
        setLoadingPermissions(false);
      });
  }, []);

  // 2. Tangani perubahan menu aktif saat pathname berubah
  useEffect(() => {
    const activeItem = tenantNavItems.find(item => item.subItems && pathname.startsWith(item.href));
    if (activeItem) {
      setExpandedMenus([activeItem.label]);
    } else {
      setExpandedMenus([]);
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    // Menggunakan gaya Accordion: Jika satu dibuka, yang lain ditutup otomatis.
    // Jika diklik yang sama, akan tertutup.
    setExpandedMenus(prev => prev.includes(label) ? [] : [label]);
  };

  if (!mounted) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-[#030037]/20 backdrop-blur-sm z-[50] lg:hidden transition-opacity duration-300 pointer-events-none ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        onClick={closeSidebar}
      />

      <aside 
        className={`fixed inset-y-0 left-0 h-full bg-[#030037] text-white flex flex-col z-[60] transition-all duration-300 ease-in-out ${
          isOpen ? "w-72 translate-x-0 p-6" : "-translate-x-full lg:translate-x-0 lg:w-[76px] lg:px-3 lg:py-6"
        }`}
      >
        {/* Header Logo */}
        <div className={`flex items-center justify-between mb-8 pt-2 shrink-0 ${isOpen ? "" : "lg:justify-center"}`}>
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center">
               <img 
                 src="/logo/Logo Sippeto 1.png" 
                 alt="Logo Sippeto" 
                 className="w-10 h-10 object-contain rounded-xl"
               />
            </div>
            {isOpen && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-xl font-black tracking-tightest font-heading uppercase leading-none">Sippeto</h1>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mt-1 font-sans leading-none">
                  Tenant Portal
                </p>
              </div>
            )}
          </div>
          {isOpen && (
            <button 
              onClick={closeSidebar}
              className="p-2 lg:hidden hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav data-lenis-prevent className={`flex-1 space-y-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isOpen ? "" : "flex flex-col items-center"}`}>
          {tenantNavItems
            .filter((item) => {
              if (userBranchId && item.href === "/backend/tenant/branches") {
                return false;
              }
              if (item.subItems && !loadingPermissions) {
                return item.subItems.some(sub => !sub.permission || userPermissions.includes(sub.permission));
              }
              if (item.permission && !loadingPermissions) {
                return userPermissions.includes(item.permission);
              }
              return true;
            })
            .map((item) => {
              const isActive = pathname === item.href || (!!item.subItems && pathname.startsWith(item.href) && pathname !== item.href);
              const hasSubItems = !!item.subItems;
              const isExpanded = expandedMenus.includes(item.label);

              // ─── Collapsed Mode Design ───
              if (!isOpen) {
                return (
                  <div key={item.label} className="relative group/tooltip flex justify-center w-full">
                    <button
                      onClick={() => {
                        toggleSidebar();
                        if (hasSubItems) {
                          setExpandedMenus([item.label]);
                        } else {
                          router.push(item.href);
                        }
                      }}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative ${
                        isActive 
                          ? "bg-white/10 text-white border border-white/10" 
                          : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {isActive && <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </button>
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#030037] border border-white/10 text-white text-xs font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-[100]">
                      {item.label}
                    </div>
                  </div>
                );
              }

              // ─── Expanded Mode Design (Original) ───
              return (
                <div key={item.label} className="relative animate-in fade-in duration-200">
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all group ${
                        isActive ? "bg-white/5 text-white shadow-sm border border-white/5" : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-5 h-5 transition-colors ${
                            isActive ? "text-primary-light" : "text-white/20 group-hover:text-white"
                          }`}
                        />
                        <span className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isActive ? "text-white" : "text-white/40 group-hover:text-white"}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                      className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all group ${
                        isActive ? "bg-white/5 text-white shadow-sm border border-white/5" : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          isActive ? "text-primary-light" : "text-white/20 group-hover:text-white"
                        }`}
                      />
                      <span className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    </Link>
                  )}

                  {hasSubItems && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                      <div className="flex flex-col gap-1 pl-12 pr-4 py-2 border-l border-white/10 ml-6">
                        {item.subItems
                          ?.filter(sub => !sub.permission || userPermissions.includes(sub.permission))
                          .map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                                className={`block py-2 text-sm transition-colors ${
                                  isSubActive ? "text-white font-bold" : "text-white/40 hover:text-white/80 font-medium"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* QR Code Widget in Sidebar (Only when expanded/isOpen is true) */}
          {isOpen && (
            <div className="mt-3.5 pt-3.5 border-t border-white/5 animate-in fade-in duration-300">
              {username ? (
                <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-4 w-full shadow-lg">
                  <div className="flex items-center justify-between w-full border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest pl-0.5">QR Code Etalase</span>
                    </div>
                    <button 
                      onClick={() => setShowQrModal(true)} 
                      className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                    >
                      Perbesar
                    </button>
                  </div>
                  <div 
                    onClick={() => setShowQrModal(true)}
                    className="flex items-center justify-center w-36 h-36 bg-white rounded-2xl border border-white/5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all mx-auto p-2.5 shadow-md relative group"
                  >
                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Klik Perbesar</span>
                    </div>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${origin}/store/${username}`)}`} 
                      alt="QR Link Toko" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${origin}/store/${username}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all select-none ${
                        copied 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${origin}/store/${username}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-center select-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh QR</span>
                    </a>
                  </div>
                </div>
              ) : (
                <Link
                  href="/backend/tenant/profile"
                  onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                  className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/[0.06] transition-all group"
                >
                  <QrCode className="w-6 h-6 text-white/20 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Katalog Belum Aktif</span>
                  <span className="text-[9px] text-white/40 leading-relaxed font-semibold">Atur username toko Anda di profil untuk mengaktifkan QR Code</span>
                </Link>
              )}
            </div>
          )}

          {/* Collapsed Mode QrCode Icon */}
          {!isOpen && (
            <div className="relative group/tooltip flex justify-center w-full mt-2.5 pt-2.5 border-t border-white/5">
              <button
                onClick={() => {
                  if (username) {
                    setShowQrModal(true);
                  } else {
                    router.push("/backend/tenant/profile");
                  }
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all text-white/40 hover:bg-white/5 hover:text-white`}
              >
                <QrCode className="w-5 h-5" />
              </button>
              <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#030037] border border-white/10 text-white text-xs font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-[100]">
                {username ? "QR Code Etalase" : "Atur Username Toko"}
              </div>
            </div>
          )}
        </nav>

        {/* Footer Help */}
        <div className={`mt-auto pt-6 border-t border-white/5 shrink-0 ${isOpen ? "" : "w-full flex justify-center"}`}>
          {isOpen ? (
            <button className="flex items-center gap-3 w-full px-5 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all group">
              <HelpCircle className="w-5 h-5 text-white/20 group-hover:text-white" />
              <span className="text-sm font-black tracking-tight">Pusat Bantuan</span>
            </button>
          ) : (
            <div className="relative group/tooltip flex justify-center w-full">
              <button 
                title="Pusat Bantuan"
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <HelpCircle className="w-5 h-5 text-white/20" />
              </button>
              <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#030037] border border-white/10 text-white text-xs font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-[100]">
                Pusat Bantuan
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Modal Dialog QR Code */}
      {showQrModal && username && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-250">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowQrModal(false)} 
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-zinc-100 animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">QR Code Toko</p>
                  <h2 className="text-base font-black text-[#030037] tracking-tight truncate max-w-[200px] mt-0.5">
                    {businessName || "Etalase Toko"}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setShowQrModal(false)} 
                className="w-8 h-8 rounded-xl bg-zinc-150 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-all outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center justify-center gap-6 text-center">
              <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl w-full flex items-center justify-center max-w-[220px] aspect-square shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${origin}/store/${username}`)}`} 
                  alt="QR Link Toko" 
                  className="w-full h-full object-contain bg-white p-2 rounded-xl border border-zinc-200 shadow-sm"
                />
              </div>

              <div className="w-full space-y-1 bg-zinc-50 border border-zinc-150 rounded-2xl p-3.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Tautan Toko Anda</span>
                <span className="text-xs font-mono font-black text-[#030037] break-all select-all block mt-1">
                  {origin}/store/{username}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${origin}/store/${username}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 border rounded-2xl text-xs font-bold transition-all shadow-sm ${
                    copied 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                      : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="font-black text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span className="font-black text-zinc-700">Salin Link</span>
                    </>
                  )}
                </button>
                
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${origin}/store/${username}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-2xl text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-zinc-455" />
                  <span className="font-black text-zinc-700">Unduh QR</span>
                </a>
              </div>

              <a
                href={`${origin}/store/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#030037] hover:bg-indigo-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#030037]/10"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Kunjungi Toko Online</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
