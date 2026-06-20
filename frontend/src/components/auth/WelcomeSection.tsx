"use client";

export const WelcomeSection = ({
  theme = "dark",
}: {
  theme?: "light" | "dark";
}) => {
  const isLight = theme === "light";

  return (
    <div
      className={`hidden lg:flex flex-col gap-6 animate-in fade-in slide-in-from-left duration-1000 ${
        isLight ? "text-slate-800" : "text-white"
      }`}
    >
     

      {/* Headline */}
      <div className="space-y-2.5">
        <h2
          className={`text-3xl xl:text-4xl font-black leading-[1.15] tracking-tight max-w-sm ${
            isLight ? "text-slate-800" : "text-white"
          }`}
        >
          Kelola bisnis UMKM
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
            lebih cerdas & efisien
          </span>
        </h2>
        
      </div>

      {/* Dashboard Screenshot in Browser Frame */}
      <div className="relative w-full max-w-[460px]">
        {/* Browser chrome */}
        <div
          className={`rounded-t-2xl border px-4 py-2.5 flex items-center gap-3 ${
            isLight
              ? "bg-slate-100 border-slate-200"
              : "bg-slate-800/80 backdrop-blur border-white/10"
          }`}
        >
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div
            className={`flex-1 rounded-lg h-5 border flex items-center px-3 ${
              isLight
                ? "bg-white border-slate-200"
                : "bg-white/5 border-white/10"
            }`}
          >
            <span
              className={`text-[9px] font-medium ${
                isLight ? "text-slate-400" : "text-white/30"
              }`}
            >
              app.sippeto.com/dashboard
            </span>
          </div>
        </div>

        {/* Screenshot Container */}
        <div
          className={`overflow-hidden rounded-b-2xl border border-t-0 shadow-2xl aspect-[1365/606] ${
            isLight ? "border-slate-200" : "border-white/10"
          }`}
        >
          <img
            src="/hero-content/image.png"
            alt="Sippeto Dashboard"
            className="w-full h-full object-fill select-none"
            draggable={false}
          />
        </div>

        {/* Floating — Saldo Badge */}
        <div
          className={`absolute -right-5 top-14 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border animate-float [animation-delay:1s] ${
            isLight
              ? "bg-white/90 border-slate-200 text-slate-800"
              : "bg-slate-900/90 border-white/15 text-white"
          }`}
        >
          <p
            className={`text-[9px] font-bold uppercase tracking-widest ${
              isLight ? "text-slate-400" : "text-white/40"
            }`}
          >
            Saldo Bersih
          </p>
          <p className="text-base font-black text-emerald-400">Rp 105rb</p>
        </div>

        {/* Floating — Pendapatan Badge */}
        <div
          className={`absolute -left-5 bottom-6 backdrop-blur-xl rounded-2xl px-3 py-2.5 shadow-xl border animate-float [animation-delay:3s] flex items-center gap-2.5 ${
            isLight
              ? "bg-white/90 border-slate-200 text-slate-800"
              : "bg-slate-900/90 border-white/15 text-white"
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <p
              className={`text-[9px] font-bold uppercase tracking-wide ${
                isLight ? "text-slate-400" : "text-white/40"
              }`}
            >
              Pendapatan
            </p>
            <p
              className={`text-sm font-black ${
                isLight ? "text-slate-800" : "text-white"
              }`}
            >
              Rp 115rb
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
