import { cn } from "@/lib/utils";
import { Search, UserPlus, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { type TeamMember, ROLE_LABELS, ROLE_COLORS } from "./types";

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
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Управление командой</h1>
                <p className="text-sm text-muted-foreground mt-1">Настройка ролей и доступов сотрудников к модулям платформы</p>
            </div>

            {/* Actions bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        placeholder="Поиск по имени или email…"
                        className="pl-9 bg-accent/30 border-border/30 h-9 text-sm"
                    />
                </div>
                <Button onClick={onAdd} className="gap-2 h-9">
                    <UserPlus size={15} />
                    Добавить сотрудника
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-card/30 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/20 hover:bg-transparent">
                            <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Пользователь</TableHead>
                            <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Роль</TableHead>
                            <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Статус</TableHead>
                            <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider">Последний вход</TableHead>
                            <TableHead className="text-muted-foreground/70 text-xs font-semibold uppercase tracking-wider text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {team.map(m => (
                            <TableRow key={m.id} className="border-border/10 hover:bg-accent/20">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                {m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                                            <p className="text-xs text-muted-foreground">{m.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("text-[11px] font-medium", ROLE_COLORS[m.role])}>
                                        {ROLE_LABELS[m.role]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {m.status === "active" ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-xs text-muted-foreground">Активен</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <span className="text-xs text-muted-foreground">Приглашён</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">{m.lastLogin || "—"}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(m)}>
                                            <Pencil size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(m)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {team.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    Сотрудники не найдены
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground/50">
                Всего: {team.length} · Активных: {team.filter(m => m.status === "active").length} · Приглашённых: {team.filter(m => m.status === "invited").length}
            </p>
        </div>
    );
}
