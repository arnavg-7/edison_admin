"use client";

import { scopeKey } from "@/lib/data/schools";
import type { StudentGoal } from "@/lib/data/studentGoals";

/**
 * Individual student goals an admin set during this session.
 *
 * Layered over the derived seed rather than replacing it: `studentGoalsFor` still
 * produces what the students and their teachers wrote, and these are added on top,
 * keyed by grade and then by student name.
 *
 * Module-level, matching academic-goals-store, and for the same reason — these are
 * still TODO-persisted through the Admin DB contract, so a reload is meant to come
 * back to the seed data. The editor keeps its own copy for rendering and re-reads
 * here after each write.
 */

let seq = 0;
export const newStudentGoalId = (student: string) =>
  `sg-admin-${student.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}-${seq++}`;

/** grade scope → student name → the goals an admin added for them. */
const added = new Map<string, Map<string, StudentGoal[]>>();

function scopeMap(schoolId: string, grade: string): Map<string, StudentGoal[]> {
  const key = scopeKey(schoolId, grade);
  const existing = added.get(key);
  if (existing) return existing;
  const fresh = new Map<string, StudentGoal[]>();
  added.set(key, fresh);
  return fresh;
}

export function addedGoalsFor(schoolId: string, grade: string): Map<string, StudentGoal[]> {
  return scopeMap(schoolId, grade);
}

export function addStudentGoal(
  schoolId: string,
  grade: string,
  studentName: string,
  goal: StudentGoal
): void {
  const map = scopeMap(schoolId, grade);
  map.set(studentName, [...(map.get(studentName) ?? []), goal]);
}

export function removeStudentGoal(
  schoolId: string,
  grade: string,
  studentName: string,
  goalId: string
): void {
  const map = scopeMap(schoolId, grade);
  const next = (map.get(studentName) ?? []).filter((goal) => goal.id !== goalId);
  if (next.length === 0) map.delete(studentName);
  else map.set(studentName, next);
}
