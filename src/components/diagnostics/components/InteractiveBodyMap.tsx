import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 12 Q 50 2 58 12 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_f", label: "Шея", d: "M 46 30 L 54 30 L 56 40 L 44 40 Z" },
    { id: "chest", label: "Грудь", d: "M 25 42 Q 50 35 75 42 L 78 72 Q 50 82 22 72 Z" },
    { id: "abdomen", label: "Живот", d: "M 30 75 Q 50 85 70 75 L 68 110 Q 50 120 32 110 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 78 48 L 95 115 L 85 122 L 70 58 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 22 48 L 5 115 L 15 122 L 30 58 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 112 L 65 195 L 45 195 L 48 115 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 112 L 35 195 L 55 195 L 52 115 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 30 L 54 30 L 56 40 L 44 40 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 25 42 Q 50 35 75 42 L 78 72 Q 50 82 22 72 Z" },
    { id: "lower_back", label: "Поясница", d: "M 30 75 Q 50 85 70 75 L 72 105 Q 50 115 28 105 Z" },
    { id: "pelvis", label: "Таз", d: "M 30 108 Q 50 118 70 108 L 68 140 Q 50 150 32 140 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 78 48 L 95 115 L 85 121 L 70 58 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 22 48 L 5 115 L 15 121 L 30 58 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 142 L 65 195 L 45 195 L 48 145 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 142 L 35 195 L 55 195 L 52 145 Z" },
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone, isPrint = false }) => {
    
    const renderFigure = (title: string, zones: Zone[], isBack: boolean = false) => (
        <div className="flex flex-col items-center">
            {!isPrint && <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">{title}</h4>}
            <div className={cn(
                "relative w-full max-w-[320px] aspect-[1/2] overflow-hidden rounded-[2.5rem] bg-white transition-all duration-500",
                !isPrint && "shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/50 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            )}>
                {/* Background anatomical image */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-cover transition-transform duration-[2s] ease-out hover:scale-105"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10">
                    <style>{`
                        @keyframes pulse-subtle {
                            0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)); }
                            50% { opacity: 0.8; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.7)); }
                        }
                        .animate-pulse-subtle {
                            animation: pulse-subtle 3s ease-in-out infinite;
                        }
                    `}</style>
                    <defs>
                        <filter id="glow-red">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <g className="opacity-0 hover:opacity-100 transition-opacity duration-500">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "cursor-pointer transition-all duration-300",
                                        isSelected ? "fill-red-500/30 stroke-red-500 stroke-[1.5px] opacity-100" : "fill-transparent hover:fill-red-500/15"
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
                    {/* Persistent highlights for selected zones */}
                    <g>
                        {zones.filter(z => selectedZones.includes(z.id)).map(z => (
                            <path 
                                key={`selected-${z.id}`}
                                d={z.d}
                                filter="url(#glow-red)"
                                className="fill-red-500/40 stroke-red-500 stroke-[2.5px] cursor-pointer pointer-events-auto transition-all duration-500 animate-pulse-subtle"
                                style={{ animationDuration: '3s' }}
                                onClick={() => onToggleZone(z.id)}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            {!isPrint && (
                <div className="mt-10 flex flex-wrap max-w-[340px] justify-center gap-2">
                    {zones.map(z => (
                        <span 
                            key={z.id}
                            onClick={() => onToggleZone(z.id)}
                            className={cn(
                                "text-[10px] px-5 py-2 rounded-full cursor-pointer transition-all duration-300 border font-bold tracking-wider uppercase",
                                selectedZones.includes(z.id) 
                                    ? "bg-red-500 text-white border-red-500 shadow-[0_5px_15px_rgba(239,68,68,0.3)] scale-110" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-red-400/50 hover:text-red-500 hover:bg-red-50/30"
                            )}
                        >
                            {z.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={cn(
            "flex items-start justify-evenly rounded-3xl",
            isPrint ? "p-0 bg-transparent border-none" : "p-8 bg-slate-50/50 border border-slate-200/50"
        )}>
            {renderFigure("Спереди", frontZones, false)}
            {renderFigure("Сзади", backZones, true)}
        </div>
    );
};
