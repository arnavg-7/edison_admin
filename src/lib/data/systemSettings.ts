import type { ComboboxOption } from "@/components/shared/Combobox";
import { rangeAnchor } from "@/lib/date-range";
import { schools } from "./schools";
import { studentCountBySchoolDistribution } from "./homeDashboardCharts";

// TODO: replace with the real Admin DB system-settings contract.

/**
 * A grade level is a band of grades (e.g. 1-5) assigned to one or more schools.
 * Only the four fields below are stored: everything the card shows is either one
 * of them or derived from them — the title from the grade band, the school line
 * from `schoolIds`, the badge from `active`, and the "N schools / N students"
 * rollup from live per-school enrollment. Nothing here duplicates a figure that
 * can be counted.
 */
export type GradeLevel = {
  id: string;
  /** Youngest grade in the band. */
  gradeStart: string;
  /** Oldest grade in the band; equal to gradeStart for a single-grade level. */
  gradeEnd: string;
  /** Genesis-synced schools this band applies to. */
  schoolIds: string[];
  active: boolean;
  /** Why this band exists. Shown on the card under the school names. */
  description: string;
};

/** Every grade any Genesis school actually offers, youngest first — the options
    the start/end pickers offer, rather than an invented K-12 list. */
export const GRADE_OPTIONS: string[] = Array.from(
  new Set(schools.flatMap((school) => school.grades))
).sort((a, b) => Number(a) - Number(b));

export const gradeLevels: GradeLevel[] = [
  {
    id: "gl-1-5",
    gradeStart: "1",
    gradeEnd: "5",
    schoolIds: ["lincoln-es", "franklin-es"],
    active: true,
    description: "Elementary band: one homeroom teacher per class, report cards twice a year."
  },
  {
    id: "gl-6-8",
    gradeStart: "6",
    gradeEnd: "8",
    schoolIds: ["edison-ms"],
    active: true,
    description: "Middle band: subject teachers, quarterly progress reports."
  },
  {
    id: "gl-9-12",
    gradeStart: "9",
    gradeEnd: "12",
    schoolIds: ["edison-hs"],
    active: true,
    description: "High school band: credit-bearing courses and transcript reporting."
  }
];

/** The card title: "Grades 1-5", or "Grade 5" when the band is a single grade. */
export function gradeLevelTitle(level: Pick<GradeLevel, "gradeStart" | "gradeEnd">): string {
  return level.gradeStart === level.gradeEnd
    ? `Grade ${level.gradeStart}`
    : `Grades ${level.gradeStart}\u2013${level.gradeEnd}`;
}

/** The school-names line, in the order the schools list defines. */
export function gradeLevelSchoolNames(schoolIds: string[]): string[] {
  return schools.filter((school) => schoolIds.includes(school.id)).map((school) => school.name);
}

/**
 * Live enrollment for one school. Keyed by name because that is what the
 * Salesforce distribution report returns; the join happens here so callers work
 * in school ids.
 *
 * TODO: read per-school enrollment from the real report once it exists.
 */
export function studentsForSchool(schoolId: string): number {
  const name = schools.find((school) => school.id === schoolId)?.name;
  if (!name) return 0;
  return studentCountBySchoolDistribution.find((slice) => slice.label === name)?.value ?? 0;
}

/** Always counted, never stored: the card's "N schools / N students" line. */
export function gradeLevelRollup(schoolIds: string[]): { schools: number; students: number } {
  return {
    schools: schoolIds.length,
    students: schoolIds.reduce((sum, id) => sum + studentsForSchool(id), 0)
  };
}

/**
 * A subject, mapped to the grade band it's taught across. Course count is
 * counted from Genesis course records, never typed in — `gradeStart`/`gradeEnd`
 * being unset (not "K" and "12") is what "Unmapped" means, distinct from a
 * subject genuinely spanning every grade.
 */
export type Subject = {
  id: string;
  name: string;
  description: string;
  /** Youngest grade this subject is taught in, or null if not yet mapped. */
  gradeStart: string | null;
  /** Oldest grade this subject is taught in, or null if not yet mapped. */
  gradeEnd: string | null;
  /** Counted from Genesis course records — never an input in the drawer. */
  courseCount: number;
};

/** The card's grade-band line: "Mapped to grades K–12." or the unmapped case. */
export function subjectGradeLabel(subject: Pick<Subject, "gradeStart" | "gradeEnd">): string {
  if (!subject.gradeStart || !subject.gradeEnd) {
    return "Not yet mapped to grade levels.";
  }
  return subject.gradeStart === subject.gradeEnd
    ? `Mapped to grade ${subject.gradeStart}.`
    : `Mapped to grades ${subject.gradeStart}–${subject.gradeEnd}.`;
}

export function subjectStatus(subject: Pick<Subject, "gradeStart" | "gradeEnd">): {
  tone: "ok" | "warn";
  label: string;
} {
  return subject.gradeStart && subject.gradeEnd
    ? { tone: "ok", label: "Mapped" }
    : { tone: "warn", label: "Unmapped" };
}

export const subjects: Subject[] = [
  {
    id: "sub-math",
    name: "Mathematics",
    description: "Core numeracy sequence from arithmetic through calculus.",
    gradeStart: "K",
    gradeEnd: "12",
    courseCount: 14
  },
  {
    id: "sub-english",
    name: "English Language Arts",
    description: "Reading, writing and literature across every grade band.",
    gradeStart: "K",
    gradeEnd: "12",
    courseCount: 12
  },
  {
    id: "sub-science",
    name: "Science",
    description: "Life, physical and earth science, plus AP lab sciences at the high school.",
    gradeStart: "3",
    gradeEnd: "12",
    courseCount: 11
  },
  {
    id: "sub-arts",
    name: "Visual & Performing Arts",
    description: "Studio art, band, choir and theater electives.",
    gradeStart: null,
    gradeEnd: null,
    courseCount: 6
  }
];

/** Who an announcement is shown to. "specific-grade"/"specific-school" carry
    their target grade or school id separately, in `audienceTarget`. */
export type AnnouncementAudience =
  | "all-users"
  | "all-faculty"
  | "all-students"
  | "specific-grade"
  | "specific-school";

export const ANNOUNCEMENT_AUDIENCE_OPTIONS: ComboboxOption<AnnouncementAudience>[] = [
  { value: "all-users", label: "All Users" },
  { value: "all-faculty", label: "All Faculty" },
  { value: "all-students", label: "All Students" },
  { value: "specific-grade", label: "Specific Grade" },
  { value: "specific-school", label: "Specific School" }
];

export type Announcement = {
  id: string;
  name: string;
  description: string;
  audience: AnnouncementAudience;
  /** A grade value when audience is "specific-grade", a school id when
      "specific-school"; unused (null) for every other audience. */
  audienceTarget: string | null;
  /** Plain calendar dates (YYYY-MM-DD), not timestamps — an announcement
      starts/expires on a day, not a moment. */
  startDate: string;
  expiryDate: string;
};

/** "All Faculty", "Grade 9", "Edison High School" — whatever the audience
    actually resolves to, for the card's meta line and the drawer's read-back. */
export function announcementAudienceLabel(
  announcement: Pick<Announcement, "audience" | "audienceTarget">
): string {
  if (announcement.audience === "specific-grade") {
    return announcement.audienceTarget ? `Grade ${announcement.audienceTarget}` : "Specific Grade";
  }
  if (announcement.audience === "specific-school") {
    const school = schools.find((entry) => entry.id === announcement.audienceTarget);
    return school ? school.name : "Specific School";
  }
  return ANNOUNCEMENT_AUDIENCE_OPTIONS.find((option) => option.value === announcement.audience)?.label
    ?? "All Users";
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/** Formats a YYYY-MM-DD string without going through Date/timezone
    conversion — the same reasoning as Goals' semester dates: a
    plain calendar date shown a day early or late (from a UTC/local shift)
    reads as a real bug, not a rounding quirk. */
export function formatPlainDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

/** "Today" as a plain YYYY-MM-DD, anchored to the app's own last-refresh
    stamp rather than the real clock — see `rangeAnchor`'s own note: the mock
    data is seeded around a fixed date, so resolving against `Date.now()`
    would eventually put every announcement in the past. */
function todayIso(): string {
  return isoDayFormatter.format(rangeAnchor());
}

export function announcementStatus(
  announcement: Pick<Announcement, "startDate" | "expiryDate">
): { tone: "ok" | "warn" | "neutral"; label: string } {
  const today = todayIso();
  if (today < announcement.startDate) {
    return { tone: "neutral", label: "Scheduled" };
  }
  if (today > announcement.expiryDate) {
    return { tone: "neutral", label: "Expired" };
  }
  return { tone: "ok", label: "Active" };
}

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    name: "Term 4 progress reports due",
    description: "Faculty must submit progress reports by August 8.",
    audience: "all-faculty",
    audienceTarget: null,
    startDate: "2026-07-14",
    expiryDate: "2026-08-08"
  },
  {
    id: "ann-2",
    name: "Summer portal maintenance",
    description: "The portal will be unavailable Saturday 02:00–06:00.",
    audience: "all-users",
    audienceTarget: null,
    startDate: "2026-07-10",
    expiryDate: "2026-08-03"
  },
  {
    id: "ann-3",
    name: "Welcome back, class of 2030",
    description: "Orientation details for incoming grade 9 students.",
    audience: "specific-grade",
    audienceTarget: "9",
    startDate: "2026-08-24",
    expiryDate: "2026-09-07"
  }
];

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};

export const auditLog: AuditEntry[] = [
  {
    id: "al-1",
    actor: "Priya Nair",
    action: "Updated alert rule",
    target: "Attendance below 80%",
    at: "2026-07-17T12:41:00-04:00"
  },
  {
    id: "al-2",
    actor: "Sam Okonkwo",
    action: "Changed role",
    target: "Marcus Reyes → School Leader",
    at: "2026-07-17T10:12:00-04:00"
  },
  {
    id: "al-3",
    actor: "Priya Nair",
    action: "Published development area",
    target: "Collaboration (HS)",
    at: "2026-07-16T15:55:00-04:00"
  },
  {
    id: "al-4",
    actor: "Sam Okonkwo",
    action: "Re-ran Genesis ingest",
    target: "2026-07-16 daily file",
    at: "2026-07-16T08:07:00-04:00"
  },
  {
    id: "al-5",
    actor: "Dana Whitfield",
    action: "Exported report",
    target: "Faculty class performance · Edison HS",
    at: "2026-07-15T17:20:00-04:00"
  }
];
