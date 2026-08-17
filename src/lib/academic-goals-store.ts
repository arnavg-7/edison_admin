"use client";

import { gradeGoalsFor, type GradeGoal } from "@/lib/data/academicGoals";
import { scopeKey } from "@/lib/data/schools";

/**
 * Goals written during this session, keyed by school/grade scope.
 *
 * The editor used to keep its grade's goals in component state, which held up
 * while a goal could only ever be set for the grade you were already on. The
 * drawer now picks its own school and grade, so a goal can be written to a
 * scope no mounted editor is showing — component state would drop it on the
 * way there, and the grade you landed on would look like the save never
 * happened. Writes live here instead, so the scope you land on reads back what
 * you just set.
 *
 * Deliberately not localStorage-backed, unlike the School Setup and POAG
 * stores: goals are still TODO-persisted through the Admin DB Academic Goals
 * contract, so a reload is meant to come back to the seed data.
 */

export type GoalScope = { schoolId: string; grade: string };

/** Only scopes actually written to appear here; everything else reads its seed. */
const writes = new Map<string, GradeGoal[]>();

export function sameScope(a: GoalScope, b: GoalScope): boolean {
  return a.schoolId === b.schoolId && a.grade === b.grade;
}

export function goalsInScope({ schoolId, grade }: GoalScope): GradeGoal[] {
  return writes.get(scopeKey(schoolId, grade)) ?? gradeGoalsFor(schoolId, grade);
}

function setScope(scope: GoalScope, goals: GradeGoal[]): void {
  writes.set(scopeKey(scope.schoolId, scope.grade), goals);
}

export function deleteGoal(scope: GoalScope, id: string): void {
  setScope(
    scope,
    goalsInScope(scope).filter((goal) => goal.id !== id)
  );
}

/**
 * Writes `goal` into `scope`, replacing an existing goal with the same id.
 *
 * `from` is the scope the goal was being edited in: when the drawer's school or
 * grade changed under an edit, the goal moves to the new scope rather than
 * being copied into it.
 */
export function saveGoal(scope: GoalScope, goal: GradeGoal, from?: GoalScope): void {
  if (from && !sameScope(from, scope)) {
    deleteGoal(from, goal.id);
  }

  const current = goalsInScope(scope);
  const exists = current.some((item) => item.id === goal.id);

  setScope(
    scope,
    exists ? current.map((item) => (item.id === goal.id ? goal : item)) : [...current, goal]
  );
}
