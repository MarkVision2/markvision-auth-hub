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
    
    if (isPrint) {
        return (
            <div className="w-full bg-white font-sans pt-12 mt-4 pb-12">
                <h2 className="text-2xl font-black mb-12 uppercase tracking-tight text-slate-900 text-center border-b-2 border-slate-900 pb-4 mx-auto max-w-2xl">
                    КАРТА ПРОБЛЕМНЫХ ЗОН
                </h2>
                <div className="flex justify-center w-full">
                    <div className="relative w-full max-w-[800px] border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <img 
                            src="/images/diagnostics/problem_zones_detailed.jpg" 
                            alt="Карта проблемных зон" 
                            className="w-full h-auto block"
                        />
                    </div>
                </div>
                <div className="mt-16 border-t border-slate-200 pt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                    Медицинский протокол • Подробная анатомия боли
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-card flex flex-col items-center p-6 sm:p-10 rounded-[2.5rem] border border-border shadow-2xl overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            {/* Professional Medical Header */}
            <div className="w-full mb-10 border-b-2 border-foreground pb-6 relative z-10 text-center sm:text-left">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                    КАРТА ПРОБЛЕМНЫХ ЗОН
                </h3>
            </div>

            {/* Large High-Res Detailed Map */}
            <div className="w-full max-w-[650px] aspect-[1/1.4] relative rounded-3xl overflow-hidden border-2 border-border/50 shadow-inner bg-slate-900/5 group">
                <img 
                    src="/images/diagnostics/problem_zones_detailed.jpg" 
                    alt="Детализированная карта анатомии" 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

        </div>
    );
};
