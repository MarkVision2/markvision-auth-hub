import { Globe, Cpu, Wallet } from "lucide-react";

export default function HqDataFlow() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground mb-1">Движение данных в реальном времени</h3>
      <p className="text-[10px] text-muted-foreground mb-6">Кровеносная система платформы</p>

      <div className="flex items-center justify-center gap-0">
        <FlowNode
          icon={<Globe className="h-5 w-5 text-[#1877F2]" />}
          label="Meta Ads"
          sub="12 кампаний"
          borderColor="border-[#1877F2]/20"
        />

        <FlowConnection particleColor="bg-[#1877F2]" />

        <FlowNode
          icon={<Cpu className="h-5 w-5 text-[hsl(var(--status-ai))]" />}
          label="MarkVision AI"
          sub="342 операции"
          borderColor="border-[hsl(var(--status-ai))]/20"
          isCore
        />

        <FlowConnection particleColor="bg-primary" />

        <FlowNode
          icon={<Wallet className="h-5 w-5 text-primary" />}
          label="CRM / Касса"
          sub="4.2M ₸ MRR"
          borderColor="border-primary/20"
        />
      </div>
    </div>
  );
}

function FlowNode({
  icon, label, sub, borderColor, isCore
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  borderColor: string;
  isCore?: boolean;
}) {
  return (
    <div className={`relative flex flex-col items-center gap-2 shrink-0 ${isCore ? "z-10" : ""}`}>
      <div className={`${isCore ? "h-20 w-20" : "h-16 w-16"} rounded-2xl border ${borderColor} bg-card flex items-center justify-center`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-foreground whitespace-nowrap">{label}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{sub}</p>
    </div>
  );
}

function FlowConnection({ particleColor }: { particleColor: string }) {
  return (
    <div className="relative w-28 h-px mx-1 flex-shrink-0">
      <div className="absolute inset-0 bg-border rounded-full" />
      <div className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${particleColor} opacity-80 animate-flow-1`} />
      <div className={`absolute top-1/2 -translate-y-1/2 h-1 w-1 rounded-full ${particleColor} opacity-60 animate-flow-2`} />
      <div className={`absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${particleColor} opacity-70 animate-flow-3`} />
    </div>
  );
}
