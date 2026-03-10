import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, MessageCircle, Instagram, Loader2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";

interface ClientRow {
  name: string;
  phone: string;
  source: string;
  ltv: number;
  aiRating: number;
  lastVisit: string;
  leadCount: number;
}

function ratingBadge(rating: number) {
  if (rating >= 80) return <Badge variant="outline" className="bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)] text-[10px]">🔥 {rating}%</Badge>;
  if (rating >= 50) return <Badge variant="outline" className="bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)] text-[10px]">🌤 {rating}%</Badge>;
  return <Badge variant="outline" className="bg-primary/15 text-primary border-primary/20 text-[10px]">❄️ {rating}%</Badge>;
}

function sourceIcon(source: string) {
  const s = source?.toLowerCase() || "";
  if (s.includes("whatsapp")) return <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--status-good))]"><MessageCircle className="h-3 w-3" /> WhatsApp</div>;
  if (s.includes("instagram")) return <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--status-critical))]"><Instagram className="h-3 w-3" /> Instagram</div>;
  return <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Globe className="h-3 w-3" /> {source || "—"}</div>;
}

export default function ClientDatabase() {
  const { active } = useWorkspace();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (active.id === "hq") {
      setClients([]);
      setLoading(false);
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("leads")
        .select("name, phone, source, amount, ai_score, status, updated_at, created_at")
        .eq("project_id", active.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate by phone (or name if no phone)
      const map = new Map<string, ClientRow>();
      for (const lead of (data || [])) {
        const key = lead.phone || lead.name;
        const existing = map.get(key);
        const isPaid = lead.status === "Оплачен";
        const amt = isPaid ? (Number(lead.amount) || 0) : 0;
        const score = lead.ai_score || 0;
        const lastDate = lead.updated_at || lead.created_at || "";

        if (existing) {
          existing.ltv += amt;
          existing.aiRating = Math.max(existing.aiRating, score);
          existing.leadCount += 1;
          if (lastDate > existing.lastVisit) existing.lastVisit = lastDate;
        } else {
          map.set(key, {
            name: lead.name,
            phone: lead.phone || "—",
            source: lead.source || "—",
            ltv: amt,
            aiRating: score,
            lastVisit: lastDate,
            leadCount: 1,
          });
        }
      }
      setClients(Array.from(map.values()));
    } catch (err: any) {
      console.error("ClientDatabase fetch error:", err);
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    const ch = supabase
      .channel("client_db_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchClients())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchClients, active.id]);

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleExportCSV = () => {
    if (filtered.length === 0) { toast({ title: "Нет данных для экспорта" }); return; }
    const header = "Имя;Телефон;Источник;LTV;AI-Рейтинг;Посл. активность\n";
    const rows = filtered.map(c =>
      `${c.name};${c.phone};${c.source};${c.ltv};${c.aiRating}%;${c.lastVisit === "—" ? "—" : new Date(c.lastVisit).toLocaleDateString("ru-RU")}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clients.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Экспорт завершён", description: `${filtered.length} записей` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 border-border" onClick={handleExportCSV}>
          <Download className="h-3.5 w-3.5" />
          Экспорт CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium">Имя</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Телефон</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Источник</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">LTV</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">AI-Рейтинг</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Посл. активность</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-center">Сделки</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Нет клиентов</TableCell></TableRow>
              ) : filtered.map((client, i) => (
                <TableRow key={i} className="border-border hover:bg-accent/30">
                  <TableCell className="text-sm font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.phone}</TableCell>
                  <TableCell>{sourceIcon(client.source)}</TableCell>
                  <TableCell className="text-sm font-semibold text-primary text-right">{client.ltv > 0 ? `${client.ltv.toLocaleString("ru-RU")} ₸` : "—"}</TableCell>
                  <TableCell>{client.aiRating > 0 ? ratingBadge(client.aiRating) : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] border-border">{client.leadCount}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
