import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 40 8 Q 50 -2 60 8 L 60 22 Q 50 30 40 22 Z" },
    { id: "neck_f", label: "Шея", d: "M 44 24 L 56 24 L 58 35 L 42 35 Z" },
    { id: "chest", label: "Грудь", d: "M 28 38 Q 50 32 72 38 L 75 65 Q 50 72 25 65 Z" },
    { id: "abdomen", label: "Живот", d: "M 32 68 Q 50 75 68 68 L 66 100 Q 50 108 34 100 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 75 42 L 92 105 L 82 112 L 68 50 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 25 42 L 8 105 L 18 112 L 32 50 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 105 L 65 190 L 45 190 L 48 110 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 105 L 35 190 L 55 190 L 52 110 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 40 8 Q 50 -2 60 8 L 60 22 Q 50 30 40 22 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 44 24 L 56 24 L 58 35 L 42 35 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 25 38 Q 50 32 75 38 L 78 65 Q 50 72 22 65 Z" },
    { id: "lower_back", label: "Поясница", d: "M 30 68 Q 50 75 70 68 L 72 95 Q 50 102 28 95 Z" },
    { id: "pelvis", label: "Таз", d: "M 30 98 Q 50 108 70 98 L 68 135 Q 50 145 32 135 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 75 42 L 92 105 L 82 112 L 68 50 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 25 42 L 8 105 L 18 112 L 32 50 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 138 L 65 195 L 45 195 L 48 140 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 138 L 35 195 L 55 195 L 52 140 Z" },
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
                "relative w-full max-w-[260px] aspect-[100/150] overflow-hidden rounded-2xl bg-white",
                !isPrint && "shadow-md border border-border/50"
            )}>
                {/* Background anatomical image */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-contain transition-transform duration-500"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy.png')`,
                        backgroundPosition: isBack ? '98% 20%' : '2% 20%',
                        backgroundSize: '210% auto'
                    }}
                />
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 150" className="absolute inset-0 w-full h-full z-10">
                    <g className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200",
                                        isSelected ? "fill-primary/40 stroke-primary stroke-2 opacity-100" : "fill-transparent hover:fill-primary/20"
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
                                className="fill-primary/35 stroke-primary stroke-[1.5px] cursor-pointer pointer-events-auto"
                                onClick={() => onToggleZone(z.id)}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            {!isPrint && (
                <div className="mt-6 flex flex-wrap max-w-[280px] justify-center gap-1.5">
                    {zones.map(z => (
                        <span 
                            key={z.id}
                            onClick={() => onToggleZone(z.id)}
                            className={cn(
                                "text-[10px] px-3 py-1 rounded-full cursor-pointer transition-all border font-medium",
                                selectedZones.includes(z.id) 
                                    ? "bg-primary text-white border-primary shadow-sm scale-105" 
                                    : "bg-secondary/40 text-muted-foreground border-border/50 hover:border-primary/50 hover:bg-secondary/60"
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
