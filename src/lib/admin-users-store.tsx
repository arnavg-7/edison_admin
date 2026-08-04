"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  adminUsers as seededAdminUsers,
  normalizeRoleAssignments,
  type AdminUser
} from "@/lib/data/adminUsers";

/**
 * Admin-account store, separate from `users-store` (the Genesis-synced
 * student/faculty directory). Every record here is created manually on the
 * User Management screen, so — unlike students/faculty — there's no seed vs.
 * overlay split: the whole list is admin-owned, so the whole list just lives
 * in localStorage, seeded from `adminUsers` on first load.
 *
 * TODO: swap for API calls once the Admin DB contract exists.
 */

const STORAGE_KEY = "edison-admin.admin-users.v1";
const REQUIRE_2FA_KEY = "edison-admin.admin-users.require-2fa.v1";

type PersistedState = {
  adminUsers: AdminUser[];
  require2fa: boolean;
};

function readStorage(): PersistedState {
  if (typeof window === "undefined") {
    return { adminUsers: seededAdminUsers, require2fa: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const users = raw ? (JSON.parse(raw) as AdminUser[]) : seededAdminUsers;
    const require2fa = window.localStorage.getItem(REQUIRE_2FA_KEY) === "true";
    if (!Array.isArray(users)) return { adminUsers: seededAdminUsers, require2fa };

    // Accounts stored before roles carried a permission level are upgraded on
    // read rather than dropped, so an existing session keeps its users.
    return {
      adminUsers: users.map((user) => ({ ...user, roles: normalizeRoleAssignments(user.roles) })),
      require2fa
    };
  } catch {
    // Corrupt or unavailable storage shouldn't take the page down — start clean.
    return { adminUsers: seededAdminUsers, require2fa: false };
  }
}

type AdminUsersContextValue = {
  adminUsers: AdminUser[];
  require2fa: boolean;
  setRequire2fa: (value: boolean) => void;
  addUser: (user: AdminUser) => void;
  addUsers: (users: AdminUser[]) => void;
  updateUser: (id: string, patch: Partial<AdminUser>) => void;
  updateUsers: (ids: string[], patch: Partial<AdminUser>) => void;
  removeUser: (id: string) => void;
  /** False until localStorage has been read, so the UI can avoid a false empty state. */
  isLoaded: boolean;
};

const AdminUsersContext = createContext<AdminUsersContextValue | null>(null);

export function AdminUsersProvider({ children }: { children: React.ReactNode }) {
  // Starts with the seed on both server and first client render so hydration
  // matches; the effect below fills it in from storage immediately after mount.
  const [state, setState] = useState<PersistedState>({ adminUsers: seededAdminUsers, require2fa: false });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.adminUsers));
      window.localStorage.setItem(REQUIRE_2FA_KEY, String(state.require2fa));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [state, isLoaded]);

  const addUser = useCallback((user: AdminUser) => {
    setState((current) => ({ ...current, adminUsers: [user, ...current.adminUsers] }));
  }, []);

  const addUsers = useCallback((users: AdminUser[]) => {
    setState((current) => ({ ...current, adminUsers: [...users, ...current.adminUsers] }));
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<AdminUser>) => {
    setState((current) => ({
      ...current,
      adminUsers: current.adminUsers.map((user) => (user.id === id ? { ...user, ...patch } : user))
    }));
  }, []);

  const updateUsers = useCallback((ids: string[], patch: Partial<AdminUser>) => {
    const idSet = new Set(ids);
    setState((current) => ({
      ...current,
      adminUsers: current.adminUsers.map((user) => (idSet.has(user.id) ? { ...user, ...patch } : user))
    }));
  }, []);

  const removeUser = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      adminUsers: current.adminUsers.filter((user) => user.id !== id)
    }));
  }, []);

  const setRequire2fa = useCallback((value: boolean) => {
    setState((current) => ({ ...current, require2fa: value }));
  }, []);

  const value = useMemo(
    () => ({
      adminUsers: state.adminUsers,
      require2fa: state.require2fa,
      setRequire2fa,
      addUser,
      addUsers,
      updateUser,
      updateUsers,
      removeUser,
      isLoaded
    }),
    [state.adminUsers, state.require2fa, setRequire2fa, addUser, addUsers, updateUser, updateUsers, removeUser, isLoaded]
  );

  return <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>;
}

export function useAdminUsers(): AdminUsersContextValue {
  const context = useContext(AdminUsersContext);
  if (!context) {
    throw new Error("useAdminUsers must be used inside <AdminUsersProvider>");
  }
  return context;
}
