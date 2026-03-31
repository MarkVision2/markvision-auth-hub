import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWorkspace, HQ_ID } from "@/hooks/useWorkspace";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Plus, Trash2, Wallet, PiggyBank, Users, UserPlus, X,
    Receipt, Percent, ChevronDown,
} from "lucide-react";
import {
    type ClientService, type ClientFinance, type FinanceTeamMember,
    fmt, fmtCurrency, KpiCard, Section,
    defaultServices, billingLabels, statusOptions,
} from "./shared";

/* ── Services Popover ── */
function ServicesPopover({ client, allServices, onUpdate }: {
    client: ClientFinance;
    allServices: string[];
    onUpdate: (services: ClientService[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState("");

    const removeService = (name: string) => onUpdate(client.services.filter(s => s.name !== name));
    const updateServicePrice = (name: string, price: number) =>
        onUpdate(client.services.map(s => s.name === name ? { ...s, price } : s));
    const addExistingService = (name: string) => {
        if (!client.services.find(s => s.name === name)) {
            onUpdate([...client.services, { name, price: 0 }]);
        }
    };
    const addNewService = () => {
        if (newName.trim() && !client.services.find(s => s.name === newName.trim())) {
            onUpdate([...client.services, { name: newName.trim(), price: 0 }]);
            setNewName("");
        }
    };

    const unusedServices = allServices.filter(s => !client.services.find(cs => cs.name === s));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                    <span className="font-semibold text-foreground">{client.services.length}</span> услуг
                    <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{client.name} — Услуги</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Добавьте или удалите услуги</p>
                </div>
                <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {client.services.map(s => (
                        <div key={s.name} className="flex items-center gap-2 group/row">
                            <span className="text-xs text-foreground flex-1 truncate">{s.name}</span>
                            <Input type="number" value={s.price || ""} onChange={(e) => updateServicePrice(s.name, Number(e.target.value))}
                                placeholder="0" className="h-7 w-[90px] text-right text-xs rounded-md tabular-nums" />
                            <button onClick={() => removeService(s.name)} className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {client.services.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 text-center py-2">Нет услуг</p>
                    )}
                </div>
                {unusedServices.length > 0 && (
                    <div className="p-3 border-t border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Добавить</p>
                        <div className="flex flex-wrap gap-1.5">
                            {unusedServices.map(s => (
                                <button key={s} onClick={() => addExistingService(s)}
                                    className="text-[11px] px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                                    + {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="p-3 border-t border-border flex gap-2">
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Новая услуга…"
                        className="h-8 text-xs flex-1" onKeyDown={(e) => { if (e.key === "Enter") addNewService(); }} />
                    <Button variant="ghost" size="sm" onClick={addNewService} className="h-8 text-xs px-2 shrink-0">
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/* ── Main AgencyTab ── */
export default function AgencyTab() {
    const { active } = useWorkspace();
    const [clientsData, setClientsData] = useState<ClientFinance[]>([]);
    const [team, setTeam] = useState<FinanceTeamMember[]>([]);
    const [services, setServices] = useState<string[]>(defaultServices);
    const [newServiceName, setNewServiceName] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [newClient, setNewClient] = useState({ name: "", services: [] as ClientService[], nextBilling: "" });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            let clientsQuery = (supabase as any).from("clients_config").select("id, client_name, is_active").eq("is_active", true).neq("is_agency", true);
            if (active.id !== HQ_ID) {
                clientsQuery = clientsQuery.eq("project_id", active.id);
            }
            const { data: clients } = await clientsQuery;
            const { data: allServices } = await (supabase as any).from("finance_client_services").select("*");
            const { data: allBilling } = await (supabase as any).from("finance_client_billing").select("*");

            if (clients) {
                const mapped: ClientFinance[] = clients.map((c: any) => {
                    const svcs = (allServices || []).filter((s: any) => s.client_config_id === c.id).map((s: any) => ({ name: s.service_name, price: Number(s.price) }));
                    const billing = (allBilling || []).find((b: any) => b.client_config_id === c.id);
                    return {
                        id: c.id, name: c.client_name, services: svcs,
                        expenses: billing ? Number(billing.expenses) : 0,
                        nextBilling: billing?.next_billing || "",
                        billingStatus: (billing?.billing_status || "upcoming") as ClientFinance["billingStatus"],
                    };
                });
                setClientsData(mapped);
            }
        } catch (err) {
            console.error("Finance fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [active.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const saveServices = async (clientId: string, svcs: ClientService[]) => {
        await (supabase as any).from("finance_client_services").delete().eq("client_config_id", clientId);
        if (svcs.length > 0) {
            await (supabase as any).from("finance_client_services").insert(
                svcs.map(s => ({ client_config_id: clientId, service_name: s.name, price: s.price }))
            );
        }
    };

    const saveBilling = async (clientId: string, expenses: number, nextBilling: string, billingStatus: string) => {
        await (supabase as any).from("finance_client_billing").upsert({
            client_config_id: clientId, expenses,
            next_billing: nextBilling || null, billing_status: billingStatus,
            updated_at: new Date().toISOString(),
        }, { onConflict: "client_config_id" });
    };

    const handleAddClient = async () => {
        if (!newClient.name) return;
        const { data: inserted } = await (supabase as any).from("clients_config").insert({ client_name: newClient.name }).select("id").single();
        if (inserted) {
            if (newClient.services.length > 0) await saveServices(inserted.id, newClient.services);
            await saveBilling(inserted.id, 0, newClient.nextBilling, "upcoming");
        }
        setNewClient({ name: "", services: [], nextBilling: "" });
        setAddOpen(false);
        fetchData();
    };

    const updateClient = async (id: string, field: keyof ClientFinance, value: unknown) => {
        setClientsData(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        const client = clientsData.find(c => c.id === id);
        if (!client) return;
        if (field === "services") {
            await saveServices(id, value as ClientService[]);
        } else if (field === "expenses" || field === "nextBilling" || field === "billingStatus") {
            const updated = { ...client, [field]: value };
            await saveBilling(id, updated.expenses, updated.nextBilling, updated.billingStatus);
        }
    };

    const removeClient = async (id: string) => {
        setClientsData(prev => prev.filter(c => c.id !== id));
        await (supabase as any).from("finance_client_services").delete().eq("client_config_id", id);
        await (supabase as any).from("finance_client_billing").delete().eq("client_config_id", id);
        await (supabase as any).from("clients_config").update({ is_active: false }).eq("id", id);
    };

    const addService = () => {
        if (newServiceName.trim() && !services.includes(newServiceName.trim())) {
            setServices(prev => [...prev, newServiceName.trim()]);
            setNewServiceName("");
        }
    };

    const getClientRevenue = (c: ClientFinance) => c.services.reduce((s, sv) => s + sv.price, 0);
    const totalMrr = clientsData.reduce((s, c) => s + getClientRevenue(c), 0);
    const totalExpenses = clientsData.reduce((s, c) => s + c.expenses, 0);
    const taxRate = 0.10;
    const totalTax = totalMrr * taxRate;
    const totalProfit = totalMrr - totalExpenses - totalTax;
    const avgMargin = totalMrr > 0 ? Math.round((totalProfit / totalMrr) * 100) : 0;

    if (loading) {
        return <div className="text-center py-20 text-muted-foreground">Загрузка данных...</div>;
    }

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Wallet} label="MRR" value={fmtCurrency(totalMrr)} />
                <KpiCard icon={Receipt} label="Налоги (10%)" value={fmtCurrency(totalTax)} valueClass="text-status-warning" />
                <KpiCard icon={PiggyBank} label="Выручка (после маркетинга)" value={fmtCurrency(totalProfit)} valueClass={totalProfit >= 0 ? "text-primary" : "text-destructive"} />
                <KpiCard icon={Percent} label="Маржинальность" value={`${avgMargin}%`} />
            </div>

            {/* Clients Table */}
            <Section
                title={`Клиенты · ${clientsData.length}`}
                action={
                    <Sheet open={addOpen} onOpenChange={setAddOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Добавить клиента</Button>
                        </SheetTrigger>
                        <SheetContent className="w-[420px]">
                            <SheetHeader><SheetTitle className="text-lg">Новый клиент</SheetTitle></SheetHeader>
                            <div className="space-y-5 mt-8">
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">Имя клиента</label>
                                    <Input value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Название компании" className="h-10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">Услуги</label>
                                    <div className="flex flex-wrap gap-2">
                                        {services.map(s => {
                                            const selected = newClient.services.find(sv => sv.name === s);
                                            return (
                                                <button key={s} onClick={() => setNewClient(p => ({
                                                    ...p, services: selected ? p.services.filter(x => x.name !== s) : [...p.services, { name: s, price: 0 }]
                                                }))}
                                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selected ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-border"}`}>
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {newClient.services.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-medium">Стоимость услуг (₸)</label>
                                        {newClient.services.map((sv, i) => (
                                            <div key={sv.name} className="flex items-center gap-2">
                                                <span className="text-xs text-foreground flex-1">{sv.name}</span>
                                                <Input type="number" value={sv.price || ""} onChange={(e) => {
                                                    const updated = [...newClient.services];
                                                    updated[i] = { ...updated[i], price: Number(e.target.value) };
                                                    setNewClient(p => ({ ...p, services: updated }));
                                                }} placeholder="0" className="h-9 w-[120px] text-right rounded-lg tabular-nums" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">Дата оплаты</label>
                                    <Input type="date" value={newClient.nextBilling} onChange={(e) => setNewClient(p => ({ ...p, nextBilling: e.target.value }))} className="h-10 rounded-xl" />
                                </div>
                                <Button onClick={handleAddClient} className="w-full h-11 rounded-xl text-sm mt-2"><Plus className="h-4 w-4 mr-2" /> Добавить клиента</Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "15%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "3%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Клиент</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Услуги</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Оплата</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Расходы</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Прибыль</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Маржа</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Оплата до</th>
                                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Статус</th>
                                <th className="py-3 px-1" />
                            </tr>
                        </thead>
                        <tbody>
                            {clientsData.map((c) => {
                                const revenue = getClientRevenue(c);
                                const profit = revenue - c.expenses;
                                const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                                const statusStyle = billingLabels[c.billingStatus] || billingLabels.upcoming;
                                return (
                                    <tr key={c.id} className="group hover:bg-secondary/20 transition-colors">
                                        <td className="py-4 px-4 align-middle text-left">
                                            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <ServicesPopover client={c} allServices={services} onUpdate={(svcs) => updateClient(c.id, "services", svcs)} />
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <span className="text-sm font-semibold text-foreground tabular-nums">{fmtCurrency(revenue)}</span>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <span className="text-sm font-semibold text-destructive tabular-nums">{fmtCurrency(c.expenses)}</span>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <span className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(profit)}</span>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <span className={`text-xs font-semibold tabular-nums ${margin >= 50 ? "text-primary" : "text-muted-foreground"}`}>{margin}%</span>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <span className="text-xs tabular-nums text-muted-foreground">{c.nextBilling ? c.nextBilling.split("-").reverse().join(".") : "—"}</span>
                                        </td>
                                        <td className="py-4 px-4 align-middle text-left">
                                            <select value={c.billingStatus} onChange={(e) => updateClient(c.id, "billingStatus", e.target.value)}
                                                className={`h-7 text-[11px] rounded-lg px-2 border cursor-pointer transition-colors ${statusStyle.cls}`}>
                                                {statusOptions.map(s => (<option key={s} value={s} className="bg-popover text-foreground">{billingLabels[s].text}</option>))}
                                            </select>
                                        </td>
                                        <td className="py-4 px-1 align-middle">
                                            <button onClick={() => removeClient(c.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-secondary/20">
                                <td className="py-4 px-4 text-sm font-bold text-foreground text-left">Итого</td>
                                <td className="py-4 px-4 text-sm text-muted-foreground text-left">{clientsData.reduce((s, c) => s + c.services.length, 0)} услуг</td>
                                <td className="py-4 px-4 text-sm font-bold text-foreground tabular-nums text-left">{fmtCurrency(totalMrr)}</td>
                                <td className="py-4 px-4 text-sm font-bold text-destructive tabular-nums text-left">{fmtCurrency(totalExpenses)}</td>
                                <td className="py-4 px-4 text-sm font-bold text-primary tabular-nums text-left">{fmtCurrency(totalMrr - totalExpenses)}</td>
                                <td className="py-4 px-4 text-sm font-bold tabular-nums text-left">
                                    <span className={totalMrr > 0 ? "text-primary" : "text-muted-foreground"}>{totalMrr > 0 ? Math.round(((totalMrr - totalExpenses) / totalMrr) * 100) : 0}%</span>
                                </td>
                                <td colSpan={3} />
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Section>

        </div>
    );
}
