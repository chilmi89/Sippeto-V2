"use client";

import React from "react";
import Lottie from "lottie-react";
import animationData from "../../../public/loading-aset/Collecting Money.json";

interface SectionLoaderProps {
    minHeight?: string | number;
    text?: string;
    small?: boolean;
}

const SectionLoader = ({ minHeight = "200px", text = "Sedang Memuat...", small = false }: SectionLoaderProps) => {
    return (
        <div 
            className="w-full flex flex-col items-center justify-center bg-zinc-50/10 rounded-2xl" 
            style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
        >
            <div className={`relative ${small ? "w-20 h-20" : "w-32 h-32"}`}>
                <Lottie 
                    animationData={animationData} 
                    loop={true} 
                    className="w-full h-full opacity-80"
                />
            </div>
            {text && (
                <div className="mt-2 flex flex-col items-center gap-1.5 opacity-50">
                    <p className={`font-black uppercase tracking-[0.3em] pl-1 text-zinc-400 ${small ? "text-[8px]" : "text-[10px]"}`}>
                        {text}
                    </p>
                    <div className="flex items-center gap-2">
                         <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div className="w-1 h-1 bg-zinc-300 rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionLoader;
