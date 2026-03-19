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
    
    const renderFigure = (title: string, zones: Zone[], isBack: boolean = false) => (
        <div className="flex flex-col items-center group">
            {!isPrint && (
                <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-slate-100/30 border border-slate-200/30 backdrop-blur-md shadow-sm transition-all group-hover:bg-white group-hover:border-red-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{title}</h4>
                </div>
            )}
            <div className={cn(
                "relative w-full max-w-[340px] aspect-[1/2] overflow-hidden rounded-[3.5rem] transition-all duration-1000",
                !isPrint && "bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white/60 ring-1 ring-slate-200/30 backdrop-blur-xl hover:ring-red-500/20 hover:shadow-[0_50px_120px_rgba(239,68,68,0.06)] scale-100 hover:scale-[1.03]"
            )}>
                {/* Background anatomical image */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-cover transition-all duration-[3s] ease-in-out group-hover:scale-110 filter brightness-[1.02] contrast-[1.05]"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />

                {/* Cyber Scanner Grid Overlay */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:15px_15px]" />
                )}
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10 drop-shadow-2xl">
                    <style>{`
                        @keyframes scanner-pulse {
                            0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.45)); }
                            50% { opacity: 0.65; filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.9)); }
                        }
                        .zone-pulse {
                            animation: scanner-pulse 2.5s ease-in-out infinite;
                        }
                        .zone-path {
                            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                        .zone-path:hover {
                            stroke-width: 2.5px;
                            stroke: rgba(239, 68, 68, 0.7);
                        }
                        @keyframes shimmer-fast {
                            0% { background-position: -200% 0; }
                            100% { background-position: 200% 0; }
                        }
                        .animate-shimmer-fast {
                            animation: shimmer-fast 2s linear infinite;
                        }
                    `}</style>
                    <defs>
                        <radialGradient id="heat-grad-rich" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.75)" />
                            <stop offset="60%" stopColor="rgba(239, 68, 68, 0.4)" />
                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                        </radialGradient>
                    </defs>
                    
                    {/* Hover & Selection Zones */}
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "zone-path",
                                        isSelected ? "fill-[url(#heat-grad-rich)] stroke-red-500 stroke-[2.5px] opacity-100" : "fill-transparent hover:fill-red-500/15"
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
                                key={`glow-fx-${z.id}`}
                                d={z.d}
                                className="fill-red-500/25 zone-pulse"
                                style={{ stroke: 'rgba(239, 68, 68, 0.9)', strokeWidth: '0.8px' }}
                            />
                        ))}
                    </g>
                </svg>
                
                {/* Edge High-Tech Rim Light */}
                {!isPrint && (
                    <div className="absolute inset-0 pointer-events-none rounded-[3.5rem] shadow-[inset_0_0_60px_rgba(255,255,255,0.95)] opacity-60" />
                )}
            </div>

            {!isPrint && (
                <div className="mt-14 flex flex-wrap max-w-[380px] justify-center gap-3">
                    {zones.map(z => {
                        const isSelected = selectedZones.includes(z.id);
                        return (
                            <button 
                                key={z.id}
                                onClick={() => onToggleZone(z.id)}
                                className={cn(
                                    "text-[9px] px-6 py-3 rounded-2xl transition-all duration-700 border uppercase font-black tracking-[0.2em] relative overflow-hidden group/btn",
                                    isSelected 
                                        ? "bg-red-500 text-white border-red-500 shadow-[0_15px_35px_rgba(239,68,68,0.45)] scale-110 active:scale-95 translate-y-[-2px]" 
                                        : "bg-white text-slate-400 border-slate-100 hover:border-red-400/50 hover:text-red-500 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px]"
                                )}
                            >
                                <span className="relative z-10">{z.label}</span>
                                {isSelected && (
                                    <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer-fast" />
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
            "flex items-start justify-evenly transition-all duration-1000",
            isPrint ? "p-0 bg-transparent border-none" : "p-12 bg-slate-50/40 rounded-[4rem] border border-slate-200/40 backdrop-blur-sm"
        )}>
            {renderFigure("Анфас (Перед)", frontZones, false)}
            {renderFigure("Профиль (Спина)", backZones, true)}
        </div>
    );
};
