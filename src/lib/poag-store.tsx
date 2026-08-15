"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  POAG_BANDS,
  isSeedPillar,
  poagContentKey,
  seedPoagContent,
  seedPoagLevels,
  seedPoagPillars,
  type PoagBand,
  type PoagBandContent,
  type PoagContentMap,
  type PoagPillar,
  type PoagScaleLevel
} from "@/lib/data/poag";

/**
 * The four things an admin owns on the POAG screen.
 *
 * `pillars` is the list itself. Edison's six are seeded and cannot be deleted —
 * they are the Portrait of a Graduate as signed off, and ratings already point
 * at their rubric keys — but a district can add its own, and any pillar's title
 * and hover text can be reworded. The rubric key never changes once it exists,
 * for the same reason.
 *
 * `levels` is the scale those pillars are rated on. Edison's four are seeded on
 * the same terms, with one extra rule: a new level joins the top of the
 * progression and never the middle, because a rating stores the position it was
 * filed at and inserting below it would move every rating already made.
 *
 * `content` is the wording teachers and students read. It is keyed by band, not
 * by grade — that is the whole reason it sits in a table rather than in code:
 * Edison revises a level definition once and every grade in that band picks it
 * up, with no release. It also means an edit here is wider than the grade page
 * it was made from, which the editor says out loud before saving.
 *
 * `focus` is per grade scope. Edison's pilot has teachers rating one pillar at a
 * time, so this is what narrows the faculty view; it is a rollout setting, not
 * content, which is why it is not keyed by band.
 *
 * TODO: swap for the Admin DB poag_content contract. Ratings themselves are
 * never written from here — the admin has no write access to a student's level
 * (handoff spec §3.3).
 */

const CONTENT_KEY = "edison-admin.poag-content.v1";
const FOCUS_KEY = "edison-admin.poag-focus.v1";
const PILLARS_KEY = "edison-admin.poag-pillars.v1";
const LEVELS_KEY = "edison-admin.poag-levels.v1";

/** Pillars the district added on top of Edison's six. */
type PillarState = {
  custom: PoagPillar[];
  /** Title/hover rewrites, keyed by rubric key — which itself never changes. */
  overrides: Record<string, { displayTitle?: string; hoverText?: string }>;
};

const EMPTY_PILLAR_STATE: PillarState = { custom: [], overrides: {} };

/** Levels the district added on top of Edison's four. */
type LevelState = {
  /** Appended to the end of the scale, in order — never spliced into it. */
  custom: string[];
  /** Renames, keyed by position. A rename moves no rating; a reorder would. */
  overrides: Record<string, string>;
};

const EMPTY_LEVEL_STATE: LevelState = { custom: [], overrides: {} };

/** `${schoolId}:${grade}` → rubricKey, or "all" for every pillar at once. */
type FocusMap = Record<string, string>;

export const POAG_FOCUS_ALL = "all";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    // Corrupt or unavailable storage shouldn't take the page down.
    return fallback;
  }
}

type PoagContextValue = {
  /** Edison's six plus anything the district added, in display order. */
  pillars: PoagPillar[];
  addPillar: (pillar: PoagPillar) => void;
  /** Title and hover only — the rubric key is what ratings point at. */
  updatePillar: (rubricKey: string, patch: { displayTitle: string; hoverText: string }) => void;
  /** Added pillars only; the seeded six refuse. Takes its wording with it. */
  removePillar: (rubricKey: string) => void;
  /** Edison's four plus anything the district added, low to high. */
  levels: PoagScaleLevel[];
  /** Joins the top of the scale — see the note on ordering above. */
  addLevel: (label: string) => void;
  renameLevel: (value: number, label: string) => void;
  /** The top level only, and only if the district added it. */
  removeLevel: (value: number) => void;
  content: PoagContentMap;
  contentFor: (band: PoagBand, rubricKey: string) => PoagBandContent;
  updateContent: (band: PoagBand, rubricKey: string, next: PoagBandContent) => void;
  /** True when this pair has been edited away from the seeded rubric text. */
  isEdited: (band: PoagBand, rubricKey: string) => boolean;
  resetContent: (band: PoagBand, rubricKey: string) => void;
  focusFor: (schoolId: string, grade: string) => string;
  setFocus: (schoolId: string, grade: string, rubricKey: string) => void;
  /** Applies a parsed bulk upload: new pillars, then wording, in one commit. */
  importContent: (
    entries: { pillar: PoagPillar; band: PoagBand; content: PoagBandContent }[]
  ) => void;
  isLoaded: boolean;
};

const PoagContext = createContext<PoagContextValue | null>(null);

export function PoagProvider({ children }: { children: React.ReactNode }) {
  // Seeded on the server and on the first client render so hydration matches;
  // the effect below swaps in stored edits immediately after mount.
  const [content, setContent] = useState<PoagContentMap>(seedPoagContent);
  const [focus, setFocusMap] = useState<FocusMap>({});
  const [pillarState, setPillarState] = useState<PillarState>(EMPTY_PILLAR_STATE);
  const [levelState, setLevelState] = useState<LevelState>(EMPTY_LEVEL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setContent({ ...seedPoagContent, ...readJson<PoagContentMap>(CONTENT_KEY, {}) });
    setFocusMap(readJson<FocusMap>(FOCUS_KEY, {}));
    setPillarState(readJson<PillarState>(PILLARS_KEY, EMPTY_PILLAR_STATE));
    setLevelState(readJson<LevelState>(LEVELS_KEY, EMPTY_LEVEL_STATE));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      // Only the overrides are persisted, so revised seed wording still reaches
      // an admin who edited a different pillar.
      const overrides = Object.fromEntries(
        Object.entries(content).filter(
          ([key, value]) => JSON.stringify(seedPoagContent[key]) !== JSON.stringify(value)
        )
      );
      window.localStorage.setItem(CONTENT_KEY, JSON.stringify(overrides));
      window.localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
      window.localStorage.setItem(PILLARS_KEY, JSON.stringify(pillarState));
      window.localStorage.setItem(LEVELS_KEY, JSON.stringify(levelState));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [content, focus, levelState, pillarState, isLoaded]);

  /* Edison's four first, then the district's own, each with any rename applied.
     Position is identity here — it is what a rating row stores — so the order is
     append-only and a rename never moves anything. */
  const levels = useMemo<PoagScaleLevel[]>(
    () =>
      [...seedPoagLevels, ...levelState.custom].map((label, index) => ({
        value: index,
        label: levelState.overrides[index] ?? label,
        seeded: index < seedPoagLevels.length
      })),
    [levelState]
  );

  const levelCount = levels.length;

  /* Padded to the live scale rather than returned as stored: wording written
     when the scale was four levels long has nothing at level five, and every
     caller wants that as an empty string it can count and render — which is
     what puts a pillar at "4 of 5" until someone writes the new level. */
  const contentFor = useCallback(
    (band: PoagBand, rubricKey: string): PoagBandContent => {
      const saved = content[poagContentKey(band, rubricKey)];
      return {
        descriptor: saved?.descriptor ?? "",
        levels: Array.from({ length: levelCount }, (_, index) => saved?.levels[index] ?? "")
      };
    },
    [content, levelCount]
  );

  /* Seeded six first, then the district's own, each with any rewording applied.
     Order is stable across renders and reloads, so the table never reshuffles. */
  const pillars = useMemo<PoagPillar[]>(
    () =>
      [...seedPoagPillars, ...pillarState.custom].map((pillar) => ({
        ...pillar,
        ...pillarState.overrides[pillar.rubricKey]
      })),
    [pillarState]
  );

  const value = useMemo<PoagContextValue>(
    () => ({
      pillars,
      addPillar: (pillar) =>
        setPillarState((current) =>
          // Re-adding an existing key would give the table two rows joined to one
          // set of ratings, so it is a no-op rather than a duplicate.
          current.custom.some((entry) => entry.rubricKey === pillar.rubricKey) ||
          isSeedPillar(pillar.rubricKey)
            ? current
            : { ...current, custom: [...current.custom, pillar] }
        ),
      updatePillar: (rubricKey, patch) =>
        setPillarState((current) => ({
          ...current,
          overrides: { ...current.overrides, [rubricKey]: patch }
        })),
      removePillar: (rubricKey) => {
        if (isSeedPillar(rubricKey)) return;
        setPillarState((current) => ({
          custom: current.custom.filter((entry) => entry.rubricKey !== rubricKey),
          overrides: Object.fromEntries(
            Object.entries(current.overrides).filter(([key]) => key !== rubricKey)
          )
        }));
        // Its wording goes with it, in every band — otherwise re-adding the same
        // key later would silently inherit the deleted pillar's text.
        setContent((current) =>
          Object.fromEntries(
            Object.entries(current).filter(
              ([key]) => !POAG_BANDS.some((band) => key === poagContentKey(band, rubricKey))
            )
          )
        );
      },
      levels,
      addLevel: (label) =>
        setLevelState((current) => ({ ...current, custom: [...current.custom, label] })),
      renameLevel: (value, label) =>
        setLevelState((current) => ({
          ...current,
          overrides: { ...current.overrides, [value]: label }
        })),
      removeLevel: (value) => {
        /* Only the top of the scale, and only if the district put it there.
           Removing from the middle would shift every level above it down a
           position, and a rating filed at "Applying" would come back reading as
           the level that took its place. */
        if (value < seedPoagLevels.length || value !== levelCount - 1) return;

        setLevelState((current) => ({
          custom: current.custom.slice(0, -1),
          overrides: Object.fromEntries(
            Object.entries(current.overrides).filter(([key]) => Number(key) !== value)
          )
        }));
        // Its wording goes with it, in every band and on every pillar —
        // otherwise adding a level back later would inherit the removed one's
        // text without anyone having written it.
        setContent((current) =>
          Object.fromEntries(
            Object.entries(current).map(([key, entry]) => [
              key,
              { ...entry, levels: entry.levels.slice(0, value) }
            ])
          )
        );
      },
      importContent: (entries) => {
        setPillarState((current) => {
          const custom = [...current.custom];
          for (const entry of entries) {
            const known =
              isSeedPillar(entry.pillar.rubricKey) ||
              custom.some((item) => item.rubricKey === entry.pillar.rubricKey);
            if (!known) custom.push(entry.pillar);
          }
          return { ...current, custom };
        });
        setContent((current) => {
          const next = { ...current };
          for (const entry of entries) {
            next[poagContentKey(entry.band, entry.pillar.rubricKey)] = entry.content;
          }
          return next;
        });
      },
      content,
      contentFor,
      updateContent: (band, rubricKey, next) =>
        setContent((current) => ({ ...current, [poagContentKey(band, rubricKey)]: next })),
      isEdited: (band, rubricKey) => {
        const key = poagContentKey(band, rubricKey);
        return JSON.stringify(content[key]) !== JSON.stringify(seedPoagContent[key]);
      },
      resetContent: (band, rubricKey) =>
        setContent((current) => {
          const key = poagContentKey(band, rubricKey);
          const seeded = seedPoagContent[key];
          if (!seeded) return current;
          return { ...current, [key]: seeded };
        }),
      focusFor: (schoolId, grade) => focus[`${schoolId}:${grade}`] ?? POAG_FOCUS_ALL,
      setFocus: (schoolId, grade, rubricKey) =>
        setFocusMap((current) => ({ ...current, [`${schoolId}:${grade}`]: rubricKey })),
      isLoaded
    }),
    [content, contentFor, focus, isLoaded, levelCount, levels, pillars]
  );

  return <PoagContext.Provider value={value}>{children}</PoagContext.Provider>;
}

export function usePoag(): PoagContextValue {
  const context = useContext(PoagContext);
  if (!context) {
    throw new Error("usePoag must be used inside <PoagProvider>");
  }
  return context;
}
