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

export const HQ_ID = "7e175bca-c8bd-49de-b348-4acc348e5a91";
// HQ is the default workspace for MarkVision AI
const HQ: Workspace = { id: HQ_ID, name: "MarkVision AI", type: "agency" };

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
  const [activeId, setActiveId] = useState(() => {
    const saved = localStorage.getItem("activeProjectId");
    // Migrate old virtual "hq" id to real DB id
    if (saved === "hq") return HQ_ID;
    return saved || HQ_ID;
  });
  const [projects, setProjects] = useState<Workspace[]>(loadCachedProjects);

  const refreshProjects = useCallback(async () => {
    try {
      // 1. Fetch from projects table (primary source)
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      // 2. Fetch from clients_config as fallback/merging
      const { data: clientsData, error: clientsError } = await (supabase as any)
        .from("clients_config")
        .select("id, client_name, project_id")
        .eq("is_active", true);

      if (projectsError && clientsError) {
        console.warn("WorkspaceProvider: both fetches failed", projectsError, clientsError);
        return;
      }

      const foundIds = new Set<string>();
      const combined: Workspace[] = [];

      // Add actual projects
      if (projectsData && Array.isArray(projectsData)) {
        (projectsData as any[]).forEach(p => {
          if (!p.id || p.id === HQ_ID || foundIds.has(p.id)) return;
          foundIds.add(p.id);
          combined.push({
            id: p.id,
            name: p.name || "Unnamed Project",
            type: "client"
          });
        });
      }

      // Add clients that might not be in the projects list (due to RLS or missing rows)
      if (clientsData && Array.isArray(clientsData)) {
        (clientsData as any[]).forEach((c: any) => {
          const id = c.project_id || c.id;
          if (!id || id === HQ_ID || foundIds.has(id)) return;
          foundIds.add(id);
          combined.push({
            id: id,
            name: c.client_name || "Unnamed Client",
            type: "client"
          });
        });
      }

      const sorted = combined.sort((a, b) => a.name.localeCompare(b.name));
      setProjects(sorted);
      localStorage.setItem("cachedWorkspaceProjects", JSON.stringify(sorted));
    } catch (err) {
      console.error("WorkspaceProvider: unexpected error:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      await refreshProjects();
      // cancelled check prevents state updates after unmount via refreshProjects' setProjects
      // but since refreshProjects uses setState, React handles unmounted updates gracefully
    };
    run();
    return () => { cancelled = true; };
  }, [user, refreshProjects]);

  useEffect(() => {
    localStorage.setItem("activeProjectId", activeId);
  }, [activeId]);

  const createProject = useCallback(async (name: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("projects")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      // Add project creator to project_members
      if (user && data) {
        const { error: memberError } = await (supabase as any)
          .from("project_members")
          .insert({
            project_id: (data as any).id,
            user_id: user.id
          });

        if (memberError) {
          console.error("Failed to add project member:", memberError);
        }
      }

      await refreshProjects();
      if (data && (data as any).id) {
        setActiveId((data as any).id);
        return (data as any).id;
      }
      return null;
    } catch (err: unknown) {
      console.error("Failed to create project:", err);
      return null;
    }
  }, [user, refreshProjects]);

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
