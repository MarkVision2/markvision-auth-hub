import { 
    Search, UserPlus, Pencil, Trash2, Shield, 
    MoreVertical, Mail, Calendar, CheckCircle2 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    type TeamMember, ROLE_LABELS, ROLE_COLORS, PERM_GROUPS 
} from "./types";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function TeamTab({
    team, search, onSearch, onAdd, onEdit, onDelete,
}: {
    team: TeamMember[];
    search: string;
    onSearch: (v: string) => void;
    onAdd: () => void;
    onEdit: (m: TeamMember) => void;
    onDelete: (m: TeamMember) => void;
}) {
    const allModules = PERM_GROUPS.flatMap(g => g.modules);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Управление командой</h1>
                    <p className="text-sm text-muted-foreground">Настройка ролей и доступов сотрудников к модулям платформы</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                        <Input
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            placeholder="Найти по имени или почте…"
                            className="pl-9 bg-card/40 border-border/30 h-10 text-sm backdrop-blur-sm"
                        />
                    </div>
                    <Button onClick={onAdd} className="gap-2 h-10 shadow-lg shadow-primary/20">
                        <UserPlus size={16} />
                        Добавить
                    </Button>
                </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {team.map(m => {
                    const initials = m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    const activePerms = allModules.filter(mod => m.permissions.includes(mod.key));
                    
                    return (
                        <div 
                            key={m.id} 
                            className="group relative rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                        >
                            {/* Card Top: Avatar and Role */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="relative">
                                    <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {m.status === "active" && (
                                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm">
                                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5", ROLE_COLORS[m.role])}>
                                        {ROLE_LABELS[m.role]}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-foreground">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-lg border-border/40">
                                            <DropdownMenuItem className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer" onClick={() => onEdit(m)}>
                                                <Pencil size={14} /> Редактировать
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => onDelete(m)}>
                                                <Trash2 size={14} /> Удалить
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Card Body: Info */}
                            <div className="space-y-1 mb-4">
                                <h3 className="text-[15px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{m.name}</h3>
                                <div className="flex items-center gap-1.5 text-muted-foreground/60">
                                    <Mail size={12} />
                                    <span className="text-[11px] truncate whitespace-nowrap">{m.email}</span>
                                </div>
                            </div>

                            <Separator className="bg-border/20 mb-4" />

                            {/* Card Footer: Permissions Strip */}
                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-1">
                                    {activePerms.slice(0, 5).map(mod => (
                                        <div 
                                            key={mod.key} 
                                            title={mod.label}
                                            className="h-7 w-7 rounded-lg bg-accent/30 border border-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent/50 transition-all cursor-help"
                                        >
                                            <mod.icon size={13} />
                                        </div>
                                    ))}
                                    {activePerms.length > 5 && (
                                        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-background flex items-center justify-center text-[10px] font-black text-primary">
                                            +{activePerms.length - 5}
                                        </div>
                                    )}
                                    {activePerms.length === 0 && (
                                        <span className="text-[10px] text-muted-foreground/40 uppercase font-bold tracking-wider py-1">Нет доступов</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-medium">
                                    <Calendar size={11} />
                                    {m.lastLogin ? m.lastLogin : "Не заходил"}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {team.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border/20 rounded-3xl">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/30 flex items-center justify-center mb-4">
                            <Shield className="text-muted-foreground/30" size={24} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Команда пуста</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Добавьте первого сотрудника, чтобы начать работу</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="rounded-2xl bg-primary/5 p-4 flex flex-wrap items-center gap-6 border border-primary/10">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-muted-foreground/80 lowercase">в сети</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-blue-400" />
                   <span className="text-[11px] font-bold text-muted-foreground/80 lowercase">директор</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-amber-400" />
                   <span className="text-[11px] font-bold text-muted-foreground/80 lowercase">менеджер</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-400" />
                   <span className="text-[11px] font-bold text-muted-foreground/80 lowercase">врач</span>
                </div>
                <div className="ml-auto text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">
                    Всего {team.length} сотрудников
                </div>
            </div>
        </div>
    );
}
