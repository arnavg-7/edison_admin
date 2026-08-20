"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedRoleAccess, type RoleAccessMap } from "@/lib/data/roleAccess";
import { ADMIN_ROLE_ORDER, LOCKED_ROLE, type AdminRole } from "@/lib/data/adminUsers";
import { SECTIONS, type SectionId } from "@/lib/nav";

/**
 * Which sections each role holds, as the district has configured them.
 *
 * Same shape as the other admin-owned stores: seeded, edited on screen, held in
 * localStorage until the Admin DB role contract exists. What is different is the
 * reach — every nav, route gate and access banner in the portal reads this, so a
 * tick here changes what a signed-in account can see on the next render.
 *
 * Super Admin is not stored. It is every section by definition, and reading it
 * from a map means a corrupt or half-written map could lock the portal.
 */

const STORAGE_KEY = "edison-admin.role-access.v1";

function readStorage(): RoleAccessMap {
  if (typeof window === "undefined") return seedRoleAccess;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedRoleAccess;

    const stored = JSON.parse(raw) as Partial<Record<AdminRole, unknown>>;
    const known = new Set<string>(SECTIONS.map((section) => section.id));

    /* Rebuilt role by role rather than trusted wholesale: a role added to the
       codebase since this was written has no stored row and takes its seed, and
       a section id that no longer exists is dropped rather than kept as a tick
       against nothing. */
    return ADMIN_ROLE_ORDER.reduce((map, role) => {
      const value = stored?.[role];
      map[role] = Array.isArray(value)
        ? (value.filter((id): id is SectionId => typeof id === "string" && known.has(id)))
        : seedRoleAccess[role];
      return map;
    }, {} as RoleAccessMap);
  } catch {
    return seedRoleAccess;
  }
}

type RoleAccessValue = {
  access: RoleAccessMap;
  /** Ticks or unticks one section for one role. Ignored for Super Admin. */
  toggleSection: (role: AdminRole, section: SectionId) => void;
  /** Puts one role back to the seed it shipped with. */
  resetRole: (role: AdminRole) => void;
  /** True where the stored row differs from the seed. */
  isEdited: (role: AdminRole) => boolean;
  isLoaded: boolean;
};

const RoleAccessContext = createContext<RoleAccessValue | null>(null);

export function RoleAccessProvider({ children }: { children: React.ReactNode }) {
  // Seed on the server and on the first client render so hydration matches.
  const [access, setAccess] = useState<RoleAccessMap>(seedRoleAccess);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAccess(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [access, isLoaded]);

  const toggleSection = useCallback((role: AdminRole, section: SectionId) => {
    if (role === LOCKED_ROLE) return;

    setAccess((current) => {
      const held = current[role] ?? [];
      const next = held.includes(section)
        ? held.filter((entry) => entry !== section)
        : [...held, section];
      return { ...current, [role]: next };
    });
  }, []);

  const resetRole = useCallback((role: AdminRole) => {
    setAccess((current) => ({ ...current, [role]: seedRoleAccess[role] }));
  }, []);

  const value = useMemo<RoleAccessValue>(
    () => ({
      access,
      toggleSection,
      resetRole,
      isEdited: (role) =>
        JSON.stringify([...(access[role] ?? [])].sort()) !==
        JSON.stringify([...seedRoleAccess[role]].sort()),
      isLoaded
    }),
    [access, isLoaded, resetRole, toggleSection]
  );

  return <RoleAccessContext.Provider value={value}>{children}</RoleAccessContext.Provider>;
}

export function useRoleAccess(): RoleAccessValue {
  const context = useContext(RoleAccessContext);
  if (!context) {
    throw new Error("useRoleAccess must be used inside <RoleAccessProvider>");
  }
  return context;
}
