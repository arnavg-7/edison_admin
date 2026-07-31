"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "./roles";

// Stands in for real authentication. Once SSO/IAM lands, the provider should
// read the signed-in user's role instead of localStorage and the RoleSwitcher
// should be removed.
const STORAGE_KEY = "edison-admin-role";
const DEFAULT_ROLE: Role = "portal_admin";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(DEFAULT_ROLE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored) {
      setRoleState(stored);
    }
  }, []);

  const setRole = (next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
