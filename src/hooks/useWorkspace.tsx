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

const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState("hq");
  const [clientWorkspaces, setClientWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from("clients_config")
          .select("id, client_name")
          .eq("project_id", PROJECT_ID)
          .eq("is_active", true)
          .order("client_name");

        if (error) throw error;

        if (data) {
          setClientWorkspaces(data.map(c => ({
            id: c.id,
            name: c.client_name,
            emoji: "🦷",
            type: "client" as const,
            clientName: c.client_name,
          })));
        }
      } catch (err) {
        console.error("WorkspaceProvider: failed to fetch clients", err);
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
