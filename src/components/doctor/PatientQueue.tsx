import React from "react";
import { Patient } from "@/types/doctor";
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
        <div className="p-2 space-y-1.5">
            {patients.map((patient) => {
                const isActive = patient.id === activeId;
                return (
                    <div
                        key={patient.id}
                        onClick={() => onSelect(patient)}
                        className={cn(
                            "p-3 rounded-xl cursor-pointer transition-all duration-300 group relative border shadow-sm overflow-hidden",
                            isActive
                                ? "bg-primary/[0.08] border-primary/30 shadow-md scale-[1.01]"
                                : "bg-card border-border hover:bg-muted/50 hover:border-primary/10"
                        )}
                    >
                        {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transition-all" />
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={cn(
                                    "p-1 rounded-md transition-colors",
                                    isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60"
                                )}>
                                    <Clock className="w-3 h-3" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold tabular-nums tracking-tight",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>{patient.time}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0 h-4 border-none",
                                    patient.type === "Первичный"
                                        ? "bg-emerald-500/10 text-[hsl(var(--status-good))]"
                                        : "bg-primary/10 text-primary"
                                )}
                            >
                                {patient.type}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 relative",
                                isActive
                                    ? "bg-primary/20 border-primary/30 ring-2 ring-primary/5"
                                    : "bg-muted border-border group-hover:border-primary/20"
                            )}>
                                <UserCircle2 className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground/40")} />
                                {isActive && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full border border-background animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                    "text-xs font-bold truncate transition-colors tracking-tight",
                                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {patient.name}
                                </h4>
                                <p className="text-[9px] font-medium text-muted-foreground/40 tabular-nums uppercase tracking-widest">
                                    ID-{patient.id}0A9
                                </p>
                            </div>
                        </div>

                        {isActive && (
                            <div className="mt-2 pt-2 border-t border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                                <span className="text-[8px] font-black text-primary uppercase tracking-[0.15em]">Active Session</span>
                                <div className="flex gap-0.5">
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
