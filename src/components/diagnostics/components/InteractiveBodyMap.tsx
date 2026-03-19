import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

/**
 * ULTRA-CALIBRATED PATHS (v9.0)
 * Using viewBox="0 0 100 100"
 * Shifted UP to correct the v8.0 error (where neck hit abdomen).
 */
const frontZones: Zone[] = [
    { id: "neck", label: "Шея", d: "M 44 11 Q 50 14 56 11 L 58 18 Q 50 20 42 18 Z" },
    { id: "shoulders", label: "Плечи", d: "M 15 15 Q 8 20 18 35 L 30 25 Z M 85 15 Q 92 20 82 35 L 70 25 Z" },
    { id: "elbows_f", label: "Локти", d: "M 10 40 Q 5 45 15 50 L 22 45 Z M 90 40 Q 95 45 85 50 L 78 45 Z" },
    { id: "wrists", label: "Запястье", d: "M 5 60 Q 3 65 12 68 L 18 62 Z M 95 60 Q 97 65 88 68 L 82 62 Z" },
    { id: "abs", label: "Пресс", d: "M 32 28 Q 50 35 68 28 L 66 48 Q 50 55 34 48 Z" },
    { id: "knees", label: "Колено", d: "M 32 72 Q 35 77 28 82 L 45 82 Q 42 77 42 72 Z M 68 72 Q 65 77 72 82 L 55 82 Q 58 77 58 72 Z" },
    { id: "feet", label: "Стопа", d: "M 25 88 L 18 98 L 45 98 L 42 88 Z M 75 88 L 82 98 L 55 98 L 58 88 Z" },
];

const backZones: Zone[] = [
    { id: "neck_b", label: "Шея", d: "M 44 11 Q 50 14 56 11 L 58 18 Q 50 20 42 18 Z" },
    { id: "thoracic", label: "Грудной отдел", d: "M 22 15 Q 50 10 78 15 L 82 35 Q 50 45 18 35 Z" },
    { id: "lumbar", label: "Поясница", d: "M 28 38 Q 50 35 72 38 L 75 55 Q 50 62 25 55 Z" },
    { id: "elbows_b", label: "Локти", d: "M 12 40 Q 8 45 18 50 L 25 45 Z M 88 40 Q 92 45 82 50 L 75 45 Z" },
];

const buttonGroups = [
    {
        title: "ВЕРХНЯЯ ЗОНА",
        zones: [
            { id: "neck", label: "ШЕЯ" },
            { id: "thoracic", label: "ГРУДНОЙ ОТДЕЛ" },
            { id: "shoulders", label: "ПЛЕЧИ" },
            { id: "elbows", label: "ЛОКТИ" },
        ]
    },
    {
        title: "СПИНА И ЦЕНТР",
        zones: [
            { id: "lumbar", label: "ПОЯСНИЦА" },
            { id: "abs", label: "ПРЕСС" },
            { id: "wrists", label: "ЗАПЯСТЬЕ" },
        ]
    },
    {
        title: "НИЖНЯЯ ЗОНА",
        zones: [
            { id: "knees", label: "КОЛЕНО" },
            { id: "feet", label: "СТОПА" },
        ]
    }
];

interface Props {
    selectedZones: string[];
    onToggleZone: (zoneId: string) => void;
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ selectedZones = [], onToggleZone, isPrint = false }) => {
    
    const renderFigure = (title: string, zones: Zone[], isBack: boolean) => (
        <div className="flex flex-col items-center w-full max-w-[200px]">
            {!isPrint && (
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {title}
                </div>
            )}
            <div className="relative w-full aspect-[1/2] bg-white rounded-xl overflow-hidden border border-slate-100 group">
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_gray.png')`,
                        backgroundPosition: isBack ? '98% center' : '2% center',
                        backgroundSize: '200% auto'
                    }}
                />
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10">
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const active = selectedZones.includes(z.id) || 
                                (z.id === "neck" && selectedZones.includes("neck_b")) ||
                                (z.id === "neck_b" && selectedZones.includes("neck")) ||
                                (z.id === "elbows_f" && selectedZones.includes("elbows")) ||
                                (z.id === "elbows_b" && selectedZones.includes("elbows"));

                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-all duration-300",
                                        active ? "fill-[#D92D20] opacity-80" : "fill-transparent hover:fill-red-500/15"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (z.id === "neck" || z.id === "neck_b") onToggleZone("neck");
                                        else if (z.id === "elbows_f" || z.id === "elbows_b") onToggleZone("elbows");
                                        else onToggleZone(z.id);
                                    }}
                                />
                            );
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );

    if (isPrint) {
        return (
            <div className="w-full bg-white font-sans border-t-2 border-slate-900 pt-8 mt-8">
                <h2 className="text-xl font-bold mb-10 uppercase tracking-tight text-slate-900 text-center">
                    ЛИСТ НАЗНАЧЕНИЙ. ЗОНЫ БОЛИ ПАЦИЕНТА
                </h2>
                <div className="flex items-start justify-center gap-16">
                    {renderFigure("ВИД СПЕРЕДИ", frontZones, false)}
                    {renderFigure("ВИД СЗАДИ", backZones, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white flex flex-col items-center gap-4">
            <div className="flex items-start justify-center gap-4 w-full">
                {renderFigure("АНФАС", frontZones, false)}
                {renderFigure("ВИД СЗАДИ", backZones, true)}
            </div>

            <div className="flex flex-col gap-4 w-full mt-2">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-l-2 border-slate-800 pl-2">
                            {group.title}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id) || (z.id === "neck" && selectedZones.includes("neck")) || (z.id === "elbows" && selectedZones.includes("elbows"));
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-10 px-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight transition-all border rounded-lg",
                                            isSelected 
                                                ? "bg-[#D92D20] text-white border-[#D92D20] shadow-sm" 
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                                        )}
                                    >
                                        {z.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
