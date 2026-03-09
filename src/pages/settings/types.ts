import {
    LayoutDashboard, Briefcase, Target, Wand2, Radar, ShieldCheck,
    Activity, Coins, FileBarChart, Users,
} from "lucide-react";

/* ── Role presets ── */
export type RoleKey = "admin" | "project" | "targetolog" | "analyst";

export const ROLE_LABELS: Record<RoleKey, string> = {
    admin: "Админ",
    project: "Проджект",
    targetolog: "Таргетолог",
    analyst: "Аналитик",
};

export const ROLE_COLORS: Record<RoleKey, string> = {
    admin: "bg-primary/15 text-primary border-primary/20",
    project: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    targetolog: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    analyst: "bg-violet-500/15 text-violet-400 border-violet-500/20",
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
        label: "Главное", emoji: "📊",
        modules: [{ key: "hq", label: "Штаб-квартира", icon: LayoutDashboard }],
    },
    {
        label: "Трафик и Контент", emoji: "🚀",
        modules: [
            { key: "accounts", label: "Агентские кабинеты", icon: Briefcase },
            { key: "ads", label: "Управление рекламой", icon: Target },
            { key: "content", label: "Контент-Завод", icon: Wand2 },
            { key: "spy", label: "Радар конкурентов", icon: Radar },
        ],
    },
    {
        label: "Продажи", emoji: "💬",
        modules: [
            { key: "crm", label: "CRM Система", icon: Users },
            { key: "ai_rop", label: "AI-РОП", icon: ShieldCheck },
        ],
    },
    {
        label: "Аналитика", emoji: "📈",
        modules: [
            { key: "analytics", label: "Сквозная аналитика", icon: Activity },
            { key: "finance", label: "Финансы", icon: Coins },
            { key: "ai_reports", label: "AI Отчётность", icon: FileBarChart },
        ],
    },
];

export const ALL_KEYS = PERM_GROUPS.flatMap(g => g.modules.map(m => m.key));

export const ROLE_PRESETS: Record<RoleKey, string[]> = {
    admin: [...ALL_KEYS],
    project: ["hq", "accounts", "ads", "content", "spy", "crm", "ai_rop", "analytics", "ai_reports"],
    targetolog: ["accounts", "ads", "content", "spy", "analytics"],
    analyst: ["hq", "analytics", "finance", "ai_reports"],
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
    { id: "1", name: "Владелец аккаунта", email: "admin@markvision.io", role: "admin", status: "active", lastLogin: "Сегодня, 12:04", permissions: [...ALL_KEYS] },
    { id: "2", name: "Алексей Петров", email: "a.petrov@markvision.io", role: "project", status: "active", lastLogin: "Вчера, 18:32", permissions: ROLE_PRESETS.project },
    { id: "3", name: "Мария Сидорова", email: "m.sidorova@markvision.io", role: "targetolog", status: "active", lastLogin: "07 мар, 09:15", permissions: ROLE_PRESETS.targetolog },
    { id: "4", name: "Дмитрий Козлов", email: "d.kozlov@markvision.io", role: "analyst", status: "invited", lastLogin: null, permissions: ROLE_PRESETS.analyst },
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
