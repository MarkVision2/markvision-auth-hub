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
    { id: "chest", label: "Грудь (Пекторальные)", d: "M 22 45 Q 50 35 78 45 L 82 75 Q 50 82 18 75 Z" },
    { id: "abdomen", label: "Живот (Пресс)", d: "M 28 78 Q 50 85 72 78 L 70 115 Q 50 125 30 115 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 80 50 L 98 115 L 88 125 L 72 60 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 20 50 L 2 115 L 12 125 L 28 60 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 115 Q 60 112 68 120 L 78 198 L 52 198 L 50 120 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 115 Q 40 112 32 120 L 22 198 L 48 198 L 50 120 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 30 Q 50 28 54 30 L 58 42 Q 50 45 42 42 Z" },
    { id: "upper_back", label: "Трапеции/Лопатки", d: "M 20 42 Q 50 35 80 42 L 85 75 Q 50 85 15 75 Z" },
    { id: "lower_back", label: "Поясница", d: "M 28 78 Q 50 72 72 78 L 75 105 Q 50 115 25 105 Z" },
    { id: "pelvis", label: "Таз/Ягодицы", d: "M 25 108 Q 50 125 75 108 L 72 145 Q 50 155 28 145 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 80 50 L 98 115 L 88 125 L 72 60 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 20 50 L 2 115 L 12 125 L 28 60 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 135 L 65 198 Q 50 205 35 198 L 48 140 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 135 L 35 198 Q 50 205 65 198 L 52 140 Z" },
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone, isPrint = false }) => {
    
    const renderFigure = (title: string, zones: Zone[], imagePath: string) => (
        <div className="flex flex-col items-center group flex-1">
            {!isPrint && (
                <div className="flex items-center gap-2 mb-10 px-6 py-2 rounded-full bg-slate-100/40 border border-slate-200/40 backdrop-blur-lg shadow-sm transition-all group-hover:bg-white group-hover:border-red-500/30">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">{title}</h4>
                </div>
            )}
            <div className={cn(
                "relative w-full max-w-[400px] aspect-[1/2] overflow-hidden rounded-[4.5rem] transition-all duration-1000",
                !isPrint && "bg-white shadow-[0_50px_120px_rgba(0,0,0,0.1)] border border-white/80 ring-1 ring-slate-200/40 backdrop-blur-2xl hover:ring-red-500/30 hover:shadow-[0_60px_150px_rgba(239,68,68,0.1)] scale-100 hover:scale-[1.04]"
            )}>
                {/* Anatomical Image */}
                <img 
                    src={imagePath}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-contain transition-all duration-[3.5s] ease-in-out group-hover:scale-110 group-hover:rotate-1 filter brightness-[1.02] contrast-[1.05]"
                />

                {/* Cyber Scanner Grid Overlay */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(239,68,68,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.06)_1px,transparent_1px)] bg-[size:20px_20px]" />
                )}
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10 drop-shadow-3xl">
                    <style>{`
                        @keyframes scanner-pulse-enhanced {
                            0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.5)); transform: scale(1); }
                            50% { opacity: 0.7; filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.95)); transform: scale(1.02); }
                        }
                        .zone-pulse-enhanced {
                            animation: scanner-pulse-enhanced 3s ease-in-out infinite;
                            transform-origin: center;
                        }
                        .zone-path-awesome {
                            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                        .zone-path-awesome:hover {
                            stroke-width: 3px;
                            stroke: rgba(239, 68, 68, 0.8);
                        }
                        @keyframes shimmer-ultra {
                            0% { transform: translateX(-100%) skewX(-15deg); }
                            100% { transform: translateX(200%) skewX(-15deg); }
                        }
                        .animate-shimmer-ultra {
                            animation: shimmer-ultra 2.5s ease-in-out infinite;
                        }
                    `}</style>
                    <defs>
                        <radialGradient id="heat-grad-awesome" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.85)" />
                            <stop offset="50%" stopColor="rgba(239, 68, 68, 0.45)" />
                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                        </radialGradient>
                    </defs>
                    
                    {/* Interaction Zones */}
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "zone-path-awesome",
                                        isSelected ? "fill-[url(#heat-grad-awesome)] stroke-red-500 stroke-[3px] opacity-100" : "fill-transparent hover:fill-red-500/15"
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

                    {/* Highly Pulsing Glow for selected areas */}
                    <g className="pointer-events-none">
                        {zones.filter(z => selectedZones.includes(z.id)).map(z => (
                            <path 
                                key={`glow-ultra-${z.id}`}
                                d={z.d}
                                className="fill-red-500/20 zone-pulse-enhanced"
                                style={{ stroke: 'rgba(239, 68, 68, 1)', strokeWidth: '1px' }}
                            />
                        ))}
                    </g>
                </svg>
                
                {/* High-Tech Edge Rim Light */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none rounded-[4.5rem] shadow-[inset_0_0_80px_rgba(255,255,255,1)] border border-white/20" />
                )}
            </div>

            {!isPrint && (
                <div className="mt-16 flex flex-wrap max-w-[420px] justify-center gap-3.5">
                    {zones.map(z => {
                        const isSelected = selectedZones.includes(z.id);
                        return (
                            <button 
                                key={z.id}
                                onClick={() => onToggleZone(z.id)}
                                className={cn(
                                    "text-[10px] px-7 py-3.5 rounded-2xl transition-all duration-700 border uppercase font-black tracking-[0.25em] relative overflow-hidden group/btn",
                                    isSelected 
                                        ? "bg-red-500 text-white border-red-500 shadow-[0_20px_45px_rgba(239,68,68,0.5)] scale-110 active:scale-95 translate-y-[-4px]" 
                                        : "bg-white text-slate-400 border-slate-100 hover:border-red-500/50 hover:text-red-500 hover:shadow-2xl hover:translate-y-[-2px] active:translate-y-[0px]"
                                )}
                            >
                                <span className="relative z-10">{z.label}</span>
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-ultra" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn(
            "flex items-center justify-center gap-16 transition-all duration-1000 w-full",
            isPrint ? "p-0 bg-transparent" : "p-20 bg-slate-50/50 rounded-[6rem] border border-slate-200/50 backdrop-blur-md shadow-2xl"
        )}>
            {renderFigure("Анфас (Перед)", frontZones, "/images/diagnostics/anatomy_front_v2.png")}
            {renderFigure("Профиль (Спина)", backZones, "/images/diagnostics/anatomy_back_v2.png")}
        </div>
    );
};
