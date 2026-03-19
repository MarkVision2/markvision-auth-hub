import React from "react";
import { cn } from "@/lib/utils";

/**
 * UFC Standard Mapping v11.0 (SVG-Internal Edition)
 * Using viewBox="0 0 320 640" to match the 1:1 image slice pixels exactly.
 * This is the most stable way to ensure PDF export and mapping alignment.
 */

const bodyPainMap: Record<string, string[]> = {
    neck: ["neck_f", "neck_b"],
    shoulders: ["shoulders_f", "shoulders_b"],
    thoracic: ["chest"],
    elbows: ["elbows_f", "elbows_b"],
    lumbar: ["lumbar"],
    abs: ["abs"],
    wrists: ["wrists_f"],
    knees: ["knees_f"],
    feet: ["feet_f"],
};

// PIXEL-PERFECT PATHS for 320x640 slice
const frontPaths = [
    { id: "neck_f", d: "M 140 160 Q 160 175 180 160 L 185 190 Q 160 205 135 190 Z" },
    { id: "shoulders_f", d: "M 60 180 Q 30 220 60 280 L 95 240 Q 90 200 75 180 Z M 260 180 Q 290 220 260 280 L 225 240 Q 230 200 245 180 Z" },
    { id: "chest", d: "M 90 210 Q 160 190 230 210 L 240 300 Q 160 330 80 300 Z" },
    { id: "abs", d: "M 100 320 Q 160 340 220 320 L 210 460 Q 160 490 110 460 Z" },
    { id: "elbows_f", d: "M 45 380 Q 30 405 55 440 L 75 400 Z M 275 380 Q 290 405 265 440 L 245 400 Z" },
    { id: "wrists_f", d: "M 35 480 Q 25 500 55 520 L 70 490 Z M 285 480 Q 295 500 265 520 L 250 490 Z" },
    { id: "knees_f", d: "M 100 520 Q 115 540 90 560 L 130 560 Q 130 540 130 520 Z M 220 520 Q 205 540 230 560 L 190 560 Q 190 540 190 520 Z" },
    { id: "feet_f", d: "M 85 610 L 60 640 L 135 640 L 130 610 Z M 235 610 L 260 640 L 185 640 L 190 610 Z" },
];

const backPaths = [
    { id: "neck_b", d: "M 140 160 Q 160 175 180 160 L 185 190 Q 160 205 135 190 Z" },
    { id: "shoulders_b", d: "M 60 180 Q 30 220 60 280 L 95 240 Q 90 200 75 180 Z M 260 180 Q 290 220 260 280 L 225 240 Q 230 200 245 180 Z" },
    { id: "lumbar", d: "M 90 350 Q 160 340 230 350 L 245 480 Q 160 520 75 480 Z" },
    { id: "elbows_b", d: "M 45 380 Q 30 405 55 440 L 75 400 Z M 275 380 Q 290 405 265 440 L 245 400 Z" },
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
    
    const isZoneActive = (svgId: string) => {
        return Object.entries(bodyPainMap).some(([btnId, svgIds]) => {
            return selectedZones.includes(btnId) && svgIds.includes(svgId);
        });
    };

    const renderFigureSVG = (title: string, paths: {id: string, d: string}[], isBack: boolean) => (
        <div className="flex flex-col items-center w-full max-w-[280px]">
            {!isPrint && (
                <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {title}
                </div>
            )}
            <div className="relative w-full aspect-[1/2] bg-white rounded-xl overflow-hidden shadow-md border border-slate-100">
                <svg viewBox="0 0 320 640" className="w-full h-full">
                    {/* Embedded Image for perfect pixel alignment across PDF/Web */}
                    <image 
                        href="/images/diagnostics/human_anatomy_gray.png" 
                        x={isBack ? -320 : 0} 
                        y={0} 
                        width={640} 
                        height={640} 
                        className="opacity-100"
                    />
                    {/* Red SVG Masks */}
                    {paths.map(p => (
                        <path 
                            key={p.id}
                            d={p.d}
                            className={cn(
                                "transition-all duration-300",
                                isZoneActive(p.id) ? "fill-[#D92D20] opacity-80" : "fill-transparent hover:fill-red-500/10 pointer-events-auto cursor-pointer"
                            )}
                            onClick={(e) => {
                                if (isPrint) return;
                                e.stopPropagation();
                                // Find which button this path belongs to
                                const btnId = Object.entries(bodyPainMap).find(([_, svgIds]) => svgIds.includes(p.id))?.[0];
                                if (btnId) onToggleZone(btnId);
                            }}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );

    if (isPrint) {
        return (
            <div className="w-full bg-white font-sans border-t-2 border-slate-900 pt-16 mt-16 pb-16">
                <h2 className="text-2xl font-black mb-12 uppercase tracking-tight text-slate-900 text-center">
                    1. ПРОБЛЕМНЫЕ ЗОНЫ ПАЦИЕНТА
                </h2>
                <div className="flex items-start justify-center gap-16 scale-[1.15] origin-top">
                    {renderFigureSVG("АНФАС", frontPaths, false)}
                    {renderFigureSVG("ВИД СЗАДИ", backPaths, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white flex flex-col items-center p-4">
            {/* Header with Air */}
            <div className="w-full flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[12px]">1</span>
                    ПРОБЛЕМНЫЕ ЗОНЫ
                </h3>
            </div>

            {/* Figures with Air */}
            <div className="flex items-start justify-center gap-8 w-full mb-16 px-4">
                {renderFigureSVG("АНФАС", frontPaths, false)}
                {renderFigureSVG("ВИД СЗАДИ", backPaths, true)}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-10 w-full">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-4">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-900 border-l-4 border-[#D92D20] pl-4">
                            {group.title}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id);
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-14 px-2 flex items-center justify-center text-[11px] font-black uppercase tracking-tight transition-all border-2 rounded-2xl",
                                            isSelected 
                                                ? "bg-[#D92D20] text-white border-[#D92D20] shadow-lg scale-[0.97]" 
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-white"
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

            <div className="mt-12 text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center opacity-70">
                UFC MEDICAL SYSTEM • СИНХРОНИЗИРОВАНО
            </div>
        </div>
    );
};
