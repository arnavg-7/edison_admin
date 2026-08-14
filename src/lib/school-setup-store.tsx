"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  seedDistrict,
  type SetupBatch,
  type SetupDistrict,
  type SetupGrade,
  type SetupSchool
} from "@/lib/data/schoolSetup";

/**
 * The district hierarchy School Setup edits. Same shape as admin-users-store:
 * the whole tree is admin-owned, so the whole tree lives in localStorage, seeded
 * from `seedDistrict` on first load.
 *
 * The one addition is `undo`. Deleting a school takes its grades and every batch
 * under them with it, which is far more destructive than removing one row, so the
 * store keeps the pre-delete tree and the screen offers it back.
 *
 * TODO: swap for API calls once the Admin DB school-hierarchy contract exists.
 */

const STORAGE_KEY = "edison-admin.school-setup.v1";

function readStorage(): SetupDistrict {
  if (typeof window === "undefined") return seedDistrict;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDistrict;

    const stored = JSON.parse(raw) as SetupDistrict;
    // A stored tree missing its schools array is corrupt, not empty — an admin
    // who deleted every school still has `schools: []`.
    if (!Array.isArray(stored?.schools)) return seedDistrict;
    return stored;
  } catch {
    // Corrupt or unavailable storage shouldn't take the page down — start clean.
    return seedDistrict;
  }
}

/** What a delete removed, so the screen can name it in the undo offer. */
export type SetupUndo = { label: string; district: SetupDistrict };

type SchoolSetupContextValue = {
  district: SetupDistrict;
  addSchool: (school: SetupSchool) => void;
  updateSchool: (schoolId: string, patch: Partial<Omit<SetupSchool, "grades">>) => void;
  removeSchool: (schoolId: string) => void;
  addGrade: (schoolId: string, grade: SetupGrade) => void;
  updateGrade: (schoolId: string, gradeId: string, patch: Partial<Omit<SetupGrade, "batches">>) => void;
  removeGrade: (schoolId: string, gradeId: string) => void;
  addBatch: (schoolId: string, gradeId: string, batch: SetupBatch) => void;
  updateBatch: (schoolId: string, gradeId: string, batchId: string, patch: Partial<SetupBatch>) => void;
  removeBatch: (schoolId: string, gradeId: string, batchId: string) => void;
  /** Set by the last delete, cleared by undoing or dismissing it. */
  undo: SetupUndo | null;
  applyUndo: () => void;
  dismissUndo: () => void;
  /** False until localStorage has been read, so the UI can avoid a false empty state. */
  isLoaded: boolean;
};

const SchoolSetupContext = createContext<SchoolSetupContextValue | null>(null);

export function SchoolSetupProvider({ children }: { children: React.ReactNode }) {
  // Starts with the seed on both server and first client render so hydration
  // matches; the effect below fills it in from storage immediately after mount.
  const [district, setDistrict] = useState<SetupDistrict>(seedDistrict);
  const [undo, setUndo] = useState<SetupUndo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setDistrict(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(district));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [district, isLoaded]);

  /** Every write goes through here, so a mapped update never mutates in place. */
  const mapSchools = useCallback(
    (fn: (schools: SetupSchool[]) => SetupSchool[]) => {
      setDistrict((current) => ({ ...current, schools: fn(current.schools) }));
    },
    []
  );

  const inSchool = useCallback(
    (schoolId: string, fn: (school: SetupSchool) => SetupSchool) => {
      mapSchools((all) => all.map((school) => (school.id === schoolId ? fn(school) : school)));
    },
    [mapSchools]
  );

  const inGrade = useCallback(
    (schoolId: string, gradeId: string, fn: (grade: SetupGrade) => SetupGrade) => {
      inSchool(schoolId, (school) => ({
        ...school,
        grades: school.grades.map((grade) => (grade.id === gradeId ? fn(grade) : grade))
      }));
    },
    [inSchool]
  );

  /** Snapshots the tree before a cascading delete, then performs it. */
  const deleteWithUndo = useCallback(
    (label: string, fn: (schools: SetupSchool[]) => SetupSchool[]) => {
      setDistrict((current) => {
        setUndo({ label, district: current });
        return { ...current, schools: fn(current.schools) };
      });
    },
    []
  );

  const value = useMemo<SchoolSetupContextValue>(
    () => ({
      district,
      addSchool: (school) => mapSchools((all) => [...all, school]),
      updateSchool: (schoolId, patch) => inSchool(schoolId, (school) => ({ ...school, ...patch })),
      removeSchool: (schoolId) => {
        const name = district.schools.find((school) => school.id === schoolId)?.name ?? "School";
        deleteWithUndo(name, (all) => all.filter((school) => school.id !== schoolId));
      },
      addGrade: (schoolId, grade) =>
        inSchool(schoolId, (school) => ({ ...school, grades: [...school.grades, grade] })),
      updateGrade: (schoolId, gradeId, patch) =>
        inGrade(schoolId, gradeId, (grade) => ({ ...grade, ...patch })),
      removeGrade: (schoolId, gradeId) => {
        const school = district.schools.find((entry) => entry.id === schoolId);
        const name = school?.grades.find((grade) => grade.id === gradeId)?.name ?? "Grade";
        deleteWithUndo(name, (all) =>
          all.map((entry) =>
            entry.id === schoolId
              ? { ...entry, grades: entry.grades.filter((grade) => grade.id !== gradeId) }
              : entry
          )
        );
      },
      addBatch: (schoolId, gradeId, batch) =>
        inGrade(schoolId, gradeId, (grade) => ({ ...grade, batches: [...grade.batches, batch] })),
      updateBatch: (schoolId, gradeId, batchId, patch) =>
        inGrade(schoolId, gradeId, (grade) => ({
          ...grade,
          batches: grade.batches.map((batch) =>
            batch.id === batchId ? { ...batch, ...patch } : batch
          )
        })),
      removeBatch: (schoolId, gradeId, batchId) => {
        const grade = district.schools
          .find((entry) => entry.id === schoolId)
          ?.grades.find((entry) => entry.id === gradeId);
        const name = grade?.batches.find((batch) => batch.id === batchId)?.name ?? "Batch";
        deleteWithUndo(name, (all) =>
          all.map((entry) =>
            entry.id === schoolId
              ? {
                  ...entry,
                  grades: entry.grades.map((item) =>
                    item.id === gradeId
                      ? { ...item, batches: item.batches.filter((batch) => batch.id !== batchId) }
                      : item
                  )
                }
              : entry
          )
        );
      },
      undo,
      applyUndo: () => {
        if (undo) setDistrict(undo.district);
        setUndo(null);
      },
      dismissUndo: () => setUndo(null),
      isLoaded
    }),
    [deleteWithUndo, district, inGrade, inSchool, isLoaded, mapSchools, undo]
  );

  return <SchoolSetupContext.Provider value={value}>{children}</SchoolSetupContext.Provider>;
}

export function useSchoolSetup(): SchoolSetupContextValue {
  const context = useContext(SchoolSetupContext);
  if (!context) {
    throw new Error("useSchoolSetup must be used inside <SchoolSetupProvider>");
  }
  return context;
}
