import {
    LayoutDashboard, Briefcase, Target, Wand2, Radar, ShieldCheck,
    Activity, Coins, FileBarChart, Users,
} from "lucide-react";

/* ── Role presets ── */
export type RoleKey = "superadmin" | "client_admin" | "client_manager";

export const ROLE_LABELS: Record<RoleKey, string> = {
    superadmin: "Суперадмин",
    client_admin: "Директор",
    client_manager: "Менеджер",
};

export const ROLE_COLORS: Record<RoleKey, string> = {
    superadmin: "bg-primary/15 text-primary border-primary/20",
    client_admin: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    client_manager: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

/* ── Permissions structure ── */
export interface PermModule {
    key: string;
    label: string;
    icon: React.ElementType;
}
export interface PermGroup {
    label: string;
    emoji: string;
    modules: PermModule[];
}

export const PERM_GROUPS: PermGroup[] = [
    {
        label: "Модули", emoji: "🚀",
        modules: [
            { key: "content", label: "Контент-Завод", icon: Wand2 },
            { key: "ads", label: "Управление рекламой", icon: Target },
            { key: "spy", label: "Радар конкурентов", icon: Radar },
            { key: "crm", label: "CRM Система", icon: Users },
            { key: "analytics", label: "Сквозная аналитика", icon: Activity },
        ],
    }
];

export const ALL_KEYS = PERM_GROUPS.flatMap(g => g.modules.map(m => m.key));

export const ROLE_PRESETS: Record<RoleKey, string[]> = {
    superadmin: [...ALL_KEYS],
    client_admin: ["content", "ads", "spy", "crm", "analytics"],
    client_manager: ["crm"],
};

/* ── Team member type ── */
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: RoleKey;
    status: "active" | "invited";
    lastLogin: string | null;
    permissions: string[];
}

export const INITIAL_TEAM: TeamMember[] = [
    { id: "1", name: "Владелец", email: "admin@markvision.io", role: "superadmin", status: "active", lastLogin: "Сегодня, 12:04", permissions: [...ALL_KEYS] },
    { id: "2", name: "Директор Клиники", email: "director@clinic.io", role: "client_admin", status: "active", lastLogin: "Вчера, 18:32", permissions: ROLE_PRESETS.client_admin },
    { id: "3", name: "Менеджер", email: "manager@clinic.io", role: "client_manager", status: "active", lastLogin: "07 мар, 09:15", permissions: ROLE_PRESETS.client_manager },
];

export function loadTeam(): TeamMember[] {
    try {
        const raw = localStorage.getItem("mv_team_members");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { }
    return INITIAL_TEAM;
}

export function saveTeam(team: TeamMember[]) {
    localStorage.setItem("mv_team_members", JSON.stringify(team));
}
