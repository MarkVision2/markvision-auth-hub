import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  icon?: React.ReactNode;
  label?: string;
  secondaryLabel?: string;
  headerRight?: React.ReactNode;
}

export function PremiumCard({ 
  children, 
  className, 
  glowColor = "bg-primary/10",
  icon,
  label,
  secondaryLabel,
  headerRight
}: PremiumCardProps) {
  return (
    <div className={cn(
      "relative group overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0b10]/40 backdrop-blur-3xl p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
      className
    )}>
      {/* Premium Glow Effect */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
        glowColor
      )} />

      <div className="relative z-10 flex flex-col h-full">
        {(icon || label) && (
          <div className="flex items-center gap-3.5 mb-5 shrink-0">
            {icon && (
              <div className="h-11 w-11 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                <div className="text-primary/70 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                  {icon}
                </div>
              </div>
            )}
            <div>
              {label && <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">{label}</h3>}
              {secondaryLabel && <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest mt-0.5">{secondaryLabel}</p>}
            </div>
            {headerRight && <div className="ml-auto">{headerRight}</div>}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
