"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/context/SidebarContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  ArrowRightLeft,
  FileText,
  ShieldAlert,
  Settings,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  Package
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/backend/admin/dashboard" },
  { icon: Building2, label: "Manajemen Tenant", href: "/backend/admin/tenant" },
  { 
    icon: Package, 
    label: "Manajemen Produk", 
    href: "/backend/admin/products",
    subItems: [
      { label: "Monitoring Produk", href: "/backend/admin/products" },
      { label: "Kategori Produk", href: "/backend/admin/products/kategori-produk" },
    ]
  },
  { icon: Users, label: "Manajemen Pengguna", href: "/backend/admin/users" },
  { 
    icon: ShieldCheck, 
    label: "Peran & Izin", 
    href: "/backend/admin/rbac",
    subItems: [
      { label: "Dashboard RBAC", href: "/backend/admin/rbac" },
      { label: "Daftar Peran", href: "/backend/admin/rbac/roles" },
      { label: "Daftar Izin", href: "/backend/admin/rbac/permission" },
    ]
  },
  { 
    icon: ArrowRightLeft, 
    label: "Transaksi", 
    href: "/backend/admin/transactions",
    subItems: [
      { label: "Dashboard Transaksi", href: "/backend/admin/transactions" },
      { label: "Kategori Transaksi", href: "/backend/admin/transactions/kategori-transaksi" },
      { label: "Metode Pembayaran", href: "/backend/admin/transactions/metode-pembayaran" },
    ]
  },

  { icon: FileText, label: "Laporan Pendapatan", href: "/backend/admin/reports" },
  { icon: ShieldAlert, label: "Pusat Keamanan", href: "/backend/admin/security" },
  { icon: Settings, label: "Pengaturan", href: "/backend/admin/settings" },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    setMounted(true);
    // Otomatis buka submenu hanya jika URL aktif ada di dalamnya
    const initial: Record<string, boolean> = {};
  navItems.forEach(item => {
      if (item.subItems?.some(sub => pathname.startsWith(sub.href) || pathname === sub.href)) {
        initial[item.label] = true;
      }
    });
    setOpenSubMenus(initial);
  }, [pathname]);

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
        className={`fixed inset-y-0 left-0 w-72 h-full bg-[#030037] text-white flex flex-col p-6 z-[60] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-10 pt-2 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tightest uppercase italic">Sippeto</h1>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1.5 leading-none">
              Control Center
            </p>
          </div>
          <button 
            onClick={closeSidebar}
            className="p-2 lg:hidden hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubMenuOpen = openSubMenus[item.label];
            const isActive = pathname === item.href || item.subItems?.some(sub => pathname === sub.href);
            
            return (
              <div key={item.label} className="relative">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleSubMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                      isActive ? "bg-white/5 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          isActive ? "text-primary-light text-white" : "text-white/20 group-hover:text-white"
                        }`}
                      />
                      <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                    </div>
                    {isSubMenuOpen ? <ChevronDown className="w-4 h-4 opacity-40 shrink-0" /> : <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                      isActive ? "bg-white/5 text-white shadow-sm" : "text-white/40 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? "text-white" : "text-white/20 group-hover:text-white"
                      }`}
                    />
                    <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                  </Link>
                )}

                {/* Sub Menu Items */}
                {hasSubItems && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubMenuOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-10 space-y-1 pr-2 relative">
                       {/* Vertical Line */}
                      <div className="absolute left-[-1.5rem] top-0 bottom-4 w-px bg-white/10" />
                      
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                            className={`flex items-center px-4 py-2.5 rounded-xl text-xs transition-all ${
                              isSubActive 
                                ? "text-white font-bold bg-white/5" 
                                : "text-white/30 hover:text-white hover:bg-white/5 font-semibold"
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
          <button className="flex items-center gap-3 w-full px-5 py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all group">
            <HelpCircle className="w-5 h-5 text-white/20 group-hover:text-white" />
            <span className="text-sm font-bold tracking-tight">Pusat Bantuan</span>
          </button>
        </div>
      </aside>
    </>
  );
};
