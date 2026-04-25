import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const cfStyles = {
  page: "mx-auto w-full max-w-[1920px] px-4 md:px-8 lg:px-12 py-6",
  grid: "grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8",
  card: "rounded-xl border border-border/60 bg-card shadow-sm",
  cardSoft: "rounded-xl border border-border/40 bg-secondary/10",
  input: "h-10 rounded-lg border-border/60 bg-background text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/30 shadow-sm transition-colors",
  textarea: "rounded-lg border-border/60 bg-background text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/30 resize-none shadow-sm transition-colors",
  label: "text-xs font-semibold text-foreground/80 tracking-tight",
  h1: "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
  h2: "text-lg sm:text-xl font-bold tracking-tight text-foreground",
  h3: "text-sm md:text-base font-semibold tracking-tight text-foreground",
  hint: "text-xs sm:text-sm text-muted-foreground",
  tabButton: "h-9 px-4 rounded-md text-sm font-medium transition-colors",
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
  return <section className={cn(cfStyles.card, "p-5 sm:p-6 lg:p-8", className)}>{children}</section>;
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
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-[2px] w-4 sm:w-8 transition-colors duration-300 rounded-full",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300",
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {done ? "\u2713" : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors hidden sm:block",
                  done || active ? "text-foreground" : "text-muted-foreground"
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
        "h-10 px-5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
