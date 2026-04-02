import { Input } from "@/components/ui/input";

/* ── Formatting ── */
export function fmt(v: number): string {
    return Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");
}
export function fmtCurrency(v: number): string {
    return fmt(v) + " ₸";
}

/* ── Shared inline-edit input style ── */
export const inlineInput = "h-9 bg-secondary/50 border-transparent rounded-lg text-sm tabular-nums focus:border-primary/60 focus:bg-secondary/80 transition-colors placeholder:text-muted-foreground/40";
export const inlineInputRight = `${inlineInput} text-right`;

/* ── KPI Card ── */
export function KpiCard({ icon: Icon, label, value, valueClass = "text-foreground", sub }: {
    icon: React.ElementType; label: string; value: string; valueClass?: string; sub?: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-lg font-bold tracking-tight font-mono tabular-nums ${valueClass}`}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground -mt-0.5">{sub}</p>}
        </div>
    );
}

/* ── Section wrapper ── */
export function Section({ title, action, children, className = "" }: {
    title: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={`rounded-2xl bg-card overflow-hidden ${className}`}>
            <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

/* ── Reusable input field (for decomposition) ── */
export function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">{label}</label>
                <span className="text-xs font-semibold text-foreground tabular-nums">{fmt(value)}{suffix}</span>
            </div>
            <Input
                type="number"
                value={value || ""}
                onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
                className={inlineInput}
            />
        </div>
    );
}

/* ── Types ── */
export interface ClientService {
    name: string;
    price: number;
}

export interface ClientFinance {
    id: string;
    name: string;
    services: ClientService[];
    expenses: number;
    nextBilling: string;
    billingStatus: "paid" | "upcoming" | "overdue";
}

export interface FinanceTeamMember {
    id: string;
    name: string;
    role: string;
    salary: number;
    bonus: number;
}

export const defaultServices = ["Таргет", "СММ", "Маркетинг", "Контент", "SEO", "Разработка", "Дизайн", "CRM"];

export const billingLabels: Record<string, { text: string; cls: string }> = {
    paid: { text: "Оплачено", cls: "bg-primary/10 text-primary border-primary/20" },
    upcoming: { text: "Ожидает оплаты", cls: "bg-status-warning/10 text-status-warning border-status-warning/20" },
    overdue: { text: "Просрочено", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const statusOptions: ClientFinance["billingStatus"][] = ["paid", "upcoming", "overdue"];
