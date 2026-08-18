"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedGoalTemplates, type GoalTemplate } from "@/lib/data/goalTemplates";
import { useMounted } from "@/lib/use-mounted";

/**
 * The district's goal templates.
 *
 * localStorage-backed, unlike goals themselves. Templates are admin-owned
 * configuration — the same category of thing as the school hierarchy or the POAG
 * scale, both of which persist — and they are edited on one screen and consumed on
 * another. An admin who adds a template in System Settings, opens Goals and finds
 * their template gone would reasonably conclude the save failed.
 *
 * A context rather than the module-level map goals use: module state is reset by
 * any full page load, so a template added in one tab was invisible in the next.
 *
 * TODO: swap for API calls once the Admin DB Academic Goals contract exists.
 */

const STORAGE_KEY = "edison-admin.goal-templates.v1";

function readStorage(): GoalTemplate[] {
  if (typeof window === "undefined") return seedGoalTemplates;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedGoalTemplates;

    const stored = JSON.parse(raw) as GoalTemplate[];
    /* An empty array is a real state — an admin may have deleted every template —
       so only a non-array is treated as corrupt. */
    if (!Array.isArray(stored)) return seedGoalTemplates;
    return stored;
  } catch {
    return seedGoalTemplates;
  }
}

let seq = 0;
export const newTemplateId = () => `gt-local-${Date.now()}-${seq++}`;

type GoalTemplatesValue = {
  templates: GoalTemplate[];
  /** What the Set a goal drawer offers: a draft would pre-fill half an idea. */
  published: GoalTemplate[];
  saveTemplate: (template: GoalTemplate) => void;
  deleteTemplate: (id: string) => void;
  togglePublished: (id: string) => void;
};

const GoalTemplatesContext = createContext<GoalTemplatesValue | null>(null);

export function GoalTemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<GoalTemplate[]>(seedGoalTemplates);
  /** Storage has been read, so it is safe to write back over it. */
  const [hydrated, setHydrated] = useState(false);

  // Storage is read after mount, never during render — see use-mounted.
  useEffect(() => {
    setTemplates(readStorage());
    setHydrated(true);
  }, []);

  /* Persisted from an effect rather than inside each mutator. Writing from within
     a state updater means calling setState during the updater, which is not a
     pure function of the previous state — React is free to re-run or drop it, and
     it did: a publish toggle changed nothing and stored nothing. The updaters
     below are now pure and this is the only place that touches storage.

     The `hydrated` guard matters: without it the first paint would write the seed
     over whatever the admin had saved. */
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch {
      // A blocked or full localStorage shouldn't lose the edit for this session.
    }
  }, [templates, hydrated]);

  const saveTemplate = useCallback((template: GoalTemplate) => {
    setTemplates((current) =>
      current.some((entry) => entry.id === template.id)
        ? current.map((entry) => (entry.id === template.id ? template : entry))
        : [...current, template]
    );
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const togglePublished = useCallback((id: string) => {
    setTemplates((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, published: !entry.published } : entry
      )
    );
  }, []);

  const value = useMemo<GoalTemplatesValue>(
    () => ({
      templates,
      published: templates.filter((template) => template.published),
      saveTemplate,
      deleteTemplate,
      togglePublished
    }),
    [templates, saveTemplate, deleteTemplate, togglePublished]
  );

  return (
    <GoalTemplatesContext.Provider value={value}>{children}</GoalTemplatesContext.Provider>
  );
}

/**
 * The current templates.
 *
 * Reads the seed until the component has mounted, matching what the server
 * rendered: the provider sits in the root layout and can commit its stored value
 * before a page hydrates, and a consumer reading storage straight away would
 * render different markup from the HTML it is hydrating into.
 */
export function useGoalTemplates(): GoalTemplatesValue {
  const context = useContext(GoalTemplatesContext);
  const mounted = useMounted();

  if (!context) {
    throw new Error("useGoalTemplates must be used inside GoalTemplatesProvider");
  }

  if (!mounted) {
    return {
      ...context,
      templates: seedGoalTemplates,
      published: seedGoalTemplates.filter((template) => template.published)
    };
  }

  return context;
}
