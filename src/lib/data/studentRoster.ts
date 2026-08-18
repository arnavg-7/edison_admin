/**
 * Every student enrolled in one grade at one school.
 *
 * Shared by anything that has to say something about a whole grade's students
 * rather than a hand-picked few: who has reported progress on a grade goal, who
 * has set a personal goal. Two screens deriving their own roster would disagree
 * on the names, and an admin comparing them would be right to distrust both.
 *
 * The count comes from the same place the rest of the app's grade figures do
 * (`studentsInGrade`), so a roster of 110 sits under a card that says 110.
 *
 * TODO: replace with a real Genesis roster read. Names are generated
 * deterministically from the school and grade so a list never reshuffles.
 */

import { people } from "./people";
import { schools } from "./schools";
import { studentsInGrade } from "./poagCoverage";

export type RosterStudent = {
  /** Stable within a grade; equal to `personId` when the student has a 360. */
  id: string;
  name: string;
  /** Set when this student has a 360 profile to link through to. */
  personId: string | null;
};

/** Stable pseudo-variance, so a roster reads the same on every render. */
export function rosterSeed(...parts: string[]): number {
  const key = parts.join("|");
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000;
  }
  return hash;
}

// TODO: real rosters come from Genesis. The pools mirror the district's actual
// mix rather than defaulting to one naming tradition.
const FIRST_NAMES = [
  "Aditi", "Marcus", "Priya", "Elena", "Rohan", "Jasmine", "Daniel", "Ananya",
  "Tobias", "Sofia", "Ibrahim", "Grace", "Kiran", "Noah", "Mei", "Ethan",
  "Fatima", "Lucas", "Anjali", "Samuel", "Zara", "Owen", "Nadia", "Isaac",
  "Leila", "Caleb", "Vikram", "Hannah", "Omar", "Freya"
];

const LAST_NAMES = [
  "Sharma", "Whitfield", "Nair", "Okonkwo", "Mehta", "Alvarez", "Brennan",
  "Iyer", "Lindqvist", "Costa", "Rahman", "Ellery", "Deshpande", "Barlow",
  "Chen", "Novak", "Siddiqui", "Moreau", "Kulkarni", "Hartley", "Abara",
  "Fitzgerald", "Banerjee", "Vogel"
];

function slug(name: string): string {
  return name.replace(/\s+/g, "-").toLowerCase();
}

/**
 * The grade's students, real 360 records first.
 *
 * Leading with the students who have a profile means the names an admin can
 * actually click through to are the ones at the top of every list, rather than
 * buried a screen down among generated ones.
 */
export function gradeRoster(schoolId: string, grade: string): RosterStudent[] {
  const school = schools.find((entry) => entry.id === schoolId);
  if (!school) return [];

  const named: RosterStudent[] = people
    .filter(
      (person) =>
        person.kind === "student" &&
        person.school === school.name &&
        person.group === `Grade ${grade}`
    )
    .map((person) => ({ id: person.id, name: person.name, personId: person.id }));

  const total = Math.max(named.length, studentsInGrade(schoolId, grade));
  const roster = [...named];
  const taken = new Set(named.map((entry) => entry.name));

  /* Bounded rather than while(true): with a fixed name pool a grade larger than
     the pool would otherwise spin forever looking for an unused combination. */
  for (let index = 0; roster.length < total && index < total * 12; index += 1) {
    /* Two independent hashes, not one shifted. Taking the surname from `key >> 3`
       moved it once per eight first names, so a grade came out as eight Mehtas
       followed by four Kulkarnis — a family reunion rather than a roster. */
    const first = rosterSeed(schoolId, grade, String(index));
    const last = rosterSeed(grade, String(index), schoolId, "surname");
    const name = `${FIRST_NAMES[first % FIRST_NAMES.length]} ${
      LAST_NAMES[last % LAST_NAMES.length]
    }`;
    if (taken.has(name)) continue;
    taken.add(name);
    roster.push({ id: `student-${slug(name)}`, name, personId: null });
  }

  return roster;
}
