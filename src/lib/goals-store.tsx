"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  assignmentsFor,
  progressFor,
  seedGoals,
  type Goal,
  type GoalAssignment,
  type GoalProgress,
  type GoalStatus
} from "@/lib/data/goals";

/**
 * Goals written during this session.
 *
 * Two things are held: the goals themselves, and progress written on top of the
 * derived seed data. A status change is never an overwrite — it appends a
 * GoalProgress row and moves the assignment's denormalised `currentStatus` to
 * match, which is the shape the rulebook's HISTORY RULE requires and the reason
 * progress-over-time reporting is possible later.
 *
 * Deliberately not localStorage-backed, like the store it replaces: goals are
 * still TODO-persisted through the Admin DB contract, so a reload is meant to
 * come back to the seed data. State lives in the root layout, so it survives
 * navigation within a session.
 */

type StatusWrite = { status: GoalStatus; progress: GoalProgress };

type GoalsValue = {
  /** Every goal, archived included. Screens filter by `isActive` themselves. */
  goals: Goal[];
  /** A goal's assignments with this session's status writes applied. */
  assignments: (goal: Goal) => GoalAssignment[];
  /** Newest first: this session's rows, then the seeded trail. */
  progress: (goal: Goal, assignment: GoalAssignment) => GoalProgress[];
  createGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  /** Soft delete — the rulebook has no hard delete. */
  archiveGoal: (goalId: string) => void;
  restoreGoal: (goalId: string) => void;
  setStatus: (args: {
    goal: Goal;
    assignment: GoalAssignment;
    status: GoalStatus;
    note: string;
    actor: string;
  }) => void;
};

const GoalsContext = createContext<GoalsValue | null>(null);

let progressSeq = 0;

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(seedGoals);
  const [writes, setWrites] = useState<Map<string, StatusWrite[]>>(new Map());

  const assignments = useCallback(
    (goal: Goal) =>
      assignmentsFor(goal).map((row) => {
        const written = writes.get(row.id);
        // The last write wins for the denormalised column; the rows all stay.
        return written?.length
          ? { ...row, currentStatus: written[written.length - 1].status }
          : row;
      }),
    [writes]
  );

  const progress = useCallback(
    (goal: Goal, assignment: GoalAssignment) => {
      const written = writes.get(assignment.id) ?? [];

      /* The seeded trail is derived from where the assignment started, not from
         where it is now. Passing the override-applied row would re-derive the
         path to the new status and the change would appear twice — once as the
         row just written, and again as invented history leading to it. */
      const base = assignmentsFor(goal).find((row) => row.id === assignment.id) ?? assignment;

      return [
        // Writes are held oldest-first; the panel reads newest-first.
        ...written.map((entry) => entry.progress).reverse(),
        ...progressFor(goal, base)
      ];
    },
    [writes]
  );

  const createGoal = useCallback((goal: Goal) => {
    setGoals((current) => [goal, ...current]);
  }, []);

  const updateGoal = useCallback((goal: Goal) => {
    setGoals((current) => current.map((entry) => (entry.id === goal.id ? goal : entry)));
  }, []);

  /* Archive rather than remove: history is retained and the goal drops out of
     live rollups. Nothing in this module ever deletes a goal. */
  const archiveGoal = useCallback((goalId: string) => {
    setGoals((current) =>
      current.map((entry) => (entry.id === goalId ? { ...entry, isActive: false } : entry))
    );
  }, []);

  const restoreGoal = useCallback((goalId: string) => {
    setGoals((current) =>
      current.map((entry) => (entry.id === goalId ? { ...entry, isActive: true } : entry))
    );
  }, []);

  const setStatus = useCallback<GoalsValue["setStatus"]>(
    ({ goal, assignment, status, note, actor }) => {
      setWrites((current) => {
        const existing = current.get(assignment.id) ?? [];
        const previous = existing.length
          ? existing[existing.length - 1].status
          : assignment.currentStatus;

        // Not a change, so not a history row.
        if (previous === status) return current;

        const next = new Map(current);
        next.set(assignment.id, [
          ...existing,
          {
            status,
            progress: {
              id: `gp-live-${assignment.id}-${progressSeq++}`,
              assignmentId: assignment.id,
              previousStatus: previous,
              newStatus: status,
              changedBy: actor,
              changedAt: new Date().toISOString(),
              note: note.trim() === "" ? null : note.trim()
            }
          }
        ]);
        return next;
      });
      void goal;
    },
    []
  );

  const value = useMemo<GoalsValue>(
    () => ({
      goals,
      assignments,
      progress,
      createGoal,
      updateGoal,
      archiveGoal,
      restoreGoal,
      setStatus
    }),
    [goals, assignments, progress, createGoal, updateGoal, archiveGoal, restoreGoal, setStatus]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsValue {
  const context = useContext(GoalsContext);
  if (!context) throw new Error("useGoals must be used inside GoalsProvider");
  return context;
}
