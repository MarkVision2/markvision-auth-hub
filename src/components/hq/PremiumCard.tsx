import React from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  label: string;
  secondaryLabel?: string;
  headerRight?: React.ReactNode;
  glowColor?: string; // Kept for interface compatibility but used subtly
}

export function PremiumCard({
  children,
  className,
  icon,
  label,
  secondaryLabel,
  headerRight,
}: PremiumCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/20",
      className
    )}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <div className="text-primary">
                {icon}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</h3>
            {secondaryLabel && (
              <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest mt-0.5">{secondaryLabel}</p>
            )}
          </div>
        </div>
        {headerRight && <div className="ml-auto">{headerRight}</div>}
      </div>

      <div className="relative">
        {children}
      </div>
    </div>
  );
}
