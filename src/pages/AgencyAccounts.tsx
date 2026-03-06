import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Pencil, Check, X, Trash2 } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import PeriodPicker from "@/components/agency/PeriodPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { DateRange } from "react-day-picker";

type ClientRow = Tables<"clients_config">;

function fmt(n: number, suffix = ""): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M" + suffix;
  if (n >= 1000) return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + suffix;
  return Math.round(n).toString() + suffix;
}

const statusCfg = {
  active: { label: "Активен", dot: "bg-emerald-400", text: "text-emerald-400" },
  paused: { label: "Остановлен", dot: "bg-zinc-500", text: "text-zinc-500" },
};

function EditableBudget({ value, clientId, onSaved }: { value: number; clientId: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("clients_config")
      .update({ daily_budget: Number(draft) || 0 })
      .eq("id", clientId);
    setSaving(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(false);
    onSaved();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 w-24 text-xs bg-secondary border-border"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        />
        <button onClick={save} disabled={saving} className="text-primary hover:text-primary/80">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value.toString()); setEditing(true); }}
      className="group flex items-center gap-1.5 text-sm font-semibold text-foreground tabular-nums hover:text-primary transition-colors"
    >
      {value > 0 ? fmt(value, " ₸") : "—"}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function DeleteButton({ clientName, clientId, onDeleted }: { clientName: string; clientId: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("clients_config").delete().eq("id", clientId);
    setDeleting(false);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено", description: clientName });
    onDeleted();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/row:opacity-100">
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Удалить кабинет?</AlertDialogTitle>
          <AlertDialogDescription>
            Кабинет «{clientName}» будет удалён навсегда. Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AgencyAccounts() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients_config")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Realtime: auto-sync INSERT/UPDATE/DELETE
  useEffect(() => {
    const channel = supabase
      .channel("clients_config_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients_config" },
        () => { fetchClients(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchClients]);

  const filtered =
    filter === "all"
      ? clients
      : filter === "paused"
      ? clients.filter((c) => !c.is_active)
      : clients.filter((c) => c.is_active && (c.meta_leads ?? 0) === 0);

  return (
    <DashboardLayout breadcrumb="Агентские кабинеты">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Агентские кабинеты</h1>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Все ({clients.length})</TabsTrigger>
            <TabsTrigger value="attention" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Без лидов</TabsTrigger>
            <TabsTrigger value="paused" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Остановлены</TabsTrigger>
          </TabsList>
        </Tabs>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent bg-secondary/50">
              <TableHead className="text-xs font-medium text-muted-foreground w-[200px]">Кабинет</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Расходы</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Лиды</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">CPL</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Бюджет/день</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Визиты</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Продажи</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Нет кабинетов
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const active = c.is_active !== false;
                const s = active ? statusCfg.active : statusCfg.paused;
                const spend = Number(c.spend) || 0;
                const leads = c.meta_leads ?? 0;
                const cpl = leads > 0 ? spend / leads : 0;
                const budget = Number(c.daily_budget) || 0;
                const visits = 0;
                const sales = 0;
                const costPerVisit = visits > 0 ? spend / visits : 0;
                const cac = sales > 0 ? spend / sales : 0;

                return (
                  <TableRow key={c.id} className="group/row border-b border-border hover:bg-accent/50 transition-colors">
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground">{c.client_name}</p>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] mt-1 ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{fmt(spend, " ₸")}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{leads}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {cpl > 0 ? fmt(cpl, " ₸") : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <EditableBudget value={budget} clientId={c.id} onSaved={fetchClients} />
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{visits || "—"}</p>
                      {costPerVisit > 0 && (
                        <p className="text-[11px] text-muted-foreground tabular-nums">{fmt(costPerVisit, " ₸/визит")}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{sales || "—"}</p>
                      {cac > 0 && (
                        <p className="text-[11px] text-muted-foreground tabular-nums">CAC: {fmt(cac, " ₸")}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <DeleteButton clientName={c.client_name} clientId={c.id} onDeleted={fetchClients} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={fetchClients} />
    </DashboardLayout>
  );
}
