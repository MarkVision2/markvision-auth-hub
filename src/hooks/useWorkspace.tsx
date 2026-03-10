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
  createProject: (name: string) => Promise<string | null>;
  isAgency: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(() => localStorage.getItem("activeProjectId") || "hq");
  const [projects, setProjects] = useState<Workspace[]>([]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) throw error;

      if (data) {
        setProjects(data.map(p => ({
          id: p.id,
          name: p.name,
          emoji: "🦷",
          type: "client" as const,
        })));
      }
    } catch (err) {
      console.error("WorkspaceProvider: failed to fetch projects", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeProjectId", activeId);
  }, [activeId]);

  const createProject = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      await fetchProjects();
      if (data) {
        setActiveId(data.id);
        return data.id;
      }
      return null;
    } catch (err: any) {
      console.error("Failed to create project:", err);
      return null;
    }
  };

  const workspaces = [HQ, ...projects];
  const active = workspaces.find(w => w.id === activeId) || HQ;

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      active,
      setActiveId,
      createProject,
      isAgency: active.type === "agency"
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}
