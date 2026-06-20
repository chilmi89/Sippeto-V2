"use client";

import { Home, LogIn, Menu, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 relative z-50">
      <nav className="w-full py-3 px-5 md:px-7 flex justify-between items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <img
            src="/logo/logo_icon.png"
            alt="Sippeto"
            className="h-8 w-8 object-contain rounded-xl shadow-md transition-all duration-300 group-hover:scale-105 group-active:scale-95"
          />
          <span className="text-white font-black text-[15px] tracking-tight hidden sm:block transition-opacity duration-300 group-hover:opacity-80">
            Sippeto
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold leading-none">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
          <Link
            href="/register"
            className="px-4 py-2.5 rounded-xl text-white bg-white/15 hover:bg-white/25 border border-white/15 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 ml-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrasi</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sm:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl flex flex-col gap-2 sm:hidden animate-in slide-in-from-top-2 duration-200 z-50">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2.5 text-xs font-bold"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2.5 text-xs font-bold"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-3 rounded-xl text-white bg-white/15 hover:bg-white/25 border border-white/15 transition-all flex items-center gap-2.5 text-xs font-bold justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrasi</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};
