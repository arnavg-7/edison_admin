"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { people, type PersonKind } from "@/lib/data/people";
import { SCHOOL_LEVELS, gradeLabel, schools, type SchoolLevel } from "@/lib/data/schools";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

const schoolByName = new Map(schools.map((school) => [school.name, school]));

/** Search and browse, then open an individual profile. */
export default function PeopleSearchPage() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PersonKind | "all">("all");
  const [level, setLevel] = useState<SchoolLevel | "all">("all");
  const [school, setSchool] = useState("all");
  const [grade, setGrade] = useState("all");

  // Cascade: Grade Level -> School -> Grade. Each step's options come from the
  // step before it, and picking a new value upstream clears everything downstream
  // so the UI can never be left pointing at an impossible combination.
  const schoolsForLevel = level === "all" ? schools : schools.filter((s) => s.level === level);
  const gradesForSchool = school === "all" ? [] : (schoolByName.get(school)?.grades ?? []);

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
      people
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
    [query, kind, level, school, grade]
  );

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">User Management</h1>
      <p className="sf-page-sub">
        Individual profiles. Records owned by Salesforce are read-only here and link out to the
        source.
      </p>

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
          <select value={kind} onChange={(event) => setKind(event.target.value as PersonKind | "all")}>
            <option value="all">Students and faculty</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
          </select>
        </label>

        <label className="sf-field">
          <span>Grade Level</span>
          <select
            value={level}
            onChange={(event) => setLevelAndReset(event.target.value as SchoolLevel | "all")}
          >
            <option value="all">All grade levels</option>
            {SCHOOL_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span>School</span>
          <select value={school} onChange={(event) => setSchoolAndReset(event.target.value)}>
            <option value="all">All schools</option>
            {schoolsForLevel.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            disabled={school === "all"}
          >
            <option value="all">All grades</option>
            {gradesForSchool.map((value) => (
              <option key={value} value={value}>
                {gradeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <p className="sf-filter-note">
          {results.length} of {people.length} people
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
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((person) => (
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
                      <StatusBadge tone={person.status === "At Risk" ? "warn" : "ok"}>
                        {person.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
