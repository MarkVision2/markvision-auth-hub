import { createContext, useContext, useState, ReactNode } from "react";
import { ROLE_PRESETS, ALL_KEYS, loadTeam } from "@/pages/settings/types";

export type AppRole = "superadmin" | "client_admin" | "client_manager" | "doctor";

interface RoleContextValue {
  role: AppRole;
  setRole: (r: AppRole) => void;
  isSuperadmin: boolean;
  isClientAdmin: boolean;
  isClientManager: boolean;
  isDoctor: boolean;
  permissions: string[];
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>("superadmin");

  const permissions = role === "superadmin"
    ? [...ALL_KEYS]
    : loadTeam().find(m => m.role === role)?.permissions || ROLE_PRESETS[role as keyof typeof ROLE_PRESETS] || [];

  const value = {
    role,
    setRole,
    isSuperadmin: role === "superadmin",
    isClientAdmin: role === "client_admin",
    isClientManager: role === "client_manager",
    isDoctor: role === "doctor",
    permissions,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be inside RoleProvider");
  return ctx;
}
