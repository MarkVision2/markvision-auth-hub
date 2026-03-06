import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Instagram } from "lucide-react";
import LeadDetailSheet from "./LeadDetailSheet";

interface Lead {
  id: string;
  name: string;
  phone: string;
  amount: number;
  quality: "hot" | "warm" | "cold";
  qualityScore: number;
  source: "whatsapp" | "instagram";
  date: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  leads: Lead[];
}

const MOCK_COLUMNS: KanbanColumn[] = [
  {
    id: "new",
    title: "Новая заявка",
    leads: [
      { id: "1", name: "Алина Каримова", phone: "+7 701 234 5678", amount: 150000, quality: "hot", qualityScore: 95, source: "whatsapp", date: "2026-03-05" },
      { id: "2", name: "Даниил Петров", phone: "+7 707 111 2233", amount: 85000, quality: "warm", qualityScore: 60, source: "instagram", date: "2026-03-04" },
    ],
  },
  {
    id: "no-answer",
    title: "Без ответа",
    leads: [
      { id: "3", name: "Мария Сидорова", phone: "+7 700 555 4433", amount: 200000, quality: "cold", qualityScore: 20, source: "whatsapp", date: "2026-03-03" },
    ],
  },
  {
    id: "in-progress",
    title: "В работе",
    leads: [
      { id: "4", name: "Артем Волков", phone: "+7 777 888 9900", amount: 320000, quality: "hot", qualityScore: 88, source: "instagram", date: "2026-03-02" },
      { id: "5", name: "Елена Новикова", phone: "+7 702 333 4455", amount: 120000, quality: "warm", qualityScore: 55, source: "whatsapp", date: "2026-03-01" },
      { id: "6", name: "Сергей Ким", phone: "+7 705 666 7788", amount: 95000, quality: "hot", qualityScore: 92, source: "whatsapp", date: "2026-02-28" },
    ],
  },
  {
    id: "invoice",
    title: "Счет выставлен",
    leads: [
      { id: "7", name: "Ольга Тен", phone: "+7 708 999 0011", amount: 450000, quality: "hot", qualityScore: 97, source: "instagram", date: "2026-02-27" },
    ],
  },
  { id: "booked", title: "Записан", leads: [] },
  {
    id: "visited",
    title: "Визит совершен",
    leads: [
      { id: "8", name: "Иван Козлов", phone: "+7 771 222 3344", amount: 180000, quality: "warm", qualityScore: 70, source: "whatsapp", date: "2026-02-25" },
    ],
  },
  { id: "paid", title: "Оплачен", leads: [] },
  {
    id: "rejected",
    title: "Отказ",
    leads: [
      { id: "9", name: "Тимур Жумагулов", phone: "+7 700 111 5566", amount: 60000, quality: "cold", qualityScore: 10, source: "instagram", date: "2026-02-20" },
    ],
  },
];

const qualityConfig = {
  hot: { label: "🔥 Горячий", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  warm: { label: "🌤 Тёплый", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  cold: { label: "❄️ Холодный", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};

export default function KanbanBoard() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
        {MOCK_COLUMNS.map((col) => (
          <div key={col.id} className="min-w-[280px] w-[280px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-sm font-medium text-foreground">{col.title}</span>
              <span className="text-xs text-muted-foreground">• {col.leads.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 flex-1">
              {col.leads.map((lead) => {
                const q = qualityConfig[lead.quality];
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleCardClick(lead)}
                    className="bg-[#111] border border-white/[0.06] rounded-lg p-3.5 cursor-pointer transition-all hover:border-white/[0.15] hover:bg-[#151515] group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.phone}</p>
                      </div>
                      {lead.source === "whatsapp" ? (
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Instagram className="h-3.5 w-3.5 text-pink-400" />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-primary">
                        {lead.amount.toLocaleString("ru-RU")} ₸
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${q.className}`}>
                        {q.label} ({lead.qualityScore}%)
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {col.leads.length === 0 && (
                <div className="border border-dashed border-white/[0.06] rounded-lg h-24 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Пусто</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
