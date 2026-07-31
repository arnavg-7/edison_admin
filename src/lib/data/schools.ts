// TODO: replace with the real Genesis OneRoster orgs/classes contract.

export type School = {
  id: string;
  name: string;
  level: "ES" | "MS" | "HS" | "KG";
  grades: string[];
  /** Real gap: only one school has homeroom courses in the Genesis export. */
  hasHomeroomCourses: boolean;
};

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
  },
  {
    id: "edison-kg",
    name: "Edison Kindergarten Center",
    level: "KG",
    grades: ["K"],
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
