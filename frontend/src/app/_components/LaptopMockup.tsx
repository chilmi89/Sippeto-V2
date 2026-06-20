"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LaptopMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const screenshots = [
    "/hero-content/image.png",
    "/hero-content/image1.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % screenshots.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [screenshots.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Max rotation 8 degrees for stability and premium feel
    const rX = -(y / rect.height) * 8;
    const rY = (x / rect.width) * 8;
    
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative w-full max-w-[760px] mx-auto flex flex-col items-center group select-none py-8">
      {/* 3D Wrapper */}
      <motion.div
        className="w-full relative flex flex-col items-center cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
          perspective: 1200,
        }}
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow Effect behind the screen */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/10 via-cyan-500/20 to-indigo-500/10 blur-[60px] rounded-full pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0" />

        {/* Screen container (Lid) - optimized 16:9.5 laptop aspect ratio for a taller screen with full dashboard fit */}
        <div 
          className="relative w-full aspect-[16/9.5] bg-zinc-950 rounded-t-[16px] md:rounded-t-[22px] border-x-[6px] md:border-x-[10px] border-b-[6px] md:border-b-[10px] border-t-[14px] md:border-t-[22px] border-zinc-900 shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col z-10"
          style={{ transform: "translateZ(20px)" }}
        >
          {/* Webcam positioned inside the top border (bezel) */}
          <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-950 flex items-center justify-center z-30">
            <div className="w-0.5 h-0.5 rounded-full bg-blue-900/90" />
          </div>

          {/* Screen Content */}
          <div className="relative flex-1 w-full bg-zinc-900 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeTab}
                src={screenshots[activeTab]}
                alt="Sippeto Dashboard"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full object-fill select-none"
              />
            </AnimatePresence>

            {/* Glossy screen glass reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none z-20" />
          </div>
        </div>

        {/* Laptop Hinge & Base */}
        <div 
          className="relative w-[108%] h-3 md:h-4 bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-900 rounded-b-[10px] md:rounded-b-[14px] border-t border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-20"
          style={{ transform: "translateZ(40px)" }}
        >
          {/* Front Opening Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 md:w-16 h-1.5 bg-zinc-950 rounded-b-md" />
          
          {/* Hinge Shadow */}
          <div className="absolute -top-1.5 left-[3%] right-[3%] h-[3px] bg-zinc-950/90 blur-[1px]" />
        </div>

        {/* Realistic drop shadow below the base */}
        <div 
          className="w-[100%] h-5 bg-black/50 blur-[10px] rounded-full mt-2 opacity-90"
          style={{ transform: "translateZ(5px)" }}
        />
      </motion.div>

      {/* Dashboard Toggle indicator dots */}
      <div className="flex gap-2.5 mt-8 relative z-30">
        {screenshots.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              activeTab === idx
                ? "bg-blue-500 w-7 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                : "bg-white/25 hover:bg-white/50"
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
