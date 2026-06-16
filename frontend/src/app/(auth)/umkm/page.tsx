"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, Sparkles, User, Store, Phone, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WelcomeSection } from '@/components/auth/WelcomeSection';
import FullPageLoader from '@/components/layout/FullPageLoader';

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
            const method = pendingId ? 'PATCH' : 'POST';
            // Jika ada pendingId (setelah RegisterCard), kita tambahkan di body.
            const body = pendingId ? { id: pendingId, ...formData } : formData;
            
            const res = await fetch('/api/umkm', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                toast.error(data.error || 'Terjadi kesalahan sistem.');
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
        <div className="min-h-screen w-full bg-gradient-animate flex flex-col font-sans selection:bg-white/20 selection:text-white relative overflow-x-hidden" suppressHydrationWarning>
            {loading && <FullPageLoader />}
            {/* Background Decorations */}
            <div className="fixed top-[15%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/10 blur-[120px] rounded-full animate-pulse delay-700 z-0 pointer-events-none" />

            <header className="relative z-30">
                <Navbar />
            </header>

            <main className="flex-1 relative z-10 flex flex-col">
                <div className="container max-w-7xl mx-auto px-4 py-10 lg:py-16 flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full max-w-screen-xl">
                        
                        {/* Illustration Section - Only Desktop */}
                        <div className="hidden lg:flex flex-col items-center lg:items-start transform scale-95 xl:scale-100 origin-left">
                            <WelcomeSection />
                        </div>
                        
                        {/* Form Card Section */}
                        <div className="flex justify-center lg:justify-end animate-in fade-in slide-in-from-right duration-700 w-full">
                            <div className="glass w-full max-w-[580px] p-8 sm:p-10 lg:p-11 rounded-[2.5rem] relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.4)] border-white/10">
                                <div className="absolute -top-32 -right-32 w-72 h-72 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-colors duration-500" />
                                
                                <div className="relative space-y-7">
                                    <div className="space-y-2 text-center lg:text-left">
                                        {pendingId && (
                                            <span className="inline-block bg-primary/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-white/90 uppercase border border-primary/30 mb-2">Langkah Terakhir</span>
                                        )}
                                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                            {pendingId ? "Lengkapi Profil" : "Daftar Akun UMKM"}
                                        </h2>
                                        <div className="flex items-center justify-center lg:justify-start gap-2 text-white/40 font-medium text-xs sm:text-sm">
                                            <span>Mulai perjalanan bisnis digital Anda</span>
                                            <Sparkles className="w-4 h-4 animate-pulse text-primary/60" />
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nama Pemilik</label>
                                                <div className="relative group/input">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                                    <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nama Anda" type="text" required className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm font-semibold whitespace-nowrap overflow-ellipsis" suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nama Usaha</label>
                                                <div className="relative group/input">
                                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                                    <input name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Nama Toko" type="text" required className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm font-semibold whitespace-nowrap overflow-ellipsis" suppressHydrationWarning />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Anda</label>
                                                <div className="relative group/input">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                                    <input name="email" value={formData.email} onChange={handleChange} placeholder="email@bisnis.com" type="email" required className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm font-semibold" suppressHydrationWarning />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">WhatsApp Bisnis</label>
                                                <div className="relative group/input">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                                    <input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="08xxxxxxxx" type="text" required className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm font-semibold" suppressHydrationWarning />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Alamat Lengkap Usaha</label>
                                            <div className="relative group/input">
                                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                                                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Jalan Raya No. 123..." required className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all text-sm font-semibold min-h-[100px] resize-none" suppressHydrationWarning />
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-4">
                                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_20px_40px_rgba(60,57,214,0.3)] active:scale-[0.98] text-white font-black uppercase tracking-widest text-sm py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 group/btn">
                                                {loading ? "Menyimpan Data..." : pendingId ? "Selesaikan Pendaftaran" : "Buat Akun Bisnis Sekarang"} 
                                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                                            </button>

                                            {pendingId && (
                                                <button type="button" onClick={handleBackToBasic} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white/20 hover:text-white/60 transition-colors py-2 group/back">
                                                    <ArrowLeft className="w-3.5 h-3.5 group-hover/back:-translate-x-1 transition-transform" /> Kembali ke registrasi dasar
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    {!pendingId && (
                                        <div className="text-center pt-4">
                                            <p className="text-white/20 text-xs font-bold tracking-wide">
                                                Sudah punya akun? <Link href="/login" className="text-white hover:text-primary transition-colors hover:underline underline-offset-4">Masuk sekarang</Link>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto">
                    <Footer />
                </footer>
            </main>
            
            <style jsx global>{`
                body {
                    overflow-y: auto !important;
                    height: auto !important;
                    min-height: 100vh;
                }
            `}</style>
        </div>
    );
};

export default UmkmPage;