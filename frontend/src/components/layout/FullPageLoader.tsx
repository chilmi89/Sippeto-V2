"use client";

import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../public/loading-aset/Collecting Money.json";

const FullPageLoader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
            <div className="w-40 h-40 sm:w-56 sm:h-56 relative">
                <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    className="w-full h-full"
                />
                {/* Subtle outer ring */}
                <div className="absolute inset-0 border-4 border-primary/5 rounded-full scale-110 animate-pulse"></div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] pl-1 animate-pulse">
                    Memproses Data Finansial
                </p>
            </div>
        </div>
    );
};

export default FullPageLoader;
