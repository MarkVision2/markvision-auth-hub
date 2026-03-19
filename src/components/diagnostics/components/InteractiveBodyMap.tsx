import React from "react";
import { cn } from "@/lib/utils";

interface Zone {
    id: string;
    label: string;
    d: string; // SVG path
}

const frontZones: Zone[] = [
    { id: "head_f", label: "Голова", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_f", label: "Шея (перед)", d: "M 46 30 Q 50 28 54 30 L 58 42 Q 50 45 42 42 Z" },
    { id: "chest", label: "Грудь", d: "M 22 45 Q 50 35 78 45 L 82 75 Q 50 82 18 75 Z" },
    { id: "abdomen", label: "Пресс", d: "M 28 78 Q 50 85 72 78 L 70 115 Q 50 125 30 115 Z" },
    { id: "shoulder_f", label: "Плечо", d: "M 22 45 L 32 60 L 15 65 Z M 78 45 L 85 65 L 68 60 Z" },
    { id: "r_arm_f", label: "Рука (плечо)", d: "M 20 50 L 5 115 L 15 120 L 28 60 Z" },
    { id: "l_arm_f", label: "Рука (плечо)", d: "M 80 50 L 95 115 L 85 120 L 72 60 Z" },
    { id: "r_leg_f", label: "Нога (спереди)", d: "M 32 120 L 22 198 L 48 198 L 48 115 Z" },
    { id: "l_leg_f", label: "Нога (спереди)", d: "M 68 120 L 78 198 L 52 198 L 52 115 Z" },
];

const backZones: Zone[] = [
    { id: "head_b", label: "Затылок", d: "M 42 12 Q 50 2 58 12 L 62 25 Q 50 35 38 25 Z" },
    { id: "neck_b", label: "Шея (сзади)", d: "M 46 30 Q 50 28 54 30 L 58 42 Q 50 45 42 42 Z" },
    { id: "upper_back", label: "Лопатка", d: "M 20 42 Q 50 35 80 42 L 85 75 Q 50 85 15 75 Z" },
    { id: "lower_back", label: "Спина (поясница)", d: "M 28 78 Q 50 72 72 78 L 75 105 Q 50 115 25 105 Z" },
    { id: "pelvis", label: "Таз/Ягодицы", d: "M 25 108 Q 50 125 75 108 L 72 145 Q 50 155 28 145 Z" },
    { id: "r_arm_b", label: "Рука (сзади)", d: "M 20 50 L 5 115 L 15 120 L 28 60 Z" },
    { id: "l_arm_b", label: "Рука (сзади)", d: "M 80 50 L 95 115 L 85 120 L 72 60 Z" },
    { id: "r_leg_b", label: "Нога (сзади)", d: "M 32 135 L 22 198 L 45 198 L 48 140 Z" },
    { id: "l_leg_b", label: "Нога (сзади)", d: "M 68 135 L 78 198 L 55 198 L 52 140 Z" },
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
            { id: "shoulder_f", label: "Плечо" },
            { id: "upper_back", label: "Лопатка" },
            { id: "lower_back", label: "Спина (поясница)" },
            { id: "pelvis", label: "Таз/Ягодицы" },
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
        <div className="flex flex-col items-center flex-1">
            {!isPrint && (
                <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {title}
                </div>
            )}
            <div className={cn(
                "relative w-full max-w-[260px] aspect-[1/2] bg-white overflow-hidden",
                !isPrint && "border border-slate-100 rounded-3xl"
            )}>
                {/* Anatomical Image */}
                <div 
                    className="absolute inset-0 bg-no-repeat transition-all duration-300"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_v2.png')`,
                        backgroundPosition: isBack ? '100% 0%' : '0% 0%',
                        backgroundSize: '200% 100%'
                    }}
                />
                
                {/* Interactive SVG Overlay */}
                <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full z-10">
                    <g className="cursor-pointer">
                        {zones.map(z => {
                            const isSelected = selectedZones.includes(z.id);
                            return (
                                <path 
                                    key={z.id}
                                    d={z.d}
                                    className={cn(
                                        "transition-all duration-200",
                                        isSelected 
                                            ? "fill-[#FF0000]/80 stroke-[#FF0000] stroke-[1px]" 
                                            : "fill-transparent hover:fill-red-500/10"
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
                </svg>
            </div>
        </div>
    );

    if (isPrint) {
        return (
            <div className="w-full">
                <h2 className="text-lg font-bold text-center mb-8 uppercase tracking-widest">
                    ЛИСТ НАЗНАЧЕНИЙ. ЗОНЫ БОЛИ ПАЦИЕНТА
                </h2>
                <div className="flex items-center justify-center gap-12 bg-white p-8">
                    {renderFigure("Вид спереди", frontZones, false)}
                    {renderFigure("Вид сзади", backZones, true)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto p-12 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            {/* Figures Container */}
            <div className="flex items-start justify-center gap-16">
                {renderFigure("Вид спереди", frontZones, false)}
                {renderFigure("Вид сзади", backZones, true)}
            </div>

            {/* Buttons Container Grouped by TZ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100/50">
                {buttonGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                            {group.title}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {group.zones.map(z => {
                                const isSelected = selectedZones.includes(z.id);
                                return (
                                    <button 
                                        key={z.id}
                                        onClick={() => onToggleZone(z.id)}
                                        className={cn(
                                            "text-[10px] px-5 py-2.5 rounded-xl transition-all duration-300 border font-bold uppercase tracking-wider",
                                            isSelected 
                                                ? "bg-[#FF0000] text-white border-[#FF0000] shadow-lg shadow-red-500/20 scale-105" 
                                                : "bg-white text-slate-500 border-slate-100 hover:border-red-500/40 hover:text-red-500"
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
