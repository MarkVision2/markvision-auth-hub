import { createContext, useContext, useState, ReactNode } from "react";

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
  type: "agency" | "client";
}

const WORKSPACES: Workspace[] = [
  { id: "hq", name: "MarkVision HQ", emoji: "🏢", type: "agency" },
  { id: "clinic-aiva", name: "Клиника AIVA", emoji: "🏥", type: "client" },
  { id: "kitarov", name: "Kitarov Clinic", emoji: "🦷", type: "client" },
  { id: "spine-tech", name: "Технология позвоночника", emoji: "✨", type: "client" },
];

interface WorkspaceContextValue {
  workspaces: Workspace[];
  active: Workspace;
  setActiveId: (id: string) => void;
  isAgency: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState("hq");
  const active = WORKSPACES.find(w => w.id === activeId) || WORKSPACES[0];

  return (
    <WorkspaceContext.Provider value={{ workspaces: WORKSPACES, active, setActiveId, isAgency: active.type === "agency" }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}
