import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const cfStyles = {
  page: "mx-auto w-full max-w-[1920px] px-3 sm:px-4 md:px-6 2xl:px-10 py-4 sm:py-6",
  grid: "grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8",
  card: "rounded-3xl border border-border/50 bg-card shadow-sm",
  cardSoft: "rounded-2xl border border-border/40 bg-secondary/20",
  input: "h-11 sm:h-12 rounded-2xl border-border/40 bg-background text-sm font-semibold focus-visible:ring-primary/20",
  textarea: "rounded-2xl border-border/40 bg-background text-sm font-semibold focus-visible:ring-primary/20 resize-none",
  label: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70",
  h1: "text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-foreground",
  h2: "text-lg sm:text-xl font-black tracking-tight text-foreground",
  h3: "text-sm sm:text-base font-black tracking-tight text-foreground",
  hint: "text-xs sm:text-sm text-muted-foreground font-medium",
  tabButton: "h-11 sm:h-12 px-4 sm:px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.14em]",
};

export function CfH1({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn(cfStyles.h1, className)}>{children}</h1>;
}

export function CfH2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn(cfStyles.h2, className)}>{children}</h2>;
}

export function CfH3({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn(cfStyles.h3, className)}>{children}</h3>;
}

export function CfSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn(cfStyles.card, "p-4 sm:p-6 lg:p-8", className)}>{children}</section>;
}

export function CfStepIndicator({
  steps,
  current,
  className,
}: {
  steps: readonly string[];
  current: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 sm:w-10 transition-colors duration-300",
                  done ? "bg-primary" : "bg-border/40"
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300",
                  done
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : active
                      ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                      : "bg-secondary/40 text-muted-foreground/40"
                )}
              >
                {done ? "\u2713" : i + 1}
              </div>
              <span
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.15em] transition-colors hidden sm:block",
                  done || active ? "text-primary" : "text-muted-foreground/30"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CfButtonMd({
  children,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-11 sm:h-12 px-5 sm:px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.14em] transition-all active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
