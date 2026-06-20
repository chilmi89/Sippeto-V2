"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Sparkles, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { registerAction } from '@/app/actions/auth';

export const RegisterCard = () => {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerAction({ nama, email, password });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      sessionStorage.setItem('pending_profile_id', result.user.id);
      toast.success('Akun berhasil dibuat! Lengkapi profil UMKM Anda.');
      router.push('/umkm');
    } catch (err) {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex justify-center lg:justify-end animate-in fade-in zoom-in duration-700 delay-200 w-full">
      <div className="w-full max-w-[440px] xl:max-w-[480px] p-6 lg:p-7 rounded-[2rem] relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-slate-950/75 backdrop-blur-2xl border border-white/10">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 blur-3xl rounded-full" />
        
        <div className="relative space-y-3 xl:space-y-5">
          <div className="space-y-2 text-center">
            
            <h2 className="text-2xl xl:text-2xl font-bold text-white tracking-tight">Buat Akun Baru UMKM </h2>
          
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-blue-100/70">Nama Lengkap</label>
              <div className="relative group/input">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-white transition-colors" />
                <input 
                  type="text" 
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama" 
                  className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-sm font-medium transition-all"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-blue-100/70">Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-white transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com" 
                  className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-sm font-medium transition-all"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider ml-1 text-blue-100/70">Password (Min. 8 Karakter)</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-white transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-sm font-medium transition-all"
                  required
                  minLength={8}
                  suppressHydrationWarning
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-xs font-medium text-blue-100/60 px-1 pt-1 opacity-90 hover:opacity-100 transition-opacity">
              <label className="flex items-center gap-2 cursor-pointer group/check">
                <div className="w-4.5 h-4.5 rounded-sm border border-white/20 bg-white/5 flex items-center justify-center group-hover/check:border-white/40 transition-all">
                  <input type="checkbox" className="hidden peer" required />
                  <div className="w-2.5 h-2.5 bg-white rounded-[1px] opacity-0 peer-checked:opacity-100 transition-all" />
                </div>
                <span>Saya setuju dengan <Link href="#" className="hover:text-white underline decoration-white/30 underline-offset-2">Syarat Ketentuan</Link></span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold tracking-wider text-sm py-3 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"} <Sparkles className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-1">
            <p className="text-blue-100/50 text-sm font-medium">
              Sudah punya akun? <Link href="/login" className="text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-colors">Masuk sekarang</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
