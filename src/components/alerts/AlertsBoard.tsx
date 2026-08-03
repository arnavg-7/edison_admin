"use client";

import { useMemo, useState } from "react";
import { studentAlerts, type StudentAlert } from "@/lib/data/alerts";
import { schools, gradeLabel } from "@/lib/data/schools";
import { AlertCard } from "./AlertCard";
import { AlertDetailsModal } from "./AlertDetailsModal";
import { CreateAlertModal } from "./CreateAlertModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";

function sortGrades(grades: string[]): string[] {
  return [...new Set(grades)].sort((a, b) => {
    if (a === "K") return -1;
    if (b === "K") return 1;
    return Number(a) - Number(b);
  });
}

const ALL_GRADES = sortGrades(schools.flatMap((school) => school.grades));

export function AlertsBoard() {
  const [alerts, setAlerts] = useState<StudentAlert[]>(studentAlerts);
  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const gradeOptions = schoolId
    ? sortGrades(schools.find((school) => school.id === schoolId)?.grades ?? [])
    : ALL_GRADES;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return alerts.filter((alert) => {
      if (schoolId && alert.schoolId !== schoolId) return false;
      if (grade && alert.grade !== grade) return false;
      if (term) {
        const haystack = `${alert.studentName} ${alert.description} ${alert.category}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [alerts, schoolId, grade, search]);

  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId) ?? null;
  const openCount = alerts.filter((alert) => alert.status === "Open").length;

  const resolveAlert = (id: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status: "Resolved",
              resolvedAt: new Date().toISOString(),
              resolvedBy: ADMIN_ROLE_LABEL
            }
          : alert
      )
    );
    setSelectedAlertId(null);
  };

  return (
    <>
      <div className="sf-filter-bar">
        <label className="sf-field">
          <span>School</span>
          <select
            value={schoolId}
            onChange={(event) => {
              setSchoolId(event.target.value);
              setGrade("");
            }}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <select value={grade} onChange={(event) => setGrade(event.target.value)}>
            <option value="">All grades</option>
            {gradeOptions.map((option) => (
              <option key={option} value={option}>
                {gradeLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span>Search</span>
          <input
            type="text"
            placeholder="Search by student or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button type="button" className="sf-btn sf-btn--primary" onClick={() => setIsCreating(true)}>
          Create Alert
        </button>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Current alerts</h2>
          <span className="sf-panel-note">
            {openCount} open · {filtered.length} shown of {alerts.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No alerts match these filters"
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
          onResolve={() => resolveAlert(selectedAlert.id)}
        />
      ) : null}

      {isCreating ? (
        <CreateAlertModal
          onClose={() => setIsCreating(false)}
          onCreate={(alert) => setAlerts((current) => [alert, ...current])}
        />
      ) : null}
    </>
  );
}
