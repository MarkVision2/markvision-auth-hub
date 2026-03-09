import { forwardRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fmtMoney, PageFooter, SectionTitle, MiniHeader } from "./shared";

interface Page2Props {
    clientName: string;
    dateRange: string;
    topCreatives: any[];
    channelPie: any[];
}

export const Page2CreativesChannels = forwardRef<HTMLDivElement, Page2Props>(
    ({ clientName, dateRange, topCreatives, channelPie }, ref) => {
        return (
            <div ref={ref} className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
                <MiniHeader clientName={clientName} dateRange={dateRange} subtitle="Креативы и Каналы" />

                {topCreatives.length > 0 && (
                    <div className="px-10 py-7">
                        <SectionTitle>Топ креативов</SectionTitle>
                        <div className="grid grid-cols-3 gap-4">
                            {topCreatives.map(c => (
                                <div key={c.title} className={`rounded-xl border p-5 space-y-3 ${c.color}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{c.badge}</span>
                                        <span className="text-[11px] font-semibold text-foreground">{c.title}</span>
                                    </div>
                                    <div className="aspect-[4/3] rounded-lg bg-accent/20 border border-border/15 flex flex-col items-center justify-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-[11px] font-medium text-foreground truncate max-w-[90%]">{c.name}</p>
                                    </div>
                                    <div className="rounded-lg bg-accent/30 px-3 py-2 text-center">
                                        <p className="text-sm font-bold text-foreground tabular-nums">{c.metric}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {channelPie.length > 0 && (
                    <div className="px-10 py-7 border-t border-border/10">
                        <SectionTitle>Каналы трафика</SectionTitle>
                        <div className="grid grid-cols-[1fr_1fr] gap-6">
                            <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                                <p className="text-xs text-muted-foreground mb-3 font-medium">Выручка по каналам</p>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={channelPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                                                {channelPie.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.3)", borderRadius: 8, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                    {channelPie.map(r => (
                                        <div key={r.name} className="flex items-center gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                                            <span className="text-[11px] text-muted-foreground">{r.name} — {r.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                                <p className="text-xs text-muted-foreground mb-3 font-medium">Детализация по каналам</p>
                                <div className="space-y-0">
                                    <div className="grid grid-cols-4 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold py-2 border-b border-border/10">
                                        <span>Канал</span><span className="text-right">Доля</span><span className="text-right">CPL</span><span className="text-right">Лиды</span>
                                    </div>
                                    {channelPie.map(c => (
                                        <div key={c.name} className="grid grid-cols-4 py-3 border-b border-border/5 last:border-0">
                                            <span className="text-sm text-foreground">{c.name}</span>
                                            <span className="text-sm text-foreground tabular-nums text-right">{c.value}%</span>
                                            <span className="text-sm text-foreground tabular-nums text-right">{fmtMoney(c.cpl)}</span>
                                            <span className="text-sm text-muted-foreground tabular-nums text-right">{c.leads}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <PageFooter page={2} total={3} />
            </div>
        );
    }
);
Page2CreativesChannels.displayName = "Page2CreativesChannels";
