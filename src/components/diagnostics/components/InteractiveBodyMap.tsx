import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

/**
 * BODY PAIN MAPPING SYSTEM (UFC Specification v10.0)
 * Keys: Button ID
 * Values: List of SVG Zone IDs to highlight
 */
const bodyPainMap: Record<string, string[]> = {
    neck: ["area-neck-front", "area-neck-back"],
    shoulders: ["area-shoulders-front-l", "area-shoulders-front-r", "area-shoulders-back-l", "area-shoulders-back-r"],
    thoracic: ["area-chest-l", "area-chest-r"],
    elbows: ["area-elbows-front-l", "area-elbows-front-r", "area-elbows-back-l", "area-elbows-back-r"],
    lumbar: ["area-lumbar"],
    abs: ["area-abs"],
    wrists: ["area-wrists-l", "area-wrists-r"],
    knees: ["area-knees-l", "area-knees-r"],
    feet: ["area-feet-l", "area-feet-r"],
};

// PRECISE ANATOMICAL MUSCLE CONTOURS (v10.0)
const frontZones: Zone[] = [
    { id: "area-neck-front", label: "Шея", d: "M 45 15 Q 50 18 55 15 L 56 22 Q 50 24 44 22 Z" },
    { id: "area-shoulders-front-l", label: "Плечо", d: "M 15 20 Q 8 28 15 42 L 28 32 Q 25 22 18 18 Z" },
    { id: "area-shoulders-front-r", label: "Плечо", d: "M 85 20 Q 92 28 85 42 L 72 32 Q 75 22 82 18 Z" },
    { id: "area-chest-l", label: "Грудь", d: "M 28 25 Q 38 22 48 24 L 48 38 Q 38 42 25 38 Z" },
    { id: "area-chest-r", label: "Грудь", d: "M 72 25 Q 62 22 52 24 L 52 38 Q 62 42 75 38 Z" },
    { id: "area-abs", label: "Пресс", d: "M 32 40 Q 50 48 68 40 L 66 62 Q 50 70 34 62 Z" },
    { id: "area-elbows-front-l", label: "Локоть", d: "M 12 55 Q 8 62 16 70 L 22 62 Z" },
    { id: "area-elbows-front-r", label: "Локоть", d: "M 88 55 Q 92 62 84 70 L 78 62 Z" },
    { id: "area-wrists-l", label: "Запястье", d: "M 8 78 L 5 88 L 15 90 L 18 80 Z" },
    { id: "area-wrists-r", label: "Запястье", d: "M 92 78 L 95 88 L 85 90 L 82 80 Z" },
    { id: "area-knees-l", label: "Колено", d: "M 32 82 Q 35 88 28 92 L 45 92 Q 42 88 42 82 Z" },
    { id: "area-knees-r", label: "Колено", d: "M 68 82 Q 65 88 72 92 L 55 92 Q 58 88 58 82 Z" },
    { id: "area-feet-l", label: "Стопа", d: "M 25 93 L 18 100 L 45 100 L 42 93 Z" },
    { id: "area-feet-r", label: "Стопа", d: "M 75 93 L 82 100 L 55 100 L 58 93 Z" },
];

const backZones: Zone[] = [
    { id: "area-neck-back", label: "Шея", d: "M 45 15 Q 50 18 55 15 L 56 22 Q 50 24 44 22 Z" },
    { id: "area-shoulders-back-l", label: "Плечо", d: "M 15 20 Q 8 28 15 42 L 28 32 Q 25 22 18 18 Z" },
    { id: "area-shoulders-back-r", label: "Плечо", d: "M 85 20 Q 92 28 85 42 L 72 32 Q 75 22 82 18 Z" },
    { id: "area-lumbar", label: "Поясница", d: "M 28 45 Q 50 42 72 45 L 75 65 Q 50 75 25 65 Z" },
    { id: "area-elbows-back-l", label: "Локоть", d: "M 15 55 Q 10 62 20 70 L 28 62 Z" },
    { id: "area-elbows-back-r", label: "Локоть", d: "M 85 55 Q 90 62 80 70 L 72 62 Z" },
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
    
    // Check if an SVG zone is active based on the button mapping
    const isZoneActive = (svgId: string) => {
        return Object.entries(bodyPainMap).some(([btnId, svgIds]) => {
            return selectedZones.includes(btnId) && svgIds.includes(svgId);
        });
    };

    const renderFigure = (title: string, zones: Zone[], isBack: boolean) => (
        <div className="flex flex-col items-center w-full max-w-[200px]">
            {!isPrint && (
                <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {title}
                </div>
            )}
            <div className="relative w-full aspect-[1/2] bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_gray.png')`,
                        backgroundPosition: isBack ? '98% top' : '2% top',
                        backgroundSize: '200% auto'
                    }}
                />
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10">
                    <g>
                        {zones.map(z => {
                            const active = isZoneActive(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-all duration-300",
                                        active ? "fill-[#D92D20] opacity-80" : "fill-transparent"
                                    )}
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
            <div className="w-full bg-white font-sans border-t-2 border-slate-900 pt-12 mt-12">
                <h2 className="text-xl font-bold mb-10 uppercase tracking-tight text-slate-900 text-center">
                    ЛИСТ НАЗНАЧЕНИЙ. ЗОНЫ БОЛИ ПАЦИЕНТА
                </h2>
                <div className="flex items-start justify-center gap-16">
                    {renderFigure("АНФАС", frontZones, false)}
                    {renderFigure("ВИД СЗАДИ", backZones, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white flex flex-col items-center">
            {/* 1. Typography & Spacing "Air" */}
            <div className="w-full flex justify-between items-center mb-10 border-b border-slate-50 pb-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                    ПРОБЛЕМНЫЕ ЗОНЫ
                </h3>
            </div>

            {/* 2. Anatomical Models with padding */}
            <div className="flex items-start justify-center gap-6 w-full mb-12">
                {renderFigure("АНФАС", frontZones, false)}
                {renderFigure("ВИД СЗАДИ", backZones, true)}
            </div>

            {/* 3. Button Groups with Mapping Logic */}
            <div className="flex flex-col gap-8 w-full">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900 border-l-4 border-[#D92D20] pl-3">
                            {group.title}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id);
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-12 px-2 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight transition-all border-2 rounded-xl",
                                            isSelected 
                                                ? "bg-[#D92D20] text-white border-[#D92D20] shadow-md scale-[0.98]" 
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-white"
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

            <div className="mt-8 text-[9px] text-slate-400 italic text-center">
                Нажмите на кнопки зон, чтобы отметить проблемные области на анатомической модели
            </div>
        </div>
    );
};
