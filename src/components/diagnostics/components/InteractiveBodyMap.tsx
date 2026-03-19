import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

// Organic Anatomical SVG paths for the high-res Gray 3D Muscle System
const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 15 Q 50 2 58 15 L 62 30 Q 50 42 38 30 Z" },
    { id: "neck_f", label: "Шея (перед)", d: "M 46 32 Q 50 35 54 32 L 56 45 Q 50 48 44 45 Z" },
    { id: "chest", label: "Грудь", d: "M 25 48 Q 38 42 50 45 Q 62 42 75 48 L 78 78 Q 50 88 22 78 Z" },
    { id: "abdomen", label: "Пресс", d: "M 32 82 Q 50 90 68 82 L 66 118 Q 50 128 34 118 Z" },
    { id: "shoulder_r_f", label: "Плечо", d: "M 15 55 Q 8 65 18 85 L 28 65 Q 25 55 18 50 Z" },
    { id: "shoulder_l_f", label: "Плечо", d: "M 85 55 Q 92 65 82 85 L 72 65 Q 75 55 82 50 Z" },
    { id: "r_arm_f", label: "Рука (плечо)", d: "M 18 88 L 12 135 L 25 140 L 28 90 Z" },
    { id: "l_arm_f", label: "Рука (плечо)", d: "M 82 88 L 88 135 L 75 140 L 72 90 Z" },
    { id: "r_leg_f", label: "Нога (спереди)", d: "M 34 125 Q 38 165 25 198 L 48 198 Q 48 165 48 125 Z" },
    { id: "l_leg_f", label: "Нога (спереди)", d: "M 66 125 Q 62 165 75 198 L 52 198 Q 52 165 52 125 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 15 Q 50 2 58 15 L 62 30 Q 50 42 38 30 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 32 Q 50 35 54 32 L 56 45 Q 50 48 44 45 Z" },
    { id: "traps", label: "Лопатка", d: "M 22 45 Q 50 38 78 45 L 82 78 Q 50 88 18 78 Z" },
    { id: "lower_back", label: "Спина (поясница)", d: "M 32 82 Q 50 80 68 82 L 72 110 Q 50 125 28 110 Z" },
    { id: "pelvis", label: "Таз", d: "M 28 115 Q 50 135 72 115 L 70 152 Q 50 162 30 152 Z" },
    { id: "l_arm_b", label: "Рука (сзади)", d: "M 82 88 L 88 135 L 75 140 L 72 90 Z" },
    { id: "r_arm_b", label: "Рука (сзади)", d: "M 18 88 L 12 135 L 25 140 L 28 90 Z" },
    { id: "l_leg_b", label: "Нога (сзади)", d: "M 66 155 Q 70 180 75 198 L 52 198 Q 48 180 52 155 Z" },
    { id: "r_leg_b", label: "Нога (сзади)", d: "M 34 155 Q 30 180 25 198 L 48 198 Q 52 180 48 155 Z" },
];

const buttonGroups = [
    {
        title: "Голова/Шея",
        zones: [
            { id: "head_f", label: "Голова" },
            { id: "neck_f", label: "Шея(П)" },
            { id: "neck_b", label: "Шея(С)" },
            { id: "head_b", label: "Затылок" },
        ]
    },
    {
        title: "Туловище",
        zones: [
            { id: "chest", label: "Грудь" },
            { id: "abdomen", label: "Пресс" },
            { id: "shoulder_r_f", label: "Плечо" },
            { id: "traps", label: "Лопатка" },
            { id: "lower_back", label: "Спина" },
            { id: "pelvis", label: "Таз" },
        ]
    },
    {
        title: "Конечности",
        zones: [
            { id: "r_arm_f", label: "Рука" },
            { id: "r_leg_f", label: "Нога(П)" },
            { id: "l_leg_b", label: "Нога(С)" },
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
        <div className="flex flex-col items-center w-full max-w-[220px]">
            {!isPrint && (
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {title}
                </div>
            )}
            <div className="relative w-full aspect-[1/2] bg-white rounded-xl overflow-hidden shadow-inner border border-slate-50">
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_gray.png')`,
                        backgroundPosition: isBack ? '98% center' : '2% center',
                        backgroundSize: '210% auto'
                    }}
                />
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10">
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const active = selectedZones.includes(z.id) || 
                                (z.id === "shoulder_r_f" && selectedZones.includes("shoulder_r_f")) ||
                                (z.id === "shoulder_l_f" && selectedZones.includes("shoulder_r_f")) ||
                                (z.id === "r_arm_f" && selectedZones.includes("r_arm_f")) ||
                                (z.id === "l_arm_f" && selectedZones.includes("r_arm_f")) ||
                                (z.id === "r_leg_f" && selectedZones.includes("r_leg_f")) ||
                                (z.id === "l_leg_f" && selectedZones.includes("r_leg_f")) ||
                                (z.id === "r_arm_b" && selectedZones.includes("r_arm_f")) ||
                                (z.id === "l_arm_b" && selectedZones.includes("r_arm_f")) ||
                                (z.id === "r_leg_b" && selectedZones.includes("l_leg_b")) ||
                                (z.id === "l_leg_b" && selectedZones.includes("l_leg_b"));

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
        <div className="w-full bg-white flex flex-col items-center gap-8">
            <div className="flex items-start justify-center gap-4 w-full">
                {renderFigure("Анфас", frontZones, false)}
                {renderFigure("Профиль", backZones, true)}
            </div>

            <div className="flex flex-col gap-6 w-full mt-4">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-l-2 border-slate-800 pl-2">
                            {group.title}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id) || (z.id === "shoulder_r_f" && selectedZones.includes("shoulder_r_f"));
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "h-9 px-2 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight transition-all border rounded-md",
                                            isSelected 
                                                ? "bg-[#D92D20] text-white border-[#D92D20] shadow-sm" 
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 text-[9px]"
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
