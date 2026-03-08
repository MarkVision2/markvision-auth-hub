import { Shield, User, Bug } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useRole } from "@/hooks/useRole";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function DevRoleToggle() {
  const { role, setRole, isSuperadmin } = useRole();
  const { active, setActiveId } = useWorkspace();

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setRole("superadmin");
      setActiveId("hq");
    } else {
      setRole("client");
      setActiveId("clinic-aiva");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm">
        <Bug className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <User className={`h-3.5 w-3.5 ${!isSuperadmin ? "text-foreground" : "text-muted-foreground/40"}`} />
          <span className={`text-[11px] font-medium ${!isSuperadmin ? "text-foreground" : "text-muted-foreground/40"}`}>
            Client
          </span>
          <Switch
            checked={isSuperadmin}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-primary"
          />
          <Shield className={`h-3.5 w-3.5 ${isSuperadmin ? "text-primary" : "text-muted-foreground/40"}`} />
          <span className={`text-[11px] font-medium ${isSuperadmin ? "text-primary" : "text-muted-foreground/40"}`}>
            Superadmin
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 ml-1">DEV</span>
      </div>
    </div>
  );
}
