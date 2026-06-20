"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Sparkles, User, Store, Phone, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WelcomeSection } from '@/components/auth/WelcomeSection';
import { createUmkmAction, updateUmkmAction } from '@/app/actions/register_umkm';

const UmkmPage = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        full_name: "",
        business_name: "",
        email: "",
        phone_number: "",
        address: ""
    });

    useEffect(() => {
        setIsMounted(true);
        const savedId = sessionStorage.getItem('pending_profile_id');
        if (savedId) setPendingId(savedId);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBackToBasic = () => {
        sessionStorage.removeItem('pending_profile_id');
        setPendingId(null);
        toast.info('Kembali ke registrasi dasar.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const body = pendingId ? { id: pendingId, ...formData } : formData;
            const result = pendingId
                ? await updateUmkmAction(body)
                : await createUmkmAction(body);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success(pendingId ? 'Data UMKM berhasil dilengkapi!' : 'Registrasi UMKM Berhasil!');
            sessionStorage.removeItem('pending_profile_id');
            router.push('/login');
        } catch (err) {
            toast.error('Gagal terhubung ke server.');
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return <div className="min-h-screen bg-[#030037]" />;

    return (
        <div 
            className="min-h-screen w-full flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-y-auto" 
            style={{
                background: 'linear-gradient(135deg, #030037 0%, #0f2166 20%, #1a56db 50%, #0ea5e9 80%, #06b6d4 100%)'
            }}
            suppressHydrationWarning
        >
            {/* Background Decorations */}
            <div className="fixed top-[15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/10 blur-[120px] rounded-full animate-pulse delay-700 z-0 pointer-events-none" />

            <header className="relative z-30 shrink-0">
                <Navbar />
            </header>

            {/* Main Container matches Register Page layout exactly */}
            <main className="flex-1 min-h-0 w-full flex items-center justify-center relative z-10 py-8 lg:py-12">
                <div className="container max-w-6xl mx-auto flex items-center justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-6 items-center w-full">
                        
                        {/* Illustration Section - Only Desktop */}
                        <div className="hidden lg:flex items-center justify-center lg:justify-start transform scale-90 xl:scale-100 origin-left">
                            <WelcomeSection />
                        </div>
                        
                        {/* Form Card Section - Matches RegisterCard sizes */}
                        <div className="flex justify-center lg:justify-end animate-in fade-in zoom-in duration-700 delay-200 w-full">
                            <div className="w-full max-w-[440px] xl:max-w-[480px] p-6 lg:p-7 rounded-[2rem] relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-slate-950/75 backdrop-blur-2xl border border-white/10">
                                <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-colors duration-500" />
                                
                                <div className="relative space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        
                                        {pendingId && (
                                            <span className="inline-block bg-primary/20 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-white/90 uppercase border border-primary/30">Langkah Terakhir</span>
                                        )}
                                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                                            {pendingId ? "Lengkapi Profil" : "Daftar Akun UMKM"}
                                        </h2>
                                        <div className="flex items-center justify-center gap-1 text-blue-100/50 font-medium text-[11px]">
                                            <span>Mulai perjalanan bisnis digital Anda</span>
                                            <Sparkles className="w-3 h-3 animate-pulse text-primary/60" />
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-blue-100/70">Nama Pemilik</label>
                                                <div className="relative group/input">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within/input:text-white transition-colors" />
                                                    <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nama Anda" type="text" required className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-xs font-medium transition-all" suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-blue-100/70">Nama Usaha</label>
                                                <div className="relative group/input">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within/input:text-white transition-colors" />
                                                    <input name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Nama Toko" type="text" required className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-xs font-medium transition-all" suppressHydrationWarning />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-blue-100/70">Email Anda</label>
                                                <div className="relative group/input">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within/input:text-white transition-colors" />
                                                    <input name="email" value={formData.email} onChange={handleChange} placeholder="email@bisnis.com" type="email" required className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-xs font-medium transition-all" suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-blue-100/70">WhatsApp Bisnis</label>
                                                <div className="relative group/input">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within/input:text-white transition-colors" />
                                                    <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="08xxxxxxxx" type="text" required className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-xs font-medium transition-all" suppressHydrationWarning />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider ml-1 text-blue-100/70">Alamat Lengkap Usaha</label>
                                            <div className="relative group/input">
                                                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30 group-focus-within/input:text-white transition-colors" />
                                                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Jalan Raya No. 123..." required className="w-full bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 rounded-xl py-2 pl-8.5 pr-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.09] text-xs font-medium transition-all min-h-[60px] resize-none" suppressHydrationWarning />
                                            </div>
                                        </div>

                                        <div className="pt-2 space-y-2">
                                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] text-white font-bold tracking-wider text-xs py-2.5 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group/btn">
                                                {loading ? "Menyimpan..." : pendingId ? "Selesaikan Pendaftaran" : "Buat Akun Bisnis"} 
                                                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>

                                            {pendingId && (
                                                <button type="button" onClick={handleBackToBasic} className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-white/20 hover:text-white/50 transition-colors py-1 group/back">
                                                    <ArrowLeft className="w-3 h-3 group-hover/back:-translate-x-0.5 transition-transform" /> Kembali ke registrasi dasar
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    {!pendingId && (
                                        <div className="text-center">
                                            <p className="text-blue-100/50 text-xs font-medium">
                                                Sudah punya akun? <Link href="/login" className="text-white font-bold hover:underline decoration-white/30 underline-offset-4 transition-colors">Masuk sekarang</Link>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="shrink-0 relative z-20">
                <Footer />
            </footer>
        </div>
    );
};

export default UmkmPage;