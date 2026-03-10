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
        label: "Главное", emoji: "📊",
        modules: [
            { key: "hq", label: "Штаб-квартира", icon: LayoutDashboard },
            { key: "accounts", label: "Рекламные кабинеты", icon: Briefcase },
        ],
    },
    {
        label: "Маркетинг", emoji: "🚀",
        modules: [
            { key: "ads", label: "Управление рекламой", icon: Target },
            { key: "content", label: "Контент-Завод", icon: Wand2 },
            { key: "autoposting", label: "Автопостинг", icon: Activity },
            { key: "spy", label: "Мониторинг конкурентов", icon: Radar },
        ],
    },
    {
        label: "Продажи и Сервис", emoji: "💬",
        modules: [
            { key: "crm", label: "CRM Система", icon: Users },
            { key: "ai_rop", label: "AI-РОП", icon: ShieldCheck },
            { key: "quality", label: "Контроль качества", icon: Activity },
            { key: "retention", label: "Генератор LTV", icon: Activity },
        ],
    },
    {
        label: "Аналитика", emoji: "📈",
        modules: [
            { key: "analytics", label: "Сквозная аналитика", icon: Activity },
            { key: "scoreboard", label: "Таблица показателей", icon: FileBarChart },
            { key: "finance", label: "Финансы", icon: Coins },
            { key: "ai_reports", label: "AI Отчётность", icon: FileBarChart },
        ],
    },
    {
        label: "Система", emoji: "⚙️",
        modules: [
            { key: "ai_manager", label: "AI Управляющий", icon: Activity },
        ],
    }
];

export const ALL_KEYS = PERM_GROUPS.flatMap(g => g.modules.map(m => m.key));

export const ROLE_PRESETS: Record<RoleKey, string[]> = {
    superadmin: [...ALL_KEYS],
    client_admin: ["hq", "accounts", "ads", "content", "autoposting", "spy", "crm", "analytics", "scoreboard", "finance", "ai_reports"],
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
            let parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Migrate outdated roles from local storage to new spec
                parsed = parsed.map((m: Record<string, unknown>) => {
                    let r = m.role;
                    let migrated = false;
                    if (r === "admin") { r = "superadmin"; migrated = true; }
                    else if (r === "project" || r === "targetolog") { r = "client_admin"; migrated = true; }
                    else if (r === "analyst") { r = "client_manager"; migrated = true; }

                    if (!ROLE_LABELS[r as RoleKey]) {
                        r = "client_manager";
                        migrated = true;
                    }

                    if (migrated) {
                        m.role = r;
                        m.permissions = ROLE_PRESETS[r as RoleKey] || [];
                    }
                    return m;
                });
                return parsed;
            }
        }
    } catch { /* ignored */ }
    return INITIAL_TEAM;
}

export function saveTeam(team: TeamMember[]) {
    localStorage.setItem("mv_team_members", JSON.stringify(team));
}
