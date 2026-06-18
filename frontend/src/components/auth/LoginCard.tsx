"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { loginAction } from "@/app/actions/auth";
import { getRedirectByRole } from "@/lib/roleRedirects";

export const LoginCard = ({ theme = "dark" }: { theme?: "light" | "dark" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isLight = theme === "light";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginAction({ email, password });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Login berhasil!");

      // Redirect berdasarkan role — konfigurasi ada di src/lib/roleRedirects.ts
      const redirectPath = getRedirectByRole(res.user?.role_name);
      router.push(redirectPath);
    } catch (_err) {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center animate-in fade-in zoom-in duration-700 delay-200 w-full">
      <div
        className={`w-full max-w-[440px] p-6 lg:p-7 rounded-[2rem] relative overflow-hidden shadow-2xl transition-all duration-300 ${
          isLight
            ? "bg-blue-50/90 backdrop-blur-xl border border-blue-200/80 shadow-[0_12px_40px_rgba(30,64,175,0.08)]"
            : "bg-slate-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(30,64,175,0.12)]"
        }`}
      >
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="relative space-y-5">
          <div className="space-y-1 text-center">
            <h2
              className={`text-2xl xl:text-3xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}
            >
              Masuk ke Akun
            </h2>
            <p
              className={`font-medium text-sm ${isLight ? "text-slate-400" : "text-blue-100/50"}`}
            >
              Masukkan email dan password Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className={`text-xs font-bold uppercase tracking-wider ml-1 ${isLight ? "text-slate-500" : "text-blue-100/70"}`}
              >
                Email
              </label>
              <div className="relative group/input">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    isLight
                      ? "text-slate-400 group-focus-within/input:text-primary"
                      : "text-white/30 group-focus-within/input:text-white/60"
                  }`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className={`w-full border outline-none text-base font-medium transition-all rounded-xl py-3 pl-11 pr-4 ${
                    isLight
                      ? "bg-white/80 border-blue-100/80 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/50"
                      : "bg-white/[0.07] border-white/10 text-white placeholder:text-white/25 focus:ring-2 focus:ring-white/15 focus:bg-white/[0.10]"
                  }`}
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className={`text-xs font-bold uppercase tracking-wider ml-1 ${isLight ? "text-slate-500" : "text-blue-100/70"}`}
              >
                Password
              </label>
              <div className="relative group/input">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    isLight
                      ? "text-slate-400 group-focus-within/input:text-primary"
                      : "text-white/30 group-focus-within/input:text-white/60"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border outline-none text-base font-medium transition-all rounded-xl py-3 pl-11 pr-11 ${
                    isLight
                      ? "bg-white/80 border-blue-100/80 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/50"
                      : "bg-white/[0.07] border-white/10 text-white placeholder:text-white/25 focus:ring-2 focus:ring-white/15 focus:bg-white/[0.10]"
                  }`}
                  required
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isLight ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60"}`}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`flex items-center justify-between text-sm font-medium ${isLight ? "text-slate-500" : "text-blue-100/60"}`}
            >
              <label className="flex items-center gap-2 cursor-pointer group/check">
                <div
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all ${
                    isLight
                      ? "border border-blue-200 bg-white group-hover/check:border-primary"
                      : "border border-white/15 bg-white/5 group-hover/check:border-white/35"
                  }`}
                >
                  <input type="checkbox" className="hidden peer" />
                  <div
                    className={`w-[10px] h-[10px] rounded-[2px] opacity-0 peer-checked:opacity-100 transition-all ${isLight ? "bg-primary" : "bg-white"}`}
                  />
                </div>
                <span className="group-hover/check:text-blue-100/80 transition-colors">
                  Ingat saya
                </span>
              </label>
              <Link
                href="#"
                className={`transition-colors ${isLight ? "hover:text-primary" : "hover:text-white/80"}`}
              >
                Lupa sandi?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold tracking-wider text-base py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div
                className={`w-full border-t ${isLight ? "border-blue-100/50" : "border-white/[0.08]"}`}
              />
            </div>
            <div className="relative flex justify-center">
              <span
                className={`px-3 text-xs font-bold ${isLight ? "text-slate-400 bg-blue-50/90" : "text-blue-100/30 bg-transparent"}`}
              >
                ATAU
              </span>
            </div>
          </div>

          <p
            className={`text-center text-sm font-medium ${isLight ? "text-slate-500" : "text-blue-100/50"}`}
          >
            Belum punya akun?{" "}
            <Link
              href="/register"
              className={`font-bold transition-colors ${
                isLight
                  ? "text-primary hover:text-primary/80"
                  : "text-white hover:text-blue-200"
              }`}
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
