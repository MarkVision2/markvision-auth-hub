import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRole } from "./useRole";

export interface Workspace {
  id: string;
  name: string;
  type: "agency" | "client";
  /** Maps to clients_config.client_name for client workspaces */
  clientName?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  logoUrl?: string;
}

// In the new 'Clean Slate' architecture, there is no hardcoded HQ.
// The first project in the database becomes the primary workspace.

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
  active: Workspace | null;
  setActiveId: (id: string) => void;
  createProject: (name: string) => Promise<string | null>;
  refreshProjects: () => Promise<void>;
  isAgency: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, isSuperadmin } = useRole();
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem("activeProjectId") || "";
  });
  const [projects, setProjects] = useState<Workspace[]>(loadCachedProjects);

  const refreshProjects = useCallback(async () => {
    try {
      if (!user) return;

      console.log("Workspace Debug: Fetching for user", user.id, "Role:", role, "isSuperadmin:", isSuperadmin);

      // 1. Fetch from projects table (primary source)
      let query = supabase
        .from("projects")
        .select("id, name, logo_url, currency, timezone, language, created_at")
        .order("created_at", { ascending: true }); // First created is 'Main'

      if (!isSuperadmin) {
        console.log("Workspace Debug: User is NOT superadmin, filtering by membership");
        const { data: memberProjects, error: memberError } = await (supabase as any)
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id);
        
        if (memberError) {
          console.error("Workspace Debug: Membership fetch error:", memberError);
          throw memberError;
        }
        
        const projectIds = (memberProjects as any[])?.map(mp => mp.project_id) || [];
        console.log("Workspace Debug: Found member project IDs:", projectIds);
        query = query.in("id", projectIds);
      }

      const { data: projectsData, error: projectsError } = await query;
      if (projectsError) {
        console.error("Workspace Debug: Projects fetch error:", projectsError);
        throw projectsError;
      }

      console.log("Workspace Debug: Found actual projects from DB:", projectsData?.length, projectsData);

      const foundIds = new Set<string>();
      const combined: Workspace[] = [];

      // Add actual projects
      if (projectsData && Array.isArray(projectsData)) {
        (projectsData as any[]).forEach((p, index) => {
          if (!p.id || foundIds.has(p.id)) return;
          foundIds.add(p.id);
          combined.push({
            id: p.id,
            name: p.name || "Unnamed Project",
            // The very first project is treated as 'agency' (Main), others are clients
            type: index === 0 ? "agency" : "client",
            logoUrl: p.logo_url,
            currency: p.currency,
            timezone: p.timezone,
            language: p.language
          });
        });
      }

      setProjects(combined);
      localStorage.setItem("cachedWorkspaceProjects", JSON.stringify(combined));
    } catch (err) {
      console.error("WorkspaceProvider: unexpected error:", err);
    }
  }, [user, isSuperadmin]);

  useEffect(() => {
    if (!user) return;
    refreshProjects();
  }, [user, isSuperadmin, refreshProjects]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem("activeProjectId", activeId);
    }
  }, [activeId]);

  const createProject = useCallback(async (name: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("projects")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      if (user && data) {
        await (supabase as any)
          .from("project_members")
          .insert({
            project_id: (data as any).id,
            user_id: user.id
          });
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

  const workspaces = useMemo(() => projects, [projects]);

  const active = useMemo(() => {
    if (workspaces.length === 0) return null;
    const found = workspaces.find(w => w.id === activeId);
    return found || workspaces[0];
  }, [workspaces, activeId]);

  const contextValue = useMemo(() => ({
    workspaces,
    active,
    setActiveId,
    createProject,
    refreshProjects,
    isAgency: !!active && active.type === "agency",
  }), [workspaces, active, createProject, refreshProjects]);

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
