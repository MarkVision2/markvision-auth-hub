import React from "react";
import { Patient } from "@/pages/DoctorTerminal";
import { cn } from "@/lib/utils";
import { Clock, UserCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PatientQueueProps {
    patients: Patient[];
    activeId?: string;
    onSelect: (patient: Patient) => void;
}

export const PatientQueue: React.FC<PatientQueueProps> = ({ patients, activeId, onSelect }) => {
    return (
        <div className="p-3 space-y-2">
            {patients.map((patient) => {
                const isActive = patient.id === activeId;
                return (
                    <div
                        key={patient.id}
                        onClick={() => onSelect(patient)}
                        className={cn(
                            "p-4 rounded-xl cursor-pointer transition-all duration-300 group relative border",
                            isActive
                                ? "bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full" />
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-white/40">
                                <Clock className={cn("w-3.5 h-3.5", isActive && "text-blue-400")} />
                                <span className={cn("text-xs font-medium", isActive && "text-blue-400")}>{patient.time}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] px-1.5 py-0 leading-tight border-none",
                                    patient.type === "Первичный"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-blue-500/10 text-blue-400"
                                )}
                            >
                                {patient.type}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                                isActive ? "bg-blue-500/20 border-blue-400/30" : "bg-white/5 border-white/5"
                            )}>
                                <UserCircle2 className={cn("w-6 h-6", isActive ? "text-blue-300" : "text-white/20")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-semibold truncate transition-colors",
                                    isActive ? "text-white" : "text-white/70 group-hover:text-white"
                                )}>
                                    {patient.name}
                                </p>
                                <p className="text-[11px] text-white/30 truncate mt-0.5">
                                    ID: #{patient.id}00-42
                                </p>
                            </div>
                        </div>

                        {isActive && (
                            <div className="mt-3 pt-3 border-t border-blue-500/20 animate-in fade-in slide-in-from-top-1 duration-300">
                                <p className="text-[11px] text-blue-300/60 uppercase tracking-tighter font-bold">Активный прием</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
