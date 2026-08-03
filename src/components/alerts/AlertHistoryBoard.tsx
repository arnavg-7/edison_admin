"use client";

import { useMemo, useState } from "react";
import { studentAlerts, type StudentAlert } from "@/lib/data/alerts";
import { schools, gradeLabel } from "@/lib/data/schools";
import { AlertCard } from "./AlertCard";
import { AlertDetailsModal } from "./AlertDetailsModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Combobox } from "@/components/shared/Combobox";

type ComboOption = { value: string; label: string };

function sortGrades(grades: string[]): string[] {
  return [...new Set(grades)].sort((a, b) => {
    if (a === "K") return -1;
    if (b === "K") return 1;
    return Number(a) - Number(b);
  });
}

const ALL_GRADES = sortGrades(schools.flatMap((school) => school.grades));

const ALL = "all";

/** Resolved alerts only — the "Alerts" tab is current/open by design, so this
    is where a closed alert's record (who resolved it, and when) lives. */
export function AlertHistoryBoard() {
  const [schoolId, setSchoolId] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [search, setSearch] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const gradeOptions = schoolId !== ALL
    ? sortGrades(schools.find((school) => school.id === schoolId)?.grades ?? [])
    : ALL_GRADES;

  const schoolComboOptions: ComboOption[] = [
    { value: ALL, label: "All schools" },
    ...schools.map((school) => ({ value: school.id, label: school.name }))
  ];

  const gradeComboOptions: ComboOption[] = [
    { value: ALL, label: "All grades" },
    ...gradeOptions.map((option) => ({ value: option, label: gradeLabel(option) }))
  ];

  const resolvedAlerts = useMemo(
    () => studentAlerts.filter((alert) => alert.status === "Resolved"),
    []
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resolvedAlerts.filter((alert) => {
      if (schoolId !== ALL && alert.schoolId !== schoolId) return false;
      if (grade !== ALL && alert.grade !== grade) return false;
      if (term) {
        const haystack = `${alert.studentName} ${alert.description} ${alert.category}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [resolvedAlerts, schoolId, grade, search]);

  const selectedAlert: StudentAlert | null =
    resolvedAlerts.find((alert) => alert.id === selectedAlertId) ?? null;

  return (
    <>
      <div className="sf-filter-bar">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by student or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={schoolComboOptions}
            value={schoolId}
            onChange={(next) => {
              setSchoolId(next);
              setGrade(ALL);
            }}
            placeholder="All schools"
          />
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeComboOptions}
            value={grade}
            onChange={setGrade}
            placeholder="All grades"
          />
        </label>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Resolved alerts</h2>
          <span className="sf-panel-note">
            {filtered.length} shown of {resolvedAlerts.length} resolved
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No resolved alerts match these filters"
            message="Try a different school, grade, or search term."
          />
        ) : (
          <div className="alert-cards">
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onOpen={() => setSelectedAlertId(alert.id)} />
            ))}
          </div>
        )}
      </div>

      {selectedAlert ? (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlertId(null)}
          onResolve={() => setSelectedAlertId(null)}
        />
      ) : null}
    </>
  );
}
