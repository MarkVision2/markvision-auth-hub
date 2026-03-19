import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

/**
 * PERCENTAGE-BASED PATHS (v8.0)
 * Using viewBox="0 0 100 100" for easier pixel-perfect alignment.
 * Shifted DOWN to account for image headers.
 */
const frontZones: Zone[] = [
    { id: "neck", label: "Шея", d: "M 44 20 Q 50 23 56 20 L 58 28 Q 50 31 42 28 Z" },
    { id: "shoulders", label: "Плечи", d: "M 18 20 Q 12 25 22 40 L 32 30 Z M 82 20 Q 88 25 78 40 L 68 30 Z" },
    { id: "elbows_f", label: "Локти", d: "M 12 45 Q 8 50 18 58 L 25 50 Z M 88 45 Q 92 50 82 58 L 75 50 Z" },
    { id: "wrists", label: "Запястье", d: "M 8 65 Q 5 70 15 75 L 22 68 Z M 92 65 Q 95 70 85 75 L 78 68 Z" },
    { id: "abs", label: "Пресс", d: "M 32 35 Q 50 42 68 35 L 66 58 Q 50 65 34 58 Z" },
    { id: "knees", label: "Колено", d: "M 32 78 Q 35 83 28 88 L 45 88 Q 42 83 42 78 Z M 68 78 Q 65 83 72 88 L 55 88 Q 58 83 58 78 Z" },
    { id: "feet", label: "Стопа", d: "M 25 93 L 18 100 L 45 100 L 42 93 Z M 75 93 L 82 100 L 55 100 L 58 93 Z" },
];

const backZones: Zone[] = [
    { id: "neck_b", label: "Шея", d: "M 44 20 Q 50 23 56 20 L 58 28 Q 50 31 42 28 Z" },
    { id: "thoracic", label: "Грудной отдел", d: "M 22 20 Q 50 15 78 20 L 82 45 Q 50 55 18 45 Z" },
    { id: "lumbar", label: "Поясница", d: "M 28 48 Q 50 45 72 48 L 75 68 Q 50 78 25 68 Z" },
    { id: "elbows_b", label: "Локти", d: "M 15 45 Q 10 50 20 58 L 28 50 Z M 85 45 Q 90 50 80 58 L 72 50 Z" },
];

const buttonGroups = [
    {
        title: "Верхняя зона",
        zones: [
            { id: "neck", label: "Шея" },
            { id: "thoracic", label: "Грудной отдел" },
            { id: "shoulders", label: "Плечи" },
            { id: "elbows", label: "Локти" },
        ]
    },
    {
        title: "Спина и Центр",
        zones: [
            { id: "lumbar", label: "Поясница" },
            { id: "abs", label: "Пресс" },
            { id: "wrists", label: "Запястье" },
        ]
    },
    {
        title: "Нижняя зона",
        zones: [
            { id: "knees", label: "Колено" },
            { id: "feet", label: "Стопа" },
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
                        backgroundPosition: isBack ? '98% 45%' : '2% 45%', // Centered figures
                        backgroundSize: '200% auto'
                    }}
                />
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 transition-transform duration-500 hover:scale-[1.02]">
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const checkSelected = () => {
                                if (z.id === "neck" || z.id === "neck_b") return selectedZones.includes("neck");
                                if (z.id === "elbows_f" || z.id === "elbows_b") return selectedZones.includes("elbows");
                                return selectedZones.includes(z.id);
                            };
                            const active = checkSelected();

                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-all duration-300",
                                        active ? "fill-[#D92D20] opacity-80" : "fill-transparent hover:fill-red-500/20"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (z.id === "neck_b") onToggleZone("neck");
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
                    {renderFigure("Анфас", frontZones, false)}
                    {renderFigure("Профиль", backZones, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white flex flex-col items-center gap-6">
            <div className="flex items-start justify-center gap-4 w-full">
                {renderFigure("Анфас", frontZones, false)}
                {renderFigure("Профиль", backZones, true)}
            </div>

            <div className="flex flex-col gap-5 w-full mt-2 lg:px-2">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-l-2 border-slate-800 pl-2">
                            {group.title}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id);
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-9 px-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight transition-all border rounded-md text-center",
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
