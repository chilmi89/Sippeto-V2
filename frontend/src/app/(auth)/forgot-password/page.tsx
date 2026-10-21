"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle2, 
  Search, 
  Edit3 
} from "lucide-react";
import { toast } from "react-toastify";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WelcomeSection } from "@/components/auth/WelcomeSection";
import { verifyResetPhoneAction, resetPasswordPhoneAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Verification Data
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [checking, setChecking] = useState(false);

  // Password Data
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Check if Email & Phone match in database
  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phoneNumber.trim()) {
      toast.warning("Silakan isi email dan nomor WhatsApp terlebih dahulu.");
      return;
    }

    setChecking(true);
    try {
      const res = await verifyResetPhoneAction({
        email: email.trim(),
        phone_number: phoneNumber.trim(),
      });

      if (res.error) {
        toast.error(res.error);
        setIsVerified(false);
        setVerifiedName("");
        return;
      }

      setIsVerified(true);
      const name = res.business_name || res.full_name || "Pemilik Akun";
      setVerifiedName(name);
      toast.success(`Akun terverifikasi: ${name}`);

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    } catch {
      toast.error("Gagal memeriksa akun. Coba beberapa saat lagi.");
    } finally {
      setChecking(false);
    }
  };

  // Step 2: Submit New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      toast.warning("Periksa kecocokan akun Anda terlebih dahulu.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordPhoneAction({
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        new_password: newPassword,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(res.message || "Kata sandi berhasil diperbarui! Silakan masuk.");
      router.push("/login");
    } catch {
      toast.error("Gagal memperbarui kata sandi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVerification = () => {
    setIsVerified(false);
    setVerifiedName("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-y-auto"
      style={{
        background:
          "linear-gradient(135deg, #030037 0%, #0f2166 20%, #1a56db 50%, #0ea5e9 80%, #06b6d4 100%)",
      }}
      suppressHydrationWarning
    >
      {/* Background Glow Orbs */}
      <div className="fixed top-[-12%] left-[-8%] w-[45%] h-[55%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse z-0 pointer-events-none" />
      <div className="fixed bottom-[-12%] right-[-8%] w-[45%] h-[55%] bg-cyan-400/20 blur-[120px] rounded-full animate-pulse delay-700 z-0 pointer-events-none" />

      {/* Header / Navbar */}
      <header className="shrink-0 relative z-20">
        <Navbar />
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full flex items-center justify-center relative z-10 py-6 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Illustration Section */}
            <div className="hidden lg:flex items-center justify-center">
              <WelcomeSection theme="dark" />
            </div>

            {/* Forgot Password Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-[460px] p-6 lg:p-8 rounded-[2rem] relative overflow-hidden shadow-2xl bg-slate-950/80 backdrop-blur-2xl border border-white/10">
                <div className="absolute -top-28 -right-28 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-28 -left-28 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />

                <div className="relative space-y-5">
                  <div className="space-y-1.5 text-center">
                    <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-blue-400 mb-2">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Atur Ulang Sandi
                    </h2>
                    <p className="text-sm font-medium text-blue-100/60 max-w-xs mx-auto">
                      Periksa data akun Anda terlebih dahulu sebelum membuat kata sandi baru.
                    </p>
                  </div>

                  <form onSubmit={isVerified ? handleResetPassword : handleVerifyAccount} className="space-y-4">
                    {/* Input Email */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider ml-1 text-blue-100/70">
                          Email Terdaftar
                        </label>
                        {isVerified && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {verifiedName}
                            </span>
                            <button
                              type="button"
                              onClick={handleEditVerification}
                              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Ganti
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="relative group/input">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-white/70 transition-colors" />
                        <input
                          type="email"
                          value={email}
                          disabled={isVerified}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="contoh@email.com"
                          className={`w-full text-sm font-medium rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all ${
                            isVerified
                              ? "bg-white/[0.04] border border-white/5 text-zinc-300 cursor-not-allowed opacity-80"
                              : "bg-white/[0.08] border border-white/15 text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.12]"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Input Nomor HP */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider ml-1 text-blue-100/70">
                        Nomor WhatsApp / HP Terdaftar
                      </label>
                      <div className="relative group/input">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-white/70 transition-colors" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          disabled={isVerified}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="08123456789 atau 62812..."
                          className={`w-full text-sm font-medium rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all ${
                            isVerified
                              ? "bg-white/[0.04] border border-white/5 text-zinc-300 cursor-not-allowed opacity-80"
                              : "bg-white/[0.08] border border-white/15 text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.12]"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Tombol Periksa Akun (Hanya muncul jika belum diverifikasi) */}
                    {!isVerified && (
                      <button
                        type="submit"
                        disabled={checking}
                        className="w-full mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold tracking-wider text-sm py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        {checking ? "Memeriksa Akun..." : "Periksa Kecocokan Akun"}
                      </button>
                    )}

                    {/* Input Kata Sandi Baru */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isVerified ? "text-blue-100/90" : "text-white/30"}`}>
                          Kata Sandi Baru
                        </label>
                        {!isVerified && (
                          <span className="text-[10px] font-semibold text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md">
                            Terkunci (Periksa Akun Dulu)
                          </span>
                        )}
                      </div>
                      <div className="relative group/input">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          isVerified ? "text-white/40 group-focus-within/input:text-white/80" : "text-white/20"
                        }`} />
                        <input
                          ref={passwordInputRef}
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          disabled={!isVerified}
                          readOnly={!isVerified}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={isVerified ? "Minimal 6 karakter" : "Kolom terkunci sebelum akun cocok"}
                          className={`w-full text-sm font-medium rounded-xl py-2.5 pl-10 pr-10 outline-none transition-all ${
                            isVerified
                              ? "bg-white/[0.08] border border-white/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.12]"
                              : "bg-white/[0.02] border border-white/5 text-white/30 placeholder:text-white/20 cursor-not-allowed"
                          }`}
                          required={isVerified}
                          minLength={6}
                        />
                        {isVerified && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Input Konfirmasi Kata Sandi */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isVerified ? "text-blue-100/90" : "text-white/30"}`}>
                        Konfirmasi Kata Sandi
                      </label>
                      <div className="relative group/input">
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          isVerified ? "text-white/40 group-focus-within/input:text-white/80" : "text-white/20"
                        }`} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          disabled={!isVerified}
                          readOnly={!isVerified}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={isVerified ? "Ulangi kata sandi baru" : "Kolom terkunci sebelum akun cocok"}
                          className={`w-full text-sm font-medium rounded-xl py-2.5 pl-10 pr-10 outline-none transition-all ${
                            isVerified
                              ? "bg-white/[0.08] border border-white/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500/40 focus:bg-white/[0.12]"
                              : "bg-white/[0.02] border border-white/5 text-white/30 placeholder:text-white/20 cursor-not-allowed"
                          }`}
                          required={isVerified}
                          minLength={6}
                        />
                        {isVerified && (
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submit Button (Hanya aktif saat akun terverifikasi) */}
                    {isVerified && (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold tracking-wider text-sm py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {submitting ? "Menyimpan Sandi..." : "Perbarui Kata Sandi Sekarang"}
                      </button>
                    )}
                  </form>

                  {/* Back to Login Link */}
                  <div className="text-center pt-2 border-t border-white/10">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200/80 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Kembali ke Halaman Masuk
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 relative z-20">
        <Footer theme="light" />
      </footer>
    </div>
  );
}
