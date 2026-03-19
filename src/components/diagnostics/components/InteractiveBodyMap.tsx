import React from "react";

/**
 * CLEAN ANATOMICAL TEMPLATE (v12.0)
 * Optimized for Manual Marking (Print-ready)
 * All interactive logic and buttons removed as requested.
 */

interface Props {
    selectedZones?: string[]; // Kept for compatibility but unused
    onToggleZone?: (zoneId: string) => void; // Kept for compatibility but unused
    isPrint?: boolean;
}

export const InteractiveBodyMap: React.FC<Props> = ({ isPrint = false }) => {
    
    const renderFigureTable = (title: string, isBack: boolean) => (
        <div className="flex flex-col items-center w-full max-w-[280px]">
            <div className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {title}
            </div>
            <div className="relative w-full aspect-[1/2] bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                <div 
                    className="absolute inset-0 bg-no-repeat"
                    style={{ 
                        backgroundImage: `url('/images/diagnostics/human_anatomy_gray.png')`,
                        backgroundPosition: isBack ? '98% center' : '2% center',
                        backgroundSize: '200% auto'
                    }}
                />
                {/* Clean overlay for the clinician to imagine zones or for future use, but currently empty to avoid any "crooked" UI */}
                <svg viewBox="0 0 320 640" className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
            </div>
        </div>
    );

    if (isPrint) {
        return (
            <div className="w-full bg-white font-sans pt-12 mt-4 pb-12">
                <h2 className="text-2xl font-black mb-16 uppercase tracking-tight text-slate-900 text-center border-b-2 border-slate-900 pb-4 mx-auto max-w-2xl">
                    КАРТА ТЕЛА: ЗОНЫ ДЛЯ ЛЕЧЕНИЯ
                </h2>
                <div className="flex items-start justify-center gap-24 scale-[1.2] origin-top">
                    {renderFigureTable("ВИД СПЕРЕДИ (АНФАС)", false)}
                    {renderFigureTable("ВИД СЗАДИ (ПОСТЕРИОР)", true)}
                </div>
                <div className="mt-20 border-t border-slate-200 pt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                    Медицинский протокол • Ручная разметка зон боли
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white flex flex-col items-center p-8 rounded-[2rem] border border-slate-100 shadow-xl">
            {/* Professional Medical Header */}
            <div className="w-full mb-12 border-b-2 border-slate-900 pb-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                    АНАТОМИЧЕСКАЯ КАРТА ХАБ
                </h3>
            </div>

            {/* Large Clear Figures */}
            <div className="flex items-start justify-center gap-12 w-full mb-8">
                {renderFigureTable("АНФАС", false)}
                {renderFigureTable("ВИД СЗАДИ", true)}
            </div>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full text-center">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-tight mb-2">
                    Режим ручной разметки
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Используйте распечатанную версию Листа Назначений для точного указания зон боли вручную. 
                    <br/>Анатомическая 3D-модель представлена в высоком разрешении.
                </p>
            </div>
        </div>
    );
};
