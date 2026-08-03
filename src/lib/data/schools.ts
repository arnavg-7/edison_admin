// TODO: replace with the real Genesis OneRoster orgs/classes contract.

export type SchoolLevel = "ES" | "MS" | "HS";

export type School = {
  id: string;
  name: string;
  level: SchoolLevel;
  grades: string[];
  /** Real gap: only one school has homeroom courses in the Genesis export. */
  hasHomeroomCourses: boolean;
};

/** Grade-level filter options, youngest to oldest, for the User Management drill-down. */
export const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "ES", label: "Elementary School" },
  { value: "MS", label: "Middle School" },
  { value: "HS", label: "High School" }
];

/** Human label for a grade value ("9" -> "Grade 9"). */
export function gradeLabel(grade: string): string {
  return `Grade ${grade}`;
}

export const schools: School[] = [
  {
    id: "edison-hs",
    name: "Edison High School",
    level: "HS",
    grades: ["9", "10", "11", "12"],
    hasHomeroomCourses: true
  },
  {
    id: "edison-ms",
    name: "Edison Middle School",
    level: "MS",
    grades: ["6", "7", "8"],
    hasHomeroomCourses: false
  },
  {
    id: "james-madison-intermediate",
    name: "James Madison Intermediate",
    level: "MS",
    grades: ["6", "7", "8"],
    hasHomeroomCourses: false
  },
  {
    id: "lincoln-es",
    name: "Lincoln Elementary",
    level: "ES",
    grades: ["1", "2", "3", "4", "5"],
    hasHomeroomCourses: false
  },
  {
    id: "franklin-es",
    name: "Franklin Elementary",
    level: "ES",
    grades: ["1", "2", "3", "4", "5"],
    hasHomeroomCourses: false
  }
];

export function gradesForSchool(schoolId: string | null): string[] {
  if (!schoolId) {
    return [];
  }
  return schools.find((school) => school.id === schoolId)?.grades ?? [];
}

// TODO: replace with the real class/section roster from Genesis.
export const classesByGrade: Record<string, { id: string; name: string }[]> = {
  "9": [
    { id: "alg1-a", name: "Algebra I · Section A" },
    { id: "bio-b", name: "Biology · Section B" }
  ],
  "10": [
    { id: "geo-a", name: "Geometry · Section A" },
    { id: "chem-a", name: "Chemistry · Section A" }
  ],
  "11": [
    { id: "alg2-c", name: "Algebra II · Section C" },
    { id: "ushist-a", name: "US History · Section A" }
  ],
  "12": [
    { id: "calc-a", name: "Calculus · Section A" },
    { id: "cs-a", name: "Computer Science · Section A" }
  ]
};

export function classesForGrade(grade: string | null): { id: string; name: string }[] {
  if (!grade) {
    return [];
  }
  return classesByGrade[grade] ?? [];
}
