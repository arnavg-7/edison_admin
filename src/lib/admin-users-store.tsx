"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_ROLE_ORDER,
  adminUsers as seededAdminUsers,
  normalizeStatus,
  type AdminRole,
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

/* v2: accounts carry one role and no per-section grid. A v1 record could hold
   two roles and its own grid, and there is no honest way to collapse that into
   one role — so the key moves and a stored v1 list is left where it is rather
   than half-converted. */
const STORAGE_KEY = "edison-admin.admin-users.v2";
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

    return {
      /* Normalised on the way in so a record written by an older build cannot
         put the screen into a state no control can explain: an unknown status
         reads as Invited, and an unknown role as School Admin, which is the
         narrower of the two. */
      adminUsers: users.map((user) => ({
        ...user,
        status: normalizeStatus(user.status),
        role: ADMIN_ROLE_ORDER.includes(user.role) ? user.role : ("school_admin" as AdminRole),
        inviteSentAt: user.inviteSentAt ?? null,
        inviteSends: typeof user.inviteSends === "number" ? user.inviteSends : 1
      })),
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
  /** Sends (or re-sends) the invitation and stamps it. */
  sendInvite: (id: string) => void;
  /** Withdraws access. The record and its history are kept. */
  disableUser: (id: string) => void;
  /** Restores access. An account that never accepted goes back to Invited. */
  enableUser: (id: string) => void;
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

  /* Each of these is one act with one meaning, kept here rather than assembled
     from updateUser at three call sites — where the third would be the one that
     forgot to stamp the send. */
  const sendInvite = useCallback(
    (id: string) => {
      updateUser(id, {
        status: "Invited",
        inviteSentAt: new Date().toISOString()
      });
      // Counted separately: the patch above cannot read the current value.
      setState((current) => ({
        ...current,
        adminUsers: current.adminUsers.map((user) =>
          user.id === id ? { ...user, inviteSends: user.inviteSends + 1 } : user
        )
      }));
    },
    [updateUser]
  );

  const disableUser = useCallback(
    (id: string) => updateUser(id, { status: "Disabled" }),
    [updateUser]
  );

  /* Back to whichever state they were in before: someone who had signed in is
     Active again, and someone who never accepted is still waiting. */
  const enableUser = useCallback(
    (id: string) =>
      setState((current) => ({
        ...current,
        adminUsers: current.adminUsers.map((user) =>
          user.id === id
            ? { ...user, status: user.lastLogin ? "Active" : "Invited" }
            : user
        )
      })),
    []
  );

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
      sendInvite,
      disableUser,
      enableUser,
      isLoaded
    }),
    [
      state.adminUsers,
      state.require2fa,
      setRequire2fa,
      addUser,
      addUsers,
      updateUser,
      updateUsers,
      removeUser,
      sendInvite,
      disableUser,
      enableUser,
      isLoaded
    ]
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
