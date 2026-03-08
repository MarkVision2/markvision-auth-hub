import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
  type: "agency" | "client";
  /** Maps to clients_config.client_name for client workspaces */
  clientName?: string;
}

const HQ: Workspace = { id: "hq", name: "MarkVision HQ", emoji: "🏢", type: "agency" };

interface WorkspaceContextValue {
  workspaces: Workspace[];
  active: Workspace;
  setActiveId: (id: string) => void;
  isAgency: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState("hq");
  const [clientWorkspaces, setClientWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from("clients_config")
        .select("id, client_name")
        .eq("project_id", PROJECT_ID)
        .eq("is_active", true)
        .order("client_name");

      if (data) {
        setClientWorkspaces(data.map(c => ({
          id: c.id,
          name: c.client_name,
          emoji: "🦷",
          type: "client" as const,
          clientName: c.client_name,
        })));
      }
    }
    fetchClients();
  }, []);

  const workspaces = [HQ, ...clientWorkspaces];
  const active = workspaces.find(w => w.id === activeId) || HQ;

  return (
    <WorkspaceContext.Provider value={{ workspaces, active, setActiveId, isAgency: active.type === "agency" }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}
