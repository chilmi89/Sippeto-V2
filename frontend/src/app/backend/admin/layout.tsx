"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { SidebarProvider, useSidebar } from "@/lib/context/SidebarContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${
          mounted && isOpen ? "lg:ml-72" : "lg:ml-0"
        }`}
        suppressHydrationWarning
      >
        <DashboardHeader />
        
        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 xl:p-8 bg-[#fdfdfd] relative scroll-smooth">
          <div className="max-w-[1440px] mx-auto w-full h-full min-h-0 flex flex-col gap-6 md:gap-8 pb-32">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
