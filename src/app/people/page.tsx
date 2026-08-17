"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Download01Icon, PencilEdit02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { people as seededPeople, type Person, type PersonKind } from "@/lib/data/people";
import { SCHOOL_LEVELS, gradeLabel, schools, type SchoolLevel } from "@/lib/data/schools";
import { useUsers } from "@/lib/users-store";
import { useAdminScope } from "@/lib/admin-scope";
import { useMounted } from "@/lib/use-mounted";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddUserModal } from "@/components/people/AddUserModal";
import { Button } from "@/components/base/buttons/button";
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
  const { users: storedPeople, createUser, createUsers } = useUsers();
  const { school: scopedSchool } = useAdminScope();
  const mounted = useMounted();

  // Seed until this page hydrates — see useMounted.
  const everyone = mounted ? storedPeople : seededPeople;
  /* A school admin's directory is their school's. Filtered before anything else
     reads it, so the count, the pager and the CSV export all agree — an export
     that quietly held five schools' people would be the worst of the three. */
  const allPeople = useMemo(
    () => (scopedSchool ? everyone.filter((person) => person.school === scopedSchool.name) : everyone),
    [everyone, scopedSchool]
  );

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
  /* Scoped: the school step is already answered, so Grade reads straight off it
     rather than waiting for a picker that is not on the page. */
  const effectiveSchool = scopedSchool ? scopedSchool.name : school;
  const gradesForSchool = scopedSchool
    ? scopedSchool.grades
    : school === "all"
      ? []
      : (schoolByName.get(school)?.grades ?? []);

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
        .filter((person) => (effectiveSchool === "all" ? true : person.school === effectiveSchool))
        .filter((person) => (grade === "all" ? true : person.group === gradeLabel(grade)))
        .filter((person) =>
          query.trim() === ""
            ? true
            : `${person.name} ${person.group} ${person.school}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
        ),
    [allPeople, query, kind, level, effectiveSchool, grade]
  );

  // A new filter/search can shrink the result set past the page the admin was
  // on, so every change starts back at page 1 rather than showing an empty page.
  useEffect(() => {
    setPage(1);
  }, [query, kind, level, effectiveSchool, grade]);

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

        <Button
          size="sm"
          onClick={() => setIsAddingUser(true)}
          iconLeading={<HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />}
        >
          Add Student/Faculty
        </Button>
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

        {/* Grade Level and School only exist to get you down to one school. A
            school admin is already there, so both come off entirely — the
            sidebar says which school this is, and a fixed-value field would be
            one more thing to read past on the way to the filters that do work. */}
        {scopedSchool ? null : (
          <>
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
          </>
        )}

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeOptions}
            value={grade}
            onChange={setGrade}
            placeholder="All grades"
            disabled={!scopedSchool && school === "all"}
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
              color="secondary"
              size="sm"
              onClick={() => downloadResultsCsv(results)}
              isDisabled={results.length === 0}
              iconLeading={<HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="size-4 shrink-0" />}
            >
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
            {/* table-layout: fixed + a colgroup, not the shared table's default
                auto layout: auto sizes every column from whichever rows are on
                the current page, so Page 1's longer names ("Naphisabet
                Lyngkhoi") and Page 2's shorter ones ("K. Blekeski") produced a
                visibly different column layout for the same table depending on
                which page you were on. Fixed percentages, set once from the
                widest page's natural proportions, hold steady across every
                page instead. */}
            <table className="sf-table sf-table--fixed">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "19%" }} />
              </colgroup>
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
                          {/* Icons carry the row actions at a glance — down a
                              long list the eye/pencil pair is picked out faster
                              than two similar-length words. Labels stay: the
                              actions are one click from editing a real person's
                              record, not somewhere to make an icon-only guess. */}
                          <Button
                            color="secondary"
                            size="xs"
                            href={href}
                            iconLeading={
                              <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
                            }
                          >
                            View
                          </Button>
                          {/* Solid accent, not secondary like View beside it —
                              the two need to read as different actions, not a
                              pair of identical gray buttons. (Button's base
                              class reserves border-width for every color now,
                              solid included, so this stays the same height as
                              View instead of 2px shorter.) */}
                          <Button
                            size="xs"
                            href={href}
                            iconLeading={
                              <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />
                            }
                          >
                            Edit
                          </Button>
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
