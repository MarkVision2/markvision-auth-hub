import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Loader2, Sparkles, Send } from "lucide-react";

const SOCIAL_CHANNELS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "telegram", label: "Telegram", emoji: "✈️" },
  { id: "facebook", label: "Facebook", emoji: "📘" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
];

const MOCK_CAPTIONS = [
  "🔥 Готовы к переменам? Мы подготовили для вас нечто особенное!\n\nЭто не просто контент — это стратегия, которая работает на результат.\n\n💡 Сохраняйте, делитесь и применяйте!\n\n#маркетинг #реклама #бизнес #продвижение",
  "✨ Новый уровень вашего бренда начинается здесь.\n\nМы создали визуал, который цепляет взгляд и конвертирует в продажи.\n\n📊 Результаты говорят сами за себя.\n\n#дизайн #контент #smm #digital",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrls: string[];
  mediaType?: string;
}

export default function AutopostSheet({ open, onOpenChange, mediaUrls, mediaType = "image" }: Props) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [caption, setCaption] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleChannel(id: string) {
    setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleAutoCaption() {
    setGeneratingCaption(true);
    await new Promise(r => setTimeout(r, 1500));
    setCaption(MOCK_CAPTIONS[Math.floor(Math.random() * MOCK_CAPTIONS.length)]);
    setGeneratingCaption(false);
    toast({ title: "✨ Описание сгенерировано" });
  }

  async function handleSubmit() {
    if (selectedChannels.length === 0) {
      toast({ title: "Выберите хотя бы одну соцсеть", variant: "destructive" });
      return;
    }
    if (mediaUrls.length === 0) {
      toast({ title: "Нет контента для публикации", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let scheduledAt: string | null = null;
      if (scheduleDate) {
        const [h, m] = scheduleTime.split(":").map(Number);
        const dt = new Date(scheduleDate);
        dt.setHours(h, m, 0, 0);
        scheduledAt = dt.toISOString();
      }

      // Create one autopost item per media URL
      const inserts = mediaUrls.map(url => ({
        media_url: url,
        media_type: mediaType,
        caption: caption || null,
        channels: selectedChannels,
        scheduled_at: scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
      }));

      const { error } = await supabase.from("autopost_items").insert(inserts);
      if (error) throw error;

      toast({ title: "✅ Контент добавлен в автопостинг!", description: `${mediaUrls.length} файл(ов) → ${selectedChannels.length} канал(ов)` });
      onOpenChange(false);
      setSelectedChannels([]);
      setScheduleDate(undefined);
      setScheduleTime("12:00");
      setCaption("");
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-foreground flex items-center gap-2">📅 В автопостинг</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Выберите каналы, дату и добавьте описание
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Контент</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mediaUrls.map((url, i) => (
                <img key={i} src={url} alt={`Медиа ${i + 1}`} className="h-20 w-20 rounded-lg border border-border object-cover shrink-0" />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{mediaUrls.length} файл(ов)</p>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Каналы публикации</Label>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                    selectedChannels.includes(ch.id)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
                  )}>
                  <span>{ch.emoji}</span> {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption with auto-generate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Описание публикации</Label>
              <Button variant="ghost" size="sm" onClick={handleAutoCaption} disabled={generatingCaption}
                className="text-xs text-primary hover:text-primary gap-1.5 h-7">
                {generatingCaption ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Автогенерация
              </Button>
            </div>
            <Textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Текст публикации, хэштеги, CTA..."
              className="min-h-[120px] bg-muted/10 border-border resize-none"
            />
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Дата и время публикации</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left border-border", !scheduleDate && "text-muted-foreground")}>
                    <CalendarIcon size={14} className="mr-2" />
                    {scheduleDate ? format(scheduleDate, "dd MMM yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-28 bg-muted/10 border-border" />
            </div>
            <p className="text-[10px] text-muted-foreground">Оставьте пустым для сохранения как черновик</p>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</> : <><Send className="h-4 w-4" /> Добавить в автопостинг</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
