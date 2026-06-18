"use client";

import { useEffect, useState } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { WelcomeSection } from "@/components/auth/WelcomeSection";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const LoginPage = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-y-auto"
      style={{
        background:
          "linear-gradient(135deg, #030037 0%, #0f2166 20%, #1a56db 50%, #0ea5e9 80%, #06b6d4 100%)",
      }}
      suppressHydrationWarning
    >
      {/* Fixed background orbs */}
      <div className="fixed top-[-12%] left-[-8%] w-[45%] h-[55%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse z-0 pointer-events-none" />
      <div className="fixed bottom-[-12%] right-[-8%] w-[45%] h-[55%] bg-cyan-400/20 blur-[120px] rounded-full animate-pulse delay-700 z-0 pointer-events-none" />
      <div className="fixed top-[30%] right-[25%] w-[25%] h-[35%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar Container */}
      <header className="shrink-0 relative z-20">
        <Navbar />
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full flex items-center justify-center relative z-10 py-4 lg:py-6 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Illustration Section */}
            <div className="hidden lg:flex items-center justify-center">
              <WelcomeSection theme="dark" />
            </div>

            {/* Card Section */}
            <div className="flex items-center justify-center">
              <LoginCard theme="dark" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Container */}
      <footer className="shrink-0 relative z-20">
        <Footer theme="light" />
      </footer>
    </div>
  );
};

export default LoginPage;
