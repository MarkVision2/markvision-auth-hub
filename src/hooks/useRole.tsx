import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ROLE_PRESETS, ALL_KEYS } from "@/pages/settings/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "superadmin" | "client_admin" | "client_manager" | "doctor";

interface RoleContextValue {
  role: AppRole;
  setRole: (r: AppRole) => void;
  isSuperadmin: boolean;
  isClientAdmin: boolean;
  isClientManager: boolean;
  isDoctor: boolean;
  permissions: string[];
  loading: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("superadmin");
  const [permissions, setPermissions] = useState<string[]>([...ALL_KEYS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, permissions")
          .eq("id", user.id as any)
          .single();

        if (error) throw error;

        if (data) {
          const profile = data as any;
          const userRole = (profile.role as AppRole) || "client_manager";
          setRole(userRole);
          
          if (userRole === "superadmin") {
            setPermissions([...ALL_KEYS]);
          } else {
            setPermissions((profile.permissions as string[]) || ROLE_PRESETS[userRole] || []);
          }
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const value = {
    role,
    setRole,
    isSuperadmin: role === "superadmin",
    isClientAdmin: role === "client_admin",
    isClientManager: role === "client_manager",
    isDoctor: role === "doctor",
    permissions,
    loading,
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
