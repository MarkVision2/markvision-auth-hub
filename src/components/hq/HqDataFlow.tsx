import { Globe, Cpu, Wallet } from "lucide-react";

export default function HqDataFlow() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Движение данных в реальном времени</h3>
      <p className="text-[10px] text-muted-foreground mb-6">Кровеносная система платформы</p>

      <div className="flex items-center justify-center gap-0">
        {/* Node: Meta Ads */}
        <FlowNode
          icon={<Globe className="h-5 w-5 text-[#1877F2]" />}
          label="Meta Ads"
          sub="12 кампаний"
          borderColor="border-[#1877F2]/20"
          glowColor="shadow-[0_0_20px_rgba(24,119,242,0.1)]"
        />

        {/* Connection 1 */}
        <FlowConnection color="from-[#1877F2]/40 to-primary/40" particleColor="bg-[#1877F2]" />

        {/* Node: MarkVision AI Core */}
        <FlowNode
          icon={<Cpu className="h-5 w-5 text-[hsl(var(--status-ai))]" />}
          label="MarkVision AI"
          sub="342 операции"
          borderColor="border-[hsl(var(--status-ai))]/20"
          glowColor="shadow-[0_0_24px_hsl(var(--status-ai)/0.12)]"
          isCore
        />

        {/* Connection 2 */}
        <FlowConnection color="from-primary/40 to-primary/40" particleColor="bg-primary" />

        {/* Node: CRM / Kassa */}
        <FlowNode
          icon={<Wallet className="h-5 w-5 text-primary" />}
          label="CRM / Касса"
          sub="4.2M ₸ MRR"
          borderColor="border-primary/20"
          glowColor="shadow-[0_0_20px_hsl(160_84%_39%/0.1)]"
        />
      </div>
    </div>
  );
}

function FlowNode({
  icon, label, sub, borderColor, glowColor, isCore
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  borderColor: string;
  glowColor: string;
  isCore?: boolean;
}) {
  return (
    <div className={`relative flex flex-col items-center gap-2 shrink-0 ${isCore ? "z-10" : ""}`}>
      <div className={`h-16 w-16 rounded-2xl border ${borderColor} bg-white/[0.03] backdrop-blur-xl flex items-center justify-center ${glowColor} ${isCore ? "h-20 w-20 rounded-2xl" : ""}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-foreground whitespace-nowrap">{label}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{sub}</p>
    </div>
  );
}

function FlowConnection({ color, particleColor }: { color: string; particleColor: string }) {
  return (
    <div className="relative w-28 h-px mx-1 flex-shrink-0">
      {/* Line */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-full`} />
      {/* Particles */}
      <div className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${particleColor} opacity-80 shadow-[0_0_8px_currentColor] animate-flow-1`} />
      <div className={`absolute top-1/2 -translate-y-1/2 h-1 w-1 rounded-full ${particleColor} opacity-60 shadow-[0_0_6px_currentColor] animate-flow-2`} />
      <div className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${particleColor} opacity-70 shadow-[0_0_8px_currentColor] animate-flow-3`} />
    </div>
  );
}
