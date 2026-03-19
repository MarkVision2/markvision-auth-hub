import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 12 Q 50 2 58 12 L 58 28 Q 50 35 42 28 Z" },
    { id: "neck_f", label: "Шея", d: "M 46 32 L 54 32 L 55 42 L 45 42 Z" },
    { id: "chest", label: "Грудь", d: "M 32 45 Q 50 40 68 45 L 70 75 Q 50 82 30 75 Z" },
    { id: "abdomen", label: "Живот", d: "M 34 78 Q 50 85 66 78 L 64 110 Q 50 118 36 110 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 72 48 L 88 110 L 80 115 L 68 55 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 28 48 L 12 110 L 20 115 L 32 55 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 112 L 62 190 L 45 190 L 48 115 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 112 L 38 190 L 55 190 L 52 115 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 58 28 Q 50 35 42 28 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 32 L 54 32 L 55 42 L 45 42 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 32 45 Q 50 40 68 45 L 72 75 Q 50 80 28 75 Z" },
    { id: "lower_back", label: "Поясница", d: "M 34 78 Q 50 82 66 78 L 68 105 Q 50 110 32 105 Z" },
    { id: "pelvis", label: "Таз", d: "M 34 108 Q 50 115 66 108 L 64 135 Q 50 145 36 135 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 72 48 L 88 110 L 80 115 L 68 55 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 28 48 L 12 110 L 20 115 L 32 55 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 138 L 62 195 L 45 195 L 48 140 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 138 L 38 195 L 55 195 L 52 140 Z" },
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
                "relative w-full max-w-[200px] aspect-[100/150] overflow-hidden rounded-2xl bg-white",
                !isPrint && "shadow-sm border border-border/50"
            )}>
                {/* Background anatomical image */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-contain transition-transform duration-500 hover:scale-105"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy.png')`,
                        backgroundPosition: isBack ? 'right center' : 'left center',
                        backgroundSize: '200% auto'
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
                                className="fill-primary/30 stroke-primary stroke-2 cursor-pointer pointer-events-auto"
                                onClick={() => onToggleZone(z.id)}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            <div className="mt-6 flex flex-wrap max-w-[220px] justify-center gap-1.5">
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
