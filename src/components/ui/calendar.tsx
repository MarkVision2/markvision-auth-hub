import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center px-1",
        caption_label: "text-sm font-semibold text-foreground tracking-tight",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border bg-secondary/50",
          "text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/20",
          "transition-all duration-150 p-0",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground/70 rounded-md w-9 font-medium text-[11px] uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: cn(
          "relative h-9 w-9 text-center text-sm p-0",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "[&:has([aria-selected].day-outside)]:bg-primary/5",
          "[&:has([aria-selected])]:bg-primary/10",
          "first:[&:has([aria-selected])]:rounded-l-lg",
          "last:[&:has([aria-selected])]:rounded-r-lg",
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal text-sm rounded-lg transition-all duration-150",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground font-semibold",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-[0_0_8px_hsl(var(--primary)/0.3)]",
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-semibold",
          "ring-1 ring-primary/30",
        ),
        day_outside:
          "day-outside text-muted-foreground/30 aria-selected:bg-primary/5 aria-selected:text-muted-foreground/50",
        day_disabled: "text-muted-foreground/20",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-3.5 w-3.5" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-3.5 w-3.5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
