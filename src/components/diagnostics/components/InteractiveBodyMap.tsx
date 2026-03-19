import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

// Precise anatomical SVG paths (organic muscle tracing)
const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_f", label: "Шея (перед)", d: "M 46 28 Q 50 32 54 28 L 56 42 Q 50 45 44 42 Z" },
    { id: "chest", label: "Грудь", d: "M 22 45 Q 35 40 50 42 Q 65 40 78 45 L 82 72 Q 50 82 18 72 Z" },
    { id: "abdomen", label: "Пресс", d: "M 28 78 Q 50 85 72 78 L 70 115 Q 50 125 30 115 Z" },
    { id: "shoulder_r_f", label: "Плечо", d: "M 12 50 Q 8 65 18 85 L 28 65 Q 25 50 18 45 Z" },
    { id: "shoulder_l_f", label: "Плечо", d: "M 88 50 Q 92 65 82 85 L 72 65 Q 75 50 82 45 Z" },
    { id: "r_arm_f", label: "Рука (плечо)", d: "M 15 88 L 10 135 L 22 140 L 25 90 Z" },
    { id: "l_arm_f", label: "Рука (плечо)", d: "M 85 88 L 90 135 L 78 140 L 75 90 Z" },
    { id: "r_leg_f", label: "Нога (спереди)", d: "M 28 120 Q 32 160 22 198 L 48 198 Q 48 160 48 120 Z" },
    { id: "l_leg_f", label: "Нога (спереди)", d: "M 72 120 Q 68 160 78 198 L 52 198 Q 52 160 52 120 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 28 Q 50 32 54 28 L 56 42 Q 50 45 44 42 Z" },
    { id: "traps", label: "Трапеции/Лопатка", d: "M 25 42 Q 50 35 75 42 L 85 75 Q 50 90 15 75 Z" },
    { id: "lower_back", label: "Спина (поясница)", d: "M 28 85 Q 50 80 72 85 L 75 115 Q 50 130 25 115 Z" },
    { id: "pelvis", label: "Таз", d: "M 25 118 Q 50 135 75 118 L 72 155 Q 50 165 28 155 Z" },
    { id: "l_arm_b", label: "Рука (сзади)", d: "M 82 88 L 88 135 L 75 140 L 72 90 Z" },
    { id: "r_arm_b", label: "Рука (сзади)", d: "M 18 88 L 12 135 L 25 140 L 28 90 Z" },
    { id: "l_leg_b", label: "Нога (сзади)", d: "M 68 152 Q 72 175 78 198 L 52 198 Q 48 175 52 152 Z" },
    { id: "r_leg_b", label: "Нога (сзади)", d: "M 32 152 Q 28 175 22 198 L 48 198 Q 52 175 48 152 Z" },
];

const buttonGroups = [
    {
        title: "Группа 1: Голова и Шея",
        zones: [
            { id: "head_f", label: "Голова" },
            { id: "neck_f", label: "Шея (перед)" },
            { id: "neck_b", label: "Шея (сзади)" },
            { id: "head_b", label: "Затылок" },
        ]
    },
    {
        title: "Группа 2: Туловище",
        zones: [
            { id: "chest", label: "Грудь" },
            { id: "abdomen", label: "Пресс" },
            { id: "shoulder_r_f", label: "Плечо" },
            { id: "traps", label: "Лопатка" },
            { id: "lower_back", label: "Спина (поясница)" },
            { id: "pelvis", label: "Таз" },
        ]
    },
    {
        title: "Группа 3: Конечности",
        zones: [
            { id: "r_arm_f", label: "Рука (плечо)" },
            { id: "r_leg_f", label: "Нога (спереди)" },
            { id: "l_leg_b", label: "Нога (сзади)" },
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
        <div className="flex flex-col items-start w-full max-w-[320px]">
            {!isPrint && (
                <div className="mb-6 text-[12px] font-bold uppercase tracking-wider text-slate-800">
                    {title}
                </div>
            )}
            <div className={cn(
                "relative w-full aspect-[1/2] bg-white transition-all duration-500",
                !isPrint && "cursor-crosshair"
            )}>
                {/* Anatomical Image - Strictly White Background, No Frames */}
                <div 
                    className="absolute inset-0 bg-no-repeat bg-contain"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />
                
                {/* Precise SVG Muscle Mask Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10 overflow-visible">
                    <g className="filter drop-shadow-sm">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id) || (z.id === "shoulder_r_f" && selectedZones.includes("shoulder_r_f"));
                            // Handle split zones like shoulder
                            const checkSelected = () => {
                                if (z.id === "shoulder_r_f" || z.id === "shoulder_l_f") return selectedZones.includes("shoulder_r_f");
                                if (z.id === "r_arm_f" || z.id === "l_arm_f") return selectedZones.includes("r_arm_f");
                                if (z.id === "r_leg_f" || z.id === "l_leg_f") return selectedZones.includes("r_leg_f");
                                if (z.id === "r_arm_b" || z.id === "l_arm_b") return selectedZones.includes("r_arm_b");
                                if (z.id === "r_leg_b" || z.id === "l_leg_b") return selectedZones.includes("r_leg_b");
                                return selectedZones.includes(z.id);
                            };
                            
                            const active = checkSelected();

                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-colors duration-300 ease-in-out",
                                        active 
                                            ? "fill-[#D92D20] opacity-80" // Professional Medical Red (saturated but balanced)
                                            : "fill-transparent hover:fill-[#D92D20]/10"
                                    )}
                                    stroke={active ? "#B42318" : "transparent"}
                                    strokeWidth="0.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Specific mapping for symmetrical zones
                                        if (z.id === "shoulder_r_f" || z.id === "shoulder_l_f") onToggleZone("shoulder_r_f");
                                        else if (z.id === "r_arm_f" || z.id === "l_arm_f") onToggleZone("r_arm_f");
                                        else if (z.id === "r_leg_f" || z.id === "l_leg_f") onToggleZone("r_leg_f");
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
            <div className="w-full bg-white font-sans">
                <h2 className="text-xl font-bold text-left mb-12 uppercase tracking-tight text-slate-900 border-b-2 border-slate-900 pb-4">
                    ЛИСТ НАЗНАЧЕНИЙ. ЗОНЫ БОЛИ ПАЦИЕНТА
                </h2>
                <div className="flex items-start justify-start gap-24">
                    {renderFigure("Вид спереди", frontZones, false)}
                    {renderFigure("Вид сзади", backZones, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white p-16 font-sans flex flex-col items-start overflow-hidden">
            {/* Main Header */}
            <h2 className="text-2xl font-bold text-slate-900 mb-16 self-start">Интерактивный лист назначений</h2>

            {/* Figures Layout - Aligned to one left guide */}
            <div className="flex items-start justify-start gap-24 mb-24 w-full">
                {renderFigure("Вид спереди", frontZones, false)}
                {renderFigure("Вид сзади", backZones, true)}
            </div>

            {/* Design System Grid (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16 w-full max-w-6xl">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col items-start">
                        <h5 className="text-[12px] font-bold uppercase tracking-widest text-slate-900 mb-6 border-l-4 border-slate-900 pl-4">
                            {group.title}
                        </h5>
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id);
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-12 w-full px-6 flex items-center justify-center text-[10px] font-medium uppercase tracking-wider transition-all duration-200 border",
                                            "rounded-[4px]", // Strict 4px radius as per Design System
                                            isSelected 
                                                ? "bg-[#D92D20] text-white border-[#D92D20] shadow-sm font-bold" 
                                                : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
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
