import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, MessageCircle, Instagram } from "lucide-react";

const MOCK_CLIENTS = [
  { id: "1", name: "Алина Каримова", phone: "+7 701 234 5678", source: "whatsapp", ltv: 450000, aiRating: 95, lastVisit: "2026-03-01" },
  { id: "2", name: "Даниил Петров", phone: "+7 707 111 2233", source: "instagram", ltv: 85000, aiRating: 60, lastVisit: "2026-02-20" },
  { id: "3", name: "Мария Сидорова", phone: "+7 700 555 4433", source: "whatsapp", ltv: 0, aiRating: 20, lastVisit: "—" },
  { id: "4", name: "Артем Волков", phone: "+7 777 888 9900", source: "instagram", ltv: 320000, aiRating: 88, lastVisit: "2026-02-15" },
  { id: "5", name: "Елена Новикова", phone: "+7 702 333 4455", source: "whatsapp", ltv: 120000, aiRating: 55, lastVisit: "2026-01-10" },
  { id: "6", name: "Сергей Ким", phone: "+7 705 666 7788", source: "whatsapp", ltv: 640000, aiRating: 92, lastVisit: "2026-03-04" },
  { id: "7", name: "Ольга Тен", phone: "+7 708 999 0011", source: "instagram", ltv: 250000, aiRating: 78, lastVisit: "2026-02-28" },
];

function ratingBadge(rating: number) {
  if (rating >= 80) return <Badge variant="outline" className="bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)] text-[10px]">🔥 {rating}%</Badge>;
  if (rating >= 50) return <Badge variant="outline" className="bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)] text-[10px]">🌤 {rating}%</Badge>;
  return <Badge variant="outline" className="bg-primary/15 text-primary border-primary/20 text-[10px]">❄️ {rating}%</Badge>;
}

export default function ClientDatabase() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CLIENTS.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-white/[0.06] text-sm"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 border-white/[0.06]">
          <Download className="h-3.5 w-3.5" />
          Экспорт CSV
        </Button>
      </div>

      <div className="border border-white/[0.06] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground font-medium">Имя</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Телефон</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Источник</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">LTV</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">AI-Рейтинг</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Посл. визит</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id} className="border-white/[0.06] hover:bg-white/[0.02]">
                <TableCell className="text-sm font-medium text-foreground">{client.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.phone}</TableCell>
                <TableCell>
                  {client.source === "whatsapp" ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400"><MessageCircle className="h-3 w-3" /> WhatsApp</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-pink-400"><Instagram className="h-3 w-3" /> Instagram</div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-semibold text-primary text-right">{client.ltv.toLocaleString("ru-RU")} ₸</TableCell>
                <TableCell>{ratingBadge(client.aiRating)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {client.lastVisit === "—" ? "—" : new Date(client.lastVisit).toLocaleDateString("ru-RU")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
