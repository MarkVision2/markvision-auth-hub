import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 40 10 Q 50 0 60 10 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_f", label: "Шея", d: "M 45 30 L 55 30 L 55 40 L 45 40 Z" },
    { id: "chest", label: "Грудь", d: "M 30 40 Q 50 35 70 40 L 70 65 Q 50 70 30 65 Z" },
    { id: "abdomen", label: "Живот", d: "M 32 68 Q 50 72 68 68 L 65 90 Q 50 95 35 90 Z" },
    { id: "l_arm_f", label: "Лев. рука", d: "M 72 42 L 85 70 L 80 75 L 68 45 Z" },
    { id: "r_arm_f", label: "Прав. рука", d: "M 28 42 L 15 70 L 20 75 L 32 45 Z" },
    { id: "l_leg_f", label: "Лев. нога", d: "M 52 92 L 62 140 L 52 140 L 48 95 Z" },
    { id: "r_leg_f", label: "Прав. нога", d: "M 48 92 L 38 140 L 48 140 L 52 95 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 40 10 Q 50 0 60 10 L 60 25 Q 50 35 40 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 45 30 L 55 30 L 55 40 L 45 40 Z" },
    { id: "upper_back", label: "Лопатки", d: "M 30 40 Q 50 35 70 40 L 70 60 Q 50 62 30 60 Z" },
    { id: "lower_back", label: "Поясница", d: "M 32 62 Q 50 64 68 62 L 65 85 Q 50 90 35 85 Z" },
    { id: "pelvis", label: "Таз", d: "M 34 87 Q 50 92 66 87 L 62 100 Q 50 105 38 100 Z" },
    { id: "l_arm_b", label: "Прав. рука (сзади)", d: "M 72 42 L 85 70 L 80 75 L 68 45 Z" },
    { id: "r_arm_b", label: "Лев. рука (сзади)", d: "M 28 42 L 15 70 L 20 75 L 32 45 Z" },
    { id: "l_leg_b", label: "Прав. нога (сзади)", d: "M 52 102 L 62 140 L 52 140 L 48 105 Z" },
    { id: "r_leg_b", label: "Лев. нога (сзади)", d: "M 48 102 L 38 140 L 48 140 L 52 105 Z" },
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone }) => {
    
    const renderFigure = (title: string, zones: Zone[]) => (
        <div className="flex flex-col items-center">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>
            <svg viewBox="0 0 100 150" className="w-full max-w-[200px] drop-shadow-sm h-auto overflow-visible">
                <g stroke="#cbd5e1" strokeWidth="1.5" strokeLinejoin="round">
                    {zones.map(z => {
                        const isSelected = selectedZones.includes(z.id);
                        return (
                            <path 
                                key={z.id}
                                d={z.d}
                                className={cn(
                                    "cursor-pointer transition-all duration-200 hover:opacity-80",
                                    isSelected ? "fill-primary/60 stroke-primary stroke-2" : "fill-white hover:fill-primary/20"
                                )}
                                onClick={() => onToggleZone(z.id)}
                            />
                        );
                    })}
                </g>
            </svg>
            <div className="mt-4 flex flex-wrap max-w-[220px] justify-center gap-1">
                {zones.map(z => (
                    <span 
                        key={z.id}
                        onClick={() => onToggleZone(z.id)}
                        className={cn(
                            "text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border",
                            selectedZones.includes(z.id) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                        )}
                    >
                        {z.label}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex items-start justify-evenly p-6 bg-slate-50/50 rounded-3xl border border-slate-200/50">
            {renderFigure("Спереди", frontZones)}
            {renderFigure("Сзади", backZones)}
        </div>
    );
};
