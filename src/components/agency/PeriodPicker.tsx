import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

const presets = [
  { label: "Сегодня", range: () => ({ from: new Date(), to: new Date() }) },
  { label: "Вчера", range: () => { const d = subDays(new Date(), 1); return { from: d, to: d }; } },
  { label: "7 дней", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "30 дней", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Этот месяц", range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Прошлый месяц", range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

interface PeriodPickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value.from ?? new Date());

  const goBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = subMonths(viewMonth, 1);
    setViewMonth(prev);
    onChange({ from: startOfMonth(prev), to: endOfMonth(prev) });
  };

  const goForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = addMonths(viewMonth, 1);
    setViewMonth(next);
    onChange({ from: startOfMonth(next), to: endOfMonth(next) });
  };

  const monthLabel = format(viewMonth, "LLLL yyyy", { locale: ru });
  const rangeLabel = value.from && value.to
    ? `${format(value.from, "d MMM", { locale: ru })} – ${format(value.to, "d MMM yyyy", { locale: ru })}`
    : monthLabel;

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={goBack}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 text-xs border-border bg-secondary text-secondary-foreground hover:text-foreground min-w-[180px] capitalize">
            <CalendarDays className="h-3.5 w-3.5" />
            {rangeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          <div className="border-r border-border p-3 space-y-1 min-w-[130px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Быстрый выбор</p>
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const r = p.range();
                  onChange(r);
                  setViewMonth(r.from);
                  setOpen(false);
                }}
                className="block w-full text-left text-xs px-2 py-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => {
              if (range) {
                onChange(range);
                if (range.from) setViewMonth(range.from);
              }
            }}
            month={viewMonth}
            onMonthChange={setViewMonth}
            numberOfMonths={2}
            locale={ru}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={goForward}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
