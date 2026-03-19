import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 40 10 Q 50 2 60 10 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_f", label: "Шея", d: "M 45 28 L 55 28 L 56 38 L 44 38 Z" },
    { id: "chest", label: "Грудь", d: "M 25 40 Q 50 35 75 40 L 78 70 Q 50 78 22 70 Z" },
    { id: "abdomen", label: "Живот", d: "M 28 72 Q 50 80 72 72 L 70 105 Q 50 115 30 105 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 75 45 L 94 110 L 84 118 L 68 55 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 25 45 L 6 110 L 16 118 L 32 55 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 108 L 65 195 L 45 195 L 48 112 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 108 L 35 195 L 55 195 L 52 112 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 40 10 Q 50 2 60 10 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 45 28 L 55 28 L 56 38 L 44 38 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 25 40 Q 50 35 75 40 L 78 70 Q 50 78 22 70 Z" },
    { id: "lower_back", label: "Поясница", d: "M 30 72 Q 50 80 70 72 L 72 100 Q 50 108 28 100 Z" },
    { id: "pelvis", label: "Таз", d: "M 30 102 Q 50 112 70 102 L 68 135 Q 50 145 32 135 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 75 45 L 94 110 L 84 118 L 68 55 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 25 45 L 6 110 L 16 118 L 32 55 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 138 L 65 195 L 45 195 L 48 142 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 138 L 35 195 L 55 195 L 52 142 Z" },
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone, isPrint = false }) => {
    
    const renderFigure = (title: string, zones: Zone[], isBack: boolean = false) => (
        <div className="flex flex-col items-center">
            {!isPrint && <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>}
            <div className={cn(
                "relative w-full max-w-[280px] aspect-[1/2] overflow-hidden rounded-3xl bg-white",
                !isPrint && "shadow-xl border border-border/40"
            )}>
                {/* Background anatomical image */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-cover transition-transform duration-700"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10">
                    <g className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200",
                                        isSelected ? "fill-primary/45 stroke-primary stroke-[1.5px] opacity-100" : "fill-transparent hover:fill-primary/25"
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
                                className="fill-primary/35 stroke-primary stroke-[2px] cursor-pointer pointer-events-auto filter drop-shadow-[0_0_2px_rgba(var(--primary),0.5)]"
                                onClick={() => onToggleZone(z.id)}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            {!isPrint && (
                <div className="mt-8 flex flex-wrap max-w-[300px] justify-center gap-2">
                    {zones.map(z => (
                        <span 
                            key={z.id}
                            onClick={() => onToggleZone(z.id)}
                            className={cn(
                                "text-[10px] px-4 py-1.5 rounded-full cursor-pointer transition-all border font-semibold tracking-wide",
                                selectedZones.includes(z.id) 
                                    ? "bg-primary text-white border-primary shadow-md scale-110" 
                                    : "bg-secondary/40 text-muted-foreground border-border/60 hover:border-primary/50 hover:bg-secondary/70"
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
