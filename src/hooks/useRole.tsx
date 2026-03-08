import { createContext, useContext, useState, ReactNode } from "react";

export type AppRole = "superadmin" | "client";

interface RoleContextValue {
  role: AppRole;
  setRole: (r: AppRole) => void;
  isSuperadmin: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>("superadmin");
  return (
    <RoleContext.Provider value={{ role, setRole, isSuperadmin: role === "superadmin" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be inside RoleProvider");
  return ctx;
}
