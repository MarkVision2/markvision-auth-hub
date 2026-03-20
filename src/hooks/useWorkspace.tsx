import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Workspace {
  id: string;
  name: string;
  type: "agency" | "client";
  /** Maps to clients_config.client_name for client workspaces */
  clientName?: string;
}

const HQ: Workspace = { id: "hq", name: "MarkVision AI", type: "agency" };

function loadCachedProjects(): Workspace[] {
  try {
    const cached = localStorage.getItem("cachedWorkspaceProjects");
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  active: Workspace;
  setActiveId: (id: string) => void;
  createProject: (name: string) => Promise<string | null>;
  isAgency: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(() => localStorage.getItem("activeProjectId") || "hq");
  const [projects, setProjects] = useState<Workspace[]>(loadCachedProjects);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) throw error;

      if (data) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          type: "client" as const,
        }));
        setProjects(mapped);
        localStorage.setItem("cachedWorkspaceProjects", JSON.stringify(mapped));
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

  const createProject = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      // Add project creator to project_members
      if (user) {
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: data.id,
            user_id: user.id
          });

        if (memberError) {
          console.error("Failed to add project member:", memberError);
        }
      }

      await fetchProjects();
      if (data) {
        setActiveId(data.id);
        return data.id;
      }
      return null;
    } catch (err: unknown) {
      console.error("Failed to create project:", err);
      return null;
    }
  }, [user]);

  const workspaces = useMemo(() => [HQ, ...projects], [projects]);
  const active = useMemo(() => workspaces.find(w => w.id === activeId) || HQ, [workspaces, activeId]);
  const contextValue = useMemo(() => ({
    workspaces,
    active,
    setActiveId,
    createProject,
    isAgency: active.type === "agency",
  }), [workspaces, active, createProject]);

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}
