import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

/**
 * CALIBRATED PATHS for Gray 3D Medical Model (v7.0)
 * Note: Coordinates fixed to move UP and center correctly.
 */
const frontZones: Zone[] = [
    { id: "neck", label: "Шея", d: "M 46 22 Q 50 25 54 22 L 56 35 Q 50 38 44 35 Z" },
    { id: "shoulders", label: "Плечи", d: "M 15 35 Q 5 45 18 65 L 28 45 Q 25 35 18 30 Z M 85 35 Q 95 45 82 65 L 72 45 Q 75 35 82 30 Z" },
    { id: "elbows_f", label: "Локти", d: "M 10 95 Q 5 105 15 115 L 22 105 Z M 90 95 Q 95 105 85 115 L 78 105 Z" },
    { id: "wrists", label: "Запястье", d: "M 8 135 Q 5 142 15 145 L 20 138 Z M 92 135 Q 95 142 85 145 L 80 138 Z" },
    { id: "abs", label: "Пресс", d: "M 32 62 Q 50 70 68 62 L 66 98 Q 50 108 34 98 Z" }, // Shifted UP from v6.0
    { id: "knees", label: "Колено", d: "M 32 155 Q 35 165 28 175 L 45 175 Q 42 165 42 155 Z M 68 155 Q 65 165 72 175 L 55 175 Q 58 165 58 155 Z" },
    { id: "feet", label: "Стопа", d: "M 25 188 L 18 200 L 45 200 L 42 188 Z M 75 188 L 82 200 L 55 200 L 58 188 Z" },
];

const backZones: Zone[] = [
    { id: "neck_b", label: "Шея", d: "M 46 22 Q 50 25 54 22 L 56 35 Q 50 38 44 35 Z" },
    { id: "thoracic", label: "Грудной отдел", d: "M 22 40 Q 50 32 78 40 L 82 65 Q 50 75 18 65 Z" },
    { id: "lumbar", label: "Поясница", d: "M 32 72 Q 50 70 68 72 L 72 95 Q 50 105 28 95 Z" },
    { id: "elbows_b", label: "Локти", d: "M 12 95 Q 8 105 18 115 L 25 105 Z M 88 95 Q 92 105 82 115 L 75 105 Z" },
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
            <div className="relative w-full aspect-[1/2] bg-white rounded-xl overflow-hidden border border-slate-100">
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_gray.png')`,
                        backgroundPosition: isBack ? '95% 55%' : '5% 55%', // Calibrated centering
                        backgroundSize: '200% auto'
                    }}
                />
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10 bg-black/0">
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            // Symmetrical/Unified logic
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
                                        active ? "fill-[#D92D20] opacity-80" : "fill-transparent hover:fill-red-500/10"
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
