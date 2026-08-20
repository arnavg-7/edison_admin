"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { schools, type School } from "@/lib/data/schools";
import { useMounted } from "@/lib/use-mounted";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useRoleAccess } from "@/lib/role-access-store";
import { seedRoleAccess, sectionsForRoles } from "@/lib/data/roleAccess";
import {
  ADMIN_ROLE_LABELS,
  adminUsers as seededAdminUsers,
  type AdminRole,
  type AdminUser
} from "@/lib/data/adminUsers";
import type { SectionId } from "@/lib/nav";

/**
 * Who is signed in, and what that makes the portal.
 *
 * Everything the shell needs comes off one admin account: the roles it holds
 * decide which sections exist, its scope decides how much of the district those
 * sections show, and its permission level decides whether they are read-only.
 * Not one of those is a setting on this screen — they are configured in User
 * Management, on the account and on the roles it holds, which is the point:
 * what an admin sees here is what somebody granted them there.
 *
 * Scope is still its own idea rather than a rank. A Super Admin at one school
 * and a Super Admin across the district do the same job on different data.
 *
 * TODO: the signed-in account comes from the session with real auth. The
 * switcher exists so every configured view can be demonstrated from one
 * session, and is the piece to delete when that lands.
 */

export type AdminScope = { kind: "district" } | { kind: "school"; schoolId: string };

const SIGNED_IN_KEY = "edison-admin.signed-in.v1";

/** The seeded district Super Admin: the portal has to open as somebody. */
const DEFAULT_USER_ID = seededAdminUsers[0]?.id ?? "";

const DISTRICT: AdminScope = { kind: "district" };

function readSignedIn(): string {
  if (typeof window === "undefined") return DEFAULT_USER_ID;
  try {
    return window.localStorage.getItem(SIGNED_IN_KEY) || DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

type AdminScopeValue = {
  /** The signed-in account, or null while one is being resolved. */
  user: AdminUser | null;
  signInAs: (userId: string) => void;
  /** Roles held, and the sections they add up to. */
  roles: AdminRole[];
  sections: SectionId[];
  /** True when at least one role held carries edit rather than view. */
  canEdit: boolean;
  scope: AdminScope;
  /** The school being administered, or null for the whole district. */
  school: School | null;
  /** Convenience for the common case: `null` means every school. */
  schoolId: string | null;
  isDistrict: boolean;
  /** What the sidebar shows under the product name. */
  roleLabel: string;
};

const AdminScopeContext = createContext<AdminScopeValue | null>(null);

/** "Super Admin", or "Leadership + Portal Administrator" for a joint account. */
function rolesLabel(roles: AdminRole[]): string {
  if (roles.length === 0) return "No role assigned";
  return roles.map((role) => ADMIN_ROLE_LABELS[role]).join(" + ");
}

export function AdminScopeProvider({ children }: { children: React.ReactNode }) {
  const { adminUsers } = useAdminUsers();
  const { access } = useRoleAccess();
  const [signedInId, setSignedInId] = useState<string>(DEFAULT_USER_ID);

  // Storage is read after mount, never during render — see use-mounted.
  useEffect(() => {
    setSignedInId(readSignedIn());
  }, []);

  const signInAs = useCallback((userId: string) => {
    setSignedInId(userId);
    try {
      window.localStorage.setItem(SIGNED_IN_KEY, userId);
    } catch {
      // A blocked or full localStorage shouldn't stop the switch taking effect
      // for this session.
    }
  }, []);

  const value = useMemo<AdminScopeValue>(() => {
    /* An account that was deleted, revoked or never existed falls back to the
       default rather than leaving somebody signed in as nobody, with an empty
       nav and no control on the page able to explain why. */
    const user =
      adminUsers.find((entry) => entry.id === signedInId) ??
      adminUsers.find((entry) => entry.id === DEFAULT_USER_ID) ??
      adminUsers[0] ??
      null;

    const roles = user?.roles.map((assignment) => assignment.role) ?? [];
    const scope: AdminScope =
      user?.scope.type === "school" ? { kind: "school", schoolId: user.scope.schoolId } : DISTRICT;
    const school =
      scope.kind === "school"
        ? (schools.find((entry) => entry.id === scope.schoolId) ?? null)
        : null;

    return {
      user,
      signInAs,
      roles,
      sections: sectionsForRoles(access, roles),
      canEdit: user?.roles.some((assignment) => assignment.permission === "edit") ?? false,
      scope,
      school,
      schoolId: school?.id ?? null,
      isDistrict: school === null,
      roleLabel: rolesLabel(roles)
    };
  }, [access, adminUsers, signInAs, signedInId]);

  return <AdminScopeContext.Provider value={value}>{children}</AdminScopeContext.Provider>;
}

/**
 * The current session.
 *
 * Reads as the default district Super Admin until the component has mounted,
 * matching what the server rendered: the provider sits in the root layout and
 * can commit its stored account before a page hydrates, and a page that read the
 * stored one straight away would be rendering different markup from the HTML it
 * is hydrating into.
 */
export function useAdminScope(): AdminScopeValue {
  const context = useContext(AdminScopeContext);
  const mounted = useMounted();

  if (!context) {
    throw new Error("useAdminScope must be used inside AdminScopeProvider");
  }

  if (!mounted) {
    const seeded = seededAdminUsers.find((entry) => entry.id === DEFAULT_USER_ID) ?? null;
    const roles = seeded?.roles.map((assignment) => assignment.role) ?? [];
    return {
      ...context,
      user: seeded,
      roles,
      sections: sectionsForRoles(seedRoleAccess, roles),
      canEdit: true,
      scope: DISTRICT,
      school: null,
      schoolId: null,
      isDistrict: true,
      roleLabel: rolesLabel(roles)
    };
  }

  return context;
}
