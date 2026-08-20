"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_ROLE_ORDER,
  ROLE_PRESETS,
  fullAccess,
  normalizeAccess,
  type AdminRole,
  type SectionAccessMap,
  type SectionLevel
} from "@/lib/data/adminUsers";
import type { SectionId } from "@/lib/nav";

/**
 * What each role grants, as the district has configured it.
 *
 * ROLE_PRESETS is the seed; this is the live version, and it is what an
 * invitation fills an account's grid from. Changing a role here does not reach
 * back into accounts already granted it — their grid was saved when access was
 * given, and silently rewriting it would change what people can do without
 * anyone deciding to. The screen says so, and offers the roles' holders as a
 * count so the size of the "does not reach back" is visible.
 *
 * Seeded, edited on screen, held in localStorage until the Admin DB role
 * contract exists — the same shape as the other admin-owned stores.
 */

const STORAGE_KEY = "edison-admin.role-config.v1";

function seededConfig(): Record<AdminRole, SectionAccessMap> {
  return ADMIN_ROLE_ORDER.reduce(
    (map, role) => {
      map[role] = fullAccess(ROLE_PRESETS[role].access);
      return map;
    },
    {} as Record<AdminRole, SectionAccessMap>
  );
}

function readStorage(): Record<AdminRole, SectionAccessMap> {
  const seed = seededConfig();
  if (typeof window === "undefined") return seed;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;

    const stored = JSON.parse(raw) as Partial<Record<AdminRole, unknown>>;

    /* Rebuilt role by role rather than trusted wholesale: a role added to the
       codebase since this was written has no stored row and takes its seed, and
       normalizeAccess drops any section that no longer exists. */
    return ADMIN_ROLE_ORDER.reduce(
      (map, role) => {
        const value = stored?.[role];
        map[role] = value ? fullAccess(normalizeAccess(value)) : seed[role];
        return map;
      },
      {} as Record<AdminRole, SectionAccessMap>
    );
  } catch {
    return seed;
  }
}

type RoleConfigValue = {
  config: Record<AdminRole, SectionAccessMap>;
  setLevel: (role: AdminRole, section: SectionId, level: SectionLevel) => void;
  /** Puts one role back to the preset it shipped with. */
  resetRole: (role: AdminRole) => void;
  isEdited: (role: AdminRole) => boolean;
  isLoaded: boolean;
};

const RoleConfigContext = createContext<RoleConfigValue | null>(null);

export function RoleConfigProvider({ children }: { children: React.ReactNode }) {
  // Seed on the server and on the first client render so hydration matches.
  const [config, setConfig] = useState<Record<AdminRole, SectionAccessMap>>(seededConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfig(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [config, isLoaded]);

  const setLevel = useCallback((role: AdminRole, section: SectionId, level: SectionLevel) => {
    setConfig((current) => ({ ...current, [role]: { ...current[role], [section]: level } }));
  }, []);

  const resetRole = useCallback((role: AdminRole) => {
    setConfig((current) => ({ ...current, [role]: fullAccess(ROLE_PRESETS[role].access) }));
  }, []);

  const value = useMemo<RoleConfigValue>(() => {
    const seed = seededConfig();
    return {
      config,
      setLevel,
      resetRole,
      isEdited: (role) => JSON.stringify(config[role]) !== JSON.stringify(seed[role]),
      isLoaded
    };
  }, [config, isLoaded, resetRole, setLevel]);

  return <RoleConfigContext.Provider value={value}>{children}</RoleConfigContext.Provider>;
}

export function useRoleConfig(): RoleConfigValue {
  const context = useContext(RoleConfigContext);
  if (!context) {
    throw new Error("useRoleConfig must be used inside <RoleConfigProvider>");
  }
  return context;
}

/** The grid a set of roles starts an account with, under the live config. */
export function configuredAccess(
  config: Record<AdminRole, SectionAccessMap>,
  roles: AdminRole[]
): SectionAccessMap {
  const rank: Record<SectionLevel, number> = { none: 0, view: 1, edit: 2 };

  return roles.reduce<SectionAccessMap>((map, role) => {
    for (const [section, level] of Object.entries(config[role] ?? {})) {
      if (rank[level] > rank[map[section] ?? "none"]) map[section] = level;
    }
    return map;
  }, {});
}
