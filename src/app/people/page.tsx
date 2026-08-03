"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PROFILE_STATUS_TONE,
  deriveProfileStatus,
  type Person,
  type PersonKind
} from "@/lib/data/people";
import { SCHOOL_LEVELS, gradeLabel, schools, type SchoolLevel } from "@/lib/data/schools";
import { useUsers } from "@/lib/users-store";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddUserModal } from "@/components/people/AddUserModal";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";

const schoolByName = new Map(schools.map((school) => [school.name, school]));

type ComboOption = { value: string; label: string };

const isOptionEqual = (a: ComboOption, b: ComboOption) => a.value === b.value;

const KIND_OPTIONS: ComboOption[] = [
  { value: "all", label: "Students and faculty" },
  { value: "student", label: "Students" },
  { value: "faculty", label: "Faculty" }
];

const LEVEL_OPTIONS: ComboOption[] = [
  { value: "all", label: "All grade levels" },
  ...SCHOOL_LEVELS.map((option) => ({ value: option.value, label: option.label }))
];

/** Search and browse, then open an individual profile. */
export default function PeopleSearchPage() {
  const router = useRouter();
  const { users: allPeople, createUser, createUsers } = useUsers();

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PersonKind | "all">("all");
  const [level, setLevel] = useState<SchoolLevel | "all">("all");
  const [school, setSchool] = useState("all");
  const [grade, setGrade] = useState("all");
  const [isAddingUser, setIsAddingUser] = useState(false);

  /** Create, then open the new profile so the admin can finish filling it in. */
  const handleCreate = (person: Person) => {
    createUser(person);
    router.push(`/people/${person.kind}/${person.id}`);
  };

  // Cascade: Grade Level -> School -> Grade. Each step's options come from the
  // step before it, and picking a new value upstream clears everything downstream
  // so the UI can never be left pointing at an impossible combination.
  const schoolsForLevel = level === "all" ? schools : schools.filter((s) => s.level === level);
  const gradesForSchool = school === "all" ? [] : (schoolByName.get(school)?.grades ?? []);

  const schoolOptions = useMemo<ComboOption[]>(
    () => [
      { value: "all", label: "All schools" },
      ...schoolsForLevel.map((option) => ({ value: option.name, label: option.name }))
    ],
    [schoolsForLevel]
  );

  const gradeOptions = useMemo<ComboOption[]>(
    () => [
      { value: "all", label: "All grades" },
      ...gradesForSchool.map((value) => ({ value, label: gradeLabel(value) }))
    ],
    [gradesForSchool]
  );

  const setLevelAndReset = (value: SchoolLevel | "all") => {
    setLevel(value);
    setSchool("all");
    setGrade("all");
  };

  const setSchoolAndReset = (value: string) => {
    setSchool(value);
    setGrade("all");
  };

  const results = useMemo(
    () =>
      allPeople
        .filter((person) => (kind === "all" ? true : person.kind === kind))
        .filter((person) => (level === "all" ? true : schoolByName.get(person.school)?.level === level))
        .filter((person) => (school === "all" ? true : person.school === school))
        .filter((person) => (grade === "all" ? true : person.group === gradeLabel(grade)))
        .filter((person) =>
          query.trim() === ""
            ? true
            : `${person.name} ${person.group} ${person.school}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
        ),
    [allPeople, query, kind, level, school, grade]
  );

  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">User Management</h1>
          <p className="sf-page-sub">
            Individual profiles. Admin owns these records outright, so every section is editable
            here.
          </p>
        </div>

        <Button onClick={() => setIsAddingUser(true)}>Add User</Button>
      </div>

      <div className="sf-filter-bar">
        <label className="sf-field">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="Name, grade or school"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="sf-field">
          <span>Type</span>
          <Combobox
            items={KIND_OPTIONS}
            value={KIND_OPTIONS.find((option) => option.value === kind) ?? null}
            onValueChange={(option) => setKind((option?.value ?? "all") as PersonKind | "all")}
            isItemEqualToValue={isOptionEqual}
          >
            <ComboboxInput placeholder="All types" />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>

        <label className="sf-field">
          <span>Grade Level</span>
          <Combobox
            items={LEVEL_OPTIONS}
            value={LEVEL_OPTIONS.find((option) => option.value === level) ?? null}
            onValueChange={(option) => setLevelAndReset((option?.value ?? "all") as SchoolLevel | "all")}
            isItemEqualToValue={isOptionEqual}
          >
            <ComboboxInput placeholder="All grade levels" />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            items={schoolOptions}
            value={schoolOptions.find((option) => option.value === school) ?? null}
            onValueChange={(option) => setSchoolAndReset(option?.value ?? "all")}
            isItemEqualToValue={isOptionEqual}
          >
            <ComboboxInput placeholder="All schools" />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            items={gradeOptions}
            value={gradeOptions.find((option) => option.value === grade) ?? null}
            onValueChange={(option) => setGrade(option?.value ?? "all")}
            isItemEqualToValue={isOptionEqual}
            disabled={school === "all"}
          >
            <ComboboxInput placeholder="All grades" disabled={school === "all"} />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>

        <p className="sf-filter-note">
          {results.length} of {allPeople.length} people
          {/* The directory is a demo subset, not the district roster. */} · demo subset
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Results</h2>
          <span className="sf-panel-note">Select a name to open their 360 profile</span>
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="No matching people"
            message="Try a different name, or widen the type and school filters."
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">School</th>
                  <th scope="col">Grade / Department</th>
                  <th scope="col">Profile status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((person) => {
                  const profileStatus = deriveProfileStatus(person);

                  return (
                    <tr key={`${person.kind}-${person.id}`}>
                      <td>
                        <Link className="sf-bar-group-link" href={`/people/${person.kind}/${person.id}`}>
                          {person.name}
                        </Link>
                      </td>
                      <td>{person.kind === "student" ? "Student" : "Faculty"}</td>
                      <td>{person.school}</td>
                      <td>{person.group}</td>
                      <td>
                        <StatusBadge tone={PROFILE_STATUS_TONE[profileStatus]}>
                          {profileStatus}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddingUser ? (
        <AddUserModal
          onClose={() => setIsAddingUser(false)}
          onCreate={handleCreate}
          onCreateMany={createUsers}
        />
      ) : null}
    </section>
  );
}
