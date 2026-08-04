"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { type Person, type PersonKind } from "@/lib/data/people";
import { SCHOOL_LEVELS, gradeLabel, schools, type SchoolLevel } from "@/lib/data/schools";
import { useUsers } from "@/lib/users-store";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddUserModal } from "@/components/people/AddUserModal";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

const schoolByName = new Map(schools.map((school) => [school.name, school]));

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Exports exactly what's on screen — the current search/filter results, not the whole roster. */
function downloadResultsCsv(results: Person[]) {
  const header = ["Name", "Type", "School", "Grade / Department", "Status", "Last Login"];
  const rows = results.map((person) => [
    person.name,
    person.kind === "student" ? "Student" : "Faculty",
    person.school,
    person.group,
    person.active ? "Active" : "Inactive",
    person.lastLogin ? formatDateTime(person.lastLogin) : ""
  ]);
  const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-faculty-360.csv";
  link.click();
  URL.revokeObjectURL(url);
}

type ComboOption = ComboboxOption;

const KIND_OPTIONS: ComboOption[] = [
  { value: "all", label: "Students and faculty" },
  { value: "student", label: "Students" },
  { value: "faculty", label: "Faculty" }
];

const LEVEL_OPTIONS: ComboOption[] = [
  { value: "all", label: "All grade levels" },
  ...SCHOOL_LEVELS.map((option) => ({ value: option.value, label: option.label }))
];

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);

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

  // A new filter/search can shrink the result set past the page the admin was
  // on, so every change starts back at page 1 rather than showing an empty page.
  useEffect(() => {
    setPage(1);
  }, [query, kind, level, school, grade]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="sf-main sf-main--footer-bar">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">Student &amp; Faculty 360</h1>
          <p className="sf-page-sub">
            Individual profiles. Admin can edit personal details, goals, skills profile, development
            areas and alert history; enrollment, grades, attendance and classes are read-only.
          </p>
        </div>

        <Button onClick={() => setIsAddingUser(true)}>Add User</Button>
      </div>

      <div className="sf-filter-bar sf-filter-bar--flush sf-filter-bar--top-spaced">
        <label className="sf-field sf-field--search">
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
            options={KIND_OPTIONS}
            value={kind}
            onChange={(next) => setKind(next as PersonKind | "all")}
            placeholder="All types"
          />
        </label>

        <label className="sf-field">
          <span>Grade Level</span>
          <Combobox
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(next) => setLevelAndReset(next as SchoolLevel | "all")}
            placeholder="All grade levels"
          />
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={schoolOptions}
            value={school}
            onChange={setSchoolAndReset}
            placeholder="All schools"
          />
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeOptions}
            value={grade}
            onChange={setGrade}
            placeholder="All grades"
            disabled={school === "all"}
          />
        </label>

        <p className="sf-filter-note">
          {results.length} of {allPeople.length} people
          {/* The directory is a demo subset, not the district roster. */} · demo subset
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Results</h2>
          <div className="sf-row-actions">
            {/* Full CTA size, but `outline` rather than the solid accent: the
                page's primary action is Add User in the header, and two solid
                accent buttons on one screen would compete for it. */}
            <Button
              variant="outline"
              onClick={() => downloadResultsCsv(results)}
              disabled={results.length === 0}
            >
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
              Download CSV
            </Button>
          </div>
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
                  <th scope="col">Status</th>
                  <th scope="col">Last Login</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedResults.map((person) => {
                  const href = `/people/${person.kind}/${person.id}`;

                  return (
                    <tr key={`${person.kind}-${person.id}`}>
                      <td>
                        <Link className="sf-bar-group-link" href={href}>
                          {person.name}
                        </Link>
                      </td>
                      <td>{person.kind === "student" ? "Student" : "Faculty"}</td>
                      <td>{person.school}</td>
                      <td>{person.group}</td>
                      <td>
                        <StatusBadge tone={person.active ? "ok" : "neutral"}>
                          {person.active ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>
                      <td>{person.lastLogin ? formatDateTime(person.lastLogin) : "—"}</td>
                      <td>
                        <div className="sf-row-actions">
                          <Link className="sf-btn sf-btn--sm" href={href}>
                            View
                          </Link>
                          <Link className="sf-btn sf-btn--sm sf-btn--primary" href={href}>
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outside the results panel: page controls live in the page's bottom
          area, not inside the table card. */}
      {results.length > 0 ? (
        <div className="sf-pagination-bar">
          <p className="sf-panel-note">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(currentPage * PAGE_SIZE, results.length)} of {results.length}
          </p>

          <Pagination className="sf-pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((current) => Math.max(1, current - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={currentPage === pageCount}
                  className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((current) => Math.min(pageCount, current + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

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
