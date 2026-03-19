import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_f", label: "Шея", d: "M 46 30 Q 50 28 54 30 L 58 42 Q 50 45 42 42 Z" },
    { id: "chest", label: "Грудь", d: "M 22 45 Q 50 35 78 45 L 82 75 Q 50 82 18 75 Z" },
    { id: "abdomen", label: "Живот", d: "M 28 78 Q 50 85 72 78 L 70 115 Q 50 125 30 115 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 80 50 L 98 125 L 82 135 L 70 60 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 20 50 L 2 125 L 18 135 L 30 60 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 118 L 65 198 L 45 198 L 48 118 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 118 L 35 198 L 55 198 L 52 118 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 30 Q 50 28 54 30 L 58 42 Q 50 45 42 42 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 20 42 Q 50 35 80 42 L 85 75 Q 50 85 15 75 Z" },
    { id: "lower_back", label: "Поясница", d: "M 28 78 Q 50 72 72 78 L 75 105 Q 50 115 25 105 Z" },
    { id: "pelvis", label: "Таз", d: "M 25 108 Q 50 125 75 108 L 72 145 Q 50 155 28 145 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 80 50 L 98 125 L 82 135 L 70 60 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 20 50 L 2 125 L 18 135 L 30 60 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 135 L 65 198 L 40 198 L 48 140 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 135 L 35 198 L 60 198 L 52 140 Z" },
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone, isPrint = false }) => {
    
    const renderFigure = (title: string, zones: Zone[], isBack: boolean) => (
        <div className="flex flex-col items-center group flex-1">
            {!isPrint && (
                <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all group-hover:border-red-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-red-50/70">{title}</h4>
                </div>
            )}
            <div className={cn(
                "relative w-full max-w-[280px] aspect-[1/2] overflow-hidden rounded-[2.5rem] transition-all duration-700",
                !isPrint && "bg-slate-950 shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-slate-800/50 ring-1 ring-white/5 hover:ring-red-500/40 hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] scale-100 hover:scale-[1.02]"
            )}>
                {/* Background anatomical image - Using single image with stable split logic */}
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-[3s] ease-out filter brightness-[0.8] contrast-[1.1] group-hover:brightness-100"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />

                {/* Cyber Grid Overlay */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                )}
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10">
                    <style>{`
                        @keyframes scanner-scan {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(200%); }
                        }
                        .scan-line {
                            animation: scanner-scan 4s linear infinite;
                            background: linear-gradient(to bottom, transparent, rgba(239,68,68,0.3), transparent);
                        }
                    `}</style>
                    <defs>
                        <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                            <stop offset="60%" stopColor="rgba(239, 68, 68, 0.4)" />
                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                        </radialGradient>
                    </defs>
                    
                    {/* Zones */}
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-all duration-500 ease-in-out",
                                        isSelected 
                                            ? "fill-[url(#neon-glow)] stroke-red-500 stroke-[2px] opacity-100" 
                                            : "fill-transparent hover:fill-red-500/10 hover:stroke-red-500/20 stroke-[0.5px]"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleZone(z.id);
                                    }}
                                >
                                    <title>{z.label}</title>
                                </path>
                            );
                        })}
                    </g>
                </svg>
                
                {/* Tech Rim Light */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_0_30px_rgba(239,68,68,0.1)] border border-white/5" />
                )}
            </div>

            {!isPrint && (
                <div className="mt-8 flex flex-wrap max-w-[300px] justify-center gap-1.5">
                    {zones.map(z => {
                        const isSelected = selectedZones.includes(z.id);
                        return (
                            <button 
                                key={z.id}
                                onClick={() => onToggleZone(z.id)}
                                className={cn(
                                    "text-[8px] px-3.5 py-1.5 rounded-lg transition-all duration-500 border uppercase font-black tracking-widest",
                                    isSelected 
                                        ? "bg-red-500 text-white border-red-500 shadow-[0_5px_15px_rgba(239,68,68,0.5)] scale-110" 
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-red-500/50 hover:text-red-400"
                                )}
                            >
                                {z.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn(
            "flex items-center justify-center gap-8 transition-all duration-1000 w-full",
            isPrint ? "p-4 bg-white" : "p-12 bg-slate-950 rounded-[3.5rem] border border-slate-800/50 shadow-2xl"
        )}>
            {renderFigure("Анфас (Перед)", frontZones, false)}
            {renderFigure("Профиль (Спина)", backZones, true)}
        </div>
    );
};
