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
        <div className="p-4 space-y-3">
            {patients.map((patient) => {
                const isActive = patient.id === activeId;
                return (
                    <div
                        key={patient.id}
                        onClick={() => onSelect(patient)}
                        className={cn(
                            "p-5 rounded-2xl cursor-pointer transition-all duration-500 group relative border shadow-sm overflow-hidden",
                            isActive
                                ? "bg-primary/[0.08] border-primary/30 shadow-[0_8px_30px_rgb(var(--primary-rgb),0.1)] scale-[1.02]"
                                : "bg-card border-border hover:bg-muted/50 hover:border-primary/10"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-1.5 transition-all" />
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60"
                                )}>
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tabular-nums tracking-tight",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>{patient.time}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-none",
                                    patient.type === "Первичный"
                                        ? "bg-emerald-500/10 text-[hsl(var(--status-good))]"
                                        : "bg-primary/10 text-primary"
                                )}
                            >
                                {patient.type}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 relative",
                                isActive
                                    ? "bg-primary/20 border-primary/30 ring-4 ring-primary/5"
                                    : "bg-muted border-border group-hover:border-primary/20"
                            )}>
                                <UserCircle2 className={cn("w-7 h-7", isActive ? "text-primary" : "text-muted-foreground/40")} />
                                {isActive && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                    "text-sm font-bold truncate transition-colors tracking-tight",
                                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {patient.name}
                                </h4>
                                <p className="text-[10px] font-medium text-muted-foreground/50 tabular-nums uppercase tracking-widest mt-0.5">
                                    Code: {patient.id}0A9
                                </p>
                            </div>
                        </div>

                        {isActive && (
                            <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Текущий визит</span>
                                <div className="flex gap-1">
                                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce delay-0" />
                                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce delay-150" />
                                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce delay-300" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
