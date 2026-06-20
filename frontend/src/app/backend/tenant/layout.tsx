"use client";

import { Lenis as LenisWrapper } from "lenis/react";
import type React from "react";
import { useEffect, useState } from "react";
import RoleGuard from "@/components/auth/RoleGuard";
import SessionGuard from "@/components/auth/SessionGuard";
import { DashboardHeader } from "@/components/dashboard/Header";
import { TenantSidebar } from "@/components/dashboard/TenantSidebar";
import { SidebarProvider, useSidebar } from "@/lib/context/SidebarContext";
import { FloatingNotificationFAB } from "@/components/dashboard/FloatingNotificationFAB";

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <LenisWrapper
      root
      options={{ duration: 1.2, smoothWheel: true, wheelMultiplier: 1 }}
    >
      <div className="min-h-screen bg-zinc-50">
        <TenantSidebar />

        <div
          className={`${
            isOpen ? "lg:ml-72" : "lg:ml-[76px]"
          } ${ready ? "transition-all duration-300" : "transition-none"}`}
        >
          <DashboardHeader />

          <main className="w-full bg-[#fdfdfd] p-4 md:p-6 xl:p-8">
            <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6 md:gap-8 pb-32">
              {children}
            </div>
          </main>
        </div>

        {/* Floating Notification FAB for mobile/tablet */}
        <FloatingNotificationFAB />
      </div>
    </LenisWrapper>
  );
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RoleGuard>
        <TenantLayoutContent>{children}</TenantLayoutContent>
        <SessionGuard />
      </RoleGuard>
    </SidebarProvider>
  );
}
