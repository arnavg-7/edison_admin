"use client";

import { useMemo, useState } from "react";
import { studentAlerts, type StudentAlert } from "@/lib/data/alerts";
import { schools, gradeLabel } from "@/lib/data/schools";
import { AlertCard } from "./AlertCard";
import { AlertDetailsModal } from "./AlertDetailsModal";
import { CreateAlertModal } from "./CreateAlertModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";

function sortGrades(grades: string[]): string[] {
  return [...new Set(grades)].sort((a, b) => {
    if (a === "K") return -1;
    if (b === "K") return 1;
    return Number(a) - Number(b);
  });
}

const ALL_GRADES = sortGrades(schools.flatMap((school) => school.grades));

/** Base UI's Select treats value="" as "nothing selected" and never renders
    its label, so "All X" — a real, persistent filter state — needs a
    non-empty sentinel instead. */
const ALL = "all";

export function AlertsBoard() {
  const [alerts, setAlerts] = useState<StudentAlert[]>(studentAlerts);
  const [schoolId, setSchoolId] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [search, setSearch] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const gradeOptions = schoolId !== ALL
    ? sortGrades(schools.find((school) => school.id === schoolId)?.grades ?? [])
    : ALL_GRADES;

  const openAlerts = useMemo(() => alerts.filter((alert) => alert.status === "Open"), [alerts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return openAlerts.filter((alert) => {
      if (schoolId !== ALL && alert.schoolId !== schoolId) return false;
      if (grade !== ALL && alert.grade !== grade) return false;
      if (term) {
        const haystack = `${alert.studentName} ${alert.description} ${alert.category}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [openAlerts, schoolId, grade, search]);

  const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId) ?? null;

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
          <Select
            value={schoolId}
            onValueChange={(value) => {
              setSchoolId(value ?? ALL);
              setGrade(ALL);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Select value={grade} onValueChange={(value) => setGrade(value ?? ALL)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All grades</SelectItem>
              {gradeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {gradeLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <Button onClick={() => setIsCreating(true)}>Create Alert</Button>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Current alerts</h2>
          <span className="sf-panel-note">
            {filtered.length} shown of {openAlerts.length} open
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
