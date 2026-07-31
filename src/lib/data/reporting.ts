import type { Metric } from "./types";
import { classesForGrade, schools } from "./schools";

// TODO: replace with real reporting contracts. Attendance rollups come from the
// Genesis OneRoster feed, assignment completion from the Classroom API, and
// goal completion from the Admin DB. Values below are illustrative only.
//
// Everything here is derived from the same two underlying report shapes
// (student progress, faculty class performance) — the custom report builder
// reads these, not a separate raw data layer.

export type Scope = {
  school: string | null;
  grade: string | null;
  section: string | null;
};

/** Deterministic pseudo-variance so drill-down visibly changes the numbers. */
function scopeSeed(scope: Scope): number {
  const key = `${scope.school ?? ""}|${scope.grade ?? ""}|${scope.section ?? ""}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 1000;
  }
  return hash;
}

function vary(base: number, scope: Scope, spread: number): number {
  const seed = scopeSeed(scope);
  const offset = ((seed % (spread * 200)) / 100 - spread) * (scope.school ? 1 : 0.2);
  return Math.max(0, Math.min(100, base + offset));
}

export function coreMetricsForScope(scope: Scope): Metric[] {
  return [
    {
      id: "attendance-rate",
      label: "Attendance Rate",
      value: `${vary(92.4, scope, 6).toFixed(1)}%`,
      source: "genesis",
      asOf: "2026-07-17T06:15:00-04:00",
      cadence: "Once daily from Genesis file",
      trend: { direction: "down", delta: "0.6 pts vs. previous period" }
    },
    {
      id: "goal-completion",
      label: "Goal Completion",
      value: `${vary(68.1, scope, 9).toFixed(1)}%`,
      source: "admin_db",
      asOf: "2026-07-17T13:02:00-04:00",
      cadence: "Immediate on status change",
      trend: { direction: "up", delta: "2.3 pts vs. previous period" }
    },
    {
      id: "assignment-completion",
      label: "Assignment Completion Rate",
      value: `${vary(84.7, scope, 7).toFixed(1)}%`,
      source: "classroom",
      asOf: "2026-07-17T12:47:00-04:00",
      cadence: "Near real-time from Classroom API",
      trend: { direction: "up", delta: "1.1 pts vs. previous period" }
    }
  ];
}

/** Sparkline points, oldest first. */
export function trendSeriesForMetric(metricId: string, scope: Scope): number[] {
  const base = { "attendance-rate": 92, "goal-completion": 66, "assignment-completion": 84 }[
    metricId
  ] ?? 80;
  const seed = scopeSeed(scope);
  return Array.from({ length: 8 }, (_, index) => {
    const wobble = Math.sin((seed + index * 37) / 9) * 4;
    return Math.max(0, Math.min(100, base + wobble + index * 0.3));
  });
}

/** Next level down from the current scope. Stops at class. */
export type DrillRow = {
  id: string;
  name: string;
  attendance: number;
  assignments: number;
  goals: number;
  students: number;
};

export function drillRowsForScope(scope: Scope): { level: string; rows: DrillRow[] } {
  const seed = scopeSeed(scope);

  if (!scope.school) {
    return {
      level: "School",
      rows: schools.map((school, index) => ({
        id: school.id,
        name: school.name,
        attendance: 88 + ((seed + index * 13) % 90) / 10,
        assignments: 78 + ((seed + index * 29) % 150) / 10,
        goals: 58 + ((seed + index * 41) % 200) / 10,
        students: 240 + ((seed + index * 57) % 900)
      }))
    };
  }

  const school = schools.find((item) => item.id === scope.school);

  if (!scope.grade) {
    return {
      level: "Grade",
      rows: (school?.grades ?? []).map((grade, index) => ({
        id: grade,
        name: `Grade ${grade}`,
        attendance: 87 + ((seed + index * 17) % 100) / 10,
        assignments: 76 + ((seed + index * 23) % 160) / 10,
        goals: 55 + ((seed + index * 47) % 220) / 10,
        students: 90 + ((seed + index * 61) % 200)
      }))
    };
  }

  return {
    level: "Class / Section",
    rows: classesForGrade(scope.grade).map((section, index) => ({
      id: section.id,
      name: section.name,
      attendance: 86 + ((seed + index * 19) % 110) / 10,
      assignments: 74 + ((seed + index * 31) % 170) / 10,
      goals: 52 + ((seed + index * 53) % 240) / 10,
      students: 18 + ((seed + index * 7) % 14)
    }))
  };
}

/** Platform health & usage — the Admin dashboard screen. */
export type AdoptionRow = {
  school: string;
  adoption: number;
  activeLogins: number;
};

export const adoptionBySchool: AdoptionRow[] = schools.map((school, index) => ({
  school: school.name,
  adoption: 62 + index * 7,
  activeLogins: 180 + index * 137
}));

export const lastSyncByIntegration = [
  { integration: "Genesis (file ingest)", asOf: "2026-07-17T05:12:00-04:00", source: "genesis" as const },
  { integration: "Google Classroom (API)", asOf: "2026-07-17T12:47:00-04:00", source: "classroom" as const },
  { integration: "Google Calendar (API)", asOf: "2026-07-17T12:31:00-04:00", source: "calendar" as const }
];

/** Student progress rollups — stops at class level, no individual profiles. */
export type StudentProgressRow = {
  id: string;
  cohort: string;
  goalsOnTrack: number;
  goalsAtRisk: number;
  avgAttendance: number;
  students: number;
};

export function studentProgressRows(scope: Scope): StudentProgressRow[] {
  const { rows, level } = drillRowsForScope(scope);
  return rows.map((row) => ({
    id: row.id,
    cohort: level === "School" ? row.name : row.name,
    goalsOnTrack: Math.round(row.goals),
    goalsAtRisk: Math.round(100 - row.goals),
    avgAttendance: row.attendance,
    students: row.students
  }));
}

/** Faculty class performance — also stops at class level. */
export type FacultyClassRow = {
  id: string;
  className: string;
  teacher: string;
  avgAttendance: number;
  assignmentCompletion: number;
  rosterSize: number;
  openAlerts: number;
};

const TEACHERS = ["K. Blekeski", "A. Chen", "P. Nair", "D. Osei", "M. Alvarez", "R. Whitfield"];

export function facultyClassRows(scope: Scope): FacultyClassRow[] {
  const { rows } = drillRowsForScope(scope);
  return rows.map((row, index) => ({
    id: row.id,
    className: row.name,
    teacher: TEACHERS[index % TEACHERS.length],
    avgAttendance: row.attendance,
    assignmentCompletion: row.assignments,
    rosterSize: row.students,
    openAlerts: (scopeSeed(scope) + index * 3) % 5
  }));
}
