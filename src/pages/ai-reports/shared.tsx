import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function fmtMoney(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`;
    if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("ru-RU")} ${Math.round(n) >= 1000 ? "" : ""}K ₸`.replace(/\s+K/, "K");
    return `${Math.round(n).toLocaleString("ru-RU")} ₸`;
}

export function fmtNum(n: number) { return n.toLocaleString("ru-RU"); }

export function pctChange(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
}

export function TrendPill({ value, good }: { value: number; good: boolean }) {
    const positive = value > 0;
    const color = good ? "text-primary" : "text-destructive";
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}{value}%
        </span>
    );
}

export function PageFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="px-10 py-4 border-t border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] text-muted-foreground">Сгенерировано <span className="text-foreground font-medium">MarkVision AI</span></span>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">Страница {page} из {total}</span>
        </div>
    );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{children}</h2>
        </div>
    );
}

export function MiniHeader({ clientName, dateRange, subtitle }: { clientName: string; dateRange: string; subtitle: string }) {
    return (
        <>
            <div className="px-10 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-lg">📊</span>
                    <span className="text-sm font-semibold text-foreground">{clientName}</span>
                    <span className="text-xs text-muted-foreground">· {dateRange}</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{subtitle}</span>
            </div>
            <div className="mx-10"><Separator className="bg-border/15" /></div>
        </>
    );
}

export interface ClientOption {
    id: string;
    client_name: string;
}

export interface DailyRow {
    date: string;
    spend: number | null;
    clicks: number | null;
    impressions: number | null;
    leads: number | null;
    visits: number | null;
    sales: number | null;
    revenue: number | null;
}
