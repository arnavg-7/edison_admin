"use client";

import { useState } from "react";
import {
  blankAcademicFields,
  blankPersonalFields,
  newPersonId,
  type Person,
  type PersonKind
} from "@/lib/data/people";
import { gradeLabel, schools } from "@/lib/data/schools";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

const SAMPLE_CSV =
  "name,type,school,grade,status\n" +
  "Priya Nair,student,Edison High School,10,On Track\n" +
  "Sam Rivera,faculty,Edison Middle School,Science,On Track\n";

type ParsedRow = { line: number; person?: Person; error?: string };

/** Simple comma split — fine for the plain exports this template expects, not full RFC 4180. */
function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = cells[index] ?? "";
    });
    return row;
  });
}

function toPerson(row: Record<string, string>, line: number): ParsedRow {
  const name = row.name?.trim();
  const kindRaw = row.type?.trim().toLowerCase();
  const schoolName = row.school?.trim();
  const gradeRaw = row.grade?.trim();
  const statusRaw = row.status?.trim();

  if (!name) {
    return { line, error: "missing name" };
  }
  if (kindRaw !== "student" && kindRaw !== "faculty") {
    return { line, error: `type must be "student" or "faculty", got "${row.type ?? ""}"` };
  }
  const school = schools.find((entry) => entry.name.toLowerCase() === schoolName?.toLowerCase());
  if (!school) {
    return { line, error: `unknown school "${schoolName ?? ""}"` };
  }
  if (!gradeRaw) {
    return { line, error: kindRaw === "student" ? "missing grade" : "missing department" };
  }

  const kind = kindRaw as PersonKind;
  let group: string;

  if (kind === "student") {
    const normalizedGrade = gradeRaw.toUpperCase() === "K" ? "K" : gradeRaw.replace(/^grade\s*/i, "");
    if (!school.grades.includes(normalizedGrade)) {
      return { line, error: `grade "${gradeRaw}" is not offered at ${school.name}` };
    }
    group = gradeLabel(normalizedGrade);
  } else {
    group = gradeRaw;
  }

  const status: Person["status"] =
    statusRaw === "At Risk" || statusRaw === "On Track" || statusRaw === "Other" ? statusRaw : "On Track";

  return {
    line,
    person: {
      id: `${newPersonId(name)}-${line}`,
      kind,
      name,
      school: school.name,
      group,
      status,
      active: true,
      // Never signed in yet — these are brand new accounts.
      lastLogin: null,
      // Seeded blank so each imported profile opens with fields to complete,
      // and starts at Draft until the admin fills them in.
      personal: blankPersonalFields(kind),
      academic: blankAcademicFields(kind),
      alerts: []
    }
  };
}


function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "user-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk add — parsed and validated client-side, then created the same way as the
 * manual form. Imported profiles start at Draft and stay on this list rather
 * than opening one profile, since a bulk import has no single record to open.
 */
export function CsvUserImport({
  onBack,
  onImport
}: {
  onBack: () => void;
  onImport: (people: Person[]) => void;
}) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsvRows(text).map((row, index) => toPerson(row, index + 2));
    setRows(parsed);
    setFileName(file.name);
  };

  const validPeople = (rows ?? []).flatMap((row) => (row.person ? [row.person] : []));
  const errorCount = (rows ?? []).filter((row) => row.error).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto auto-rows-min">
      <p className="sf-panel-note">
        Columns: <code>name, type, school, grade, status</code>. Type is <code>student</code> or{" "}
        <code>faculty</code>; grade is a grade number (or <code>K</code>) for students, a department
        name for faculty; status defaults to On Track if left blank. School names must match an
        existing school exactly.
      </p>

      <button type="button" className="sf-inline-btn" onClick={downloadSample}>
        Download a sample CSV
      </button>

      <label className="sf-field">
        <span>CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleFile(file);
            }
          }}
        />
      </label>

      {rows ? (
        <div>
          <p className="sf-panel-note">
            {fileName}: {validPeople.length} ready to add
            {errorCount > 0 ? `, ${errorCount} skipped` : ""}
          </p>
          {rows.length > 0 ? (
            <ul className="sf-csv-row-list">
              {rows.map((row) => (
                <li key={row.line} className={row.error ? "is-error" : "is-ok"}>
                  <StatusBadge tone={row.error ? "error" : "ok"}>
                    {row.error ? "Skipped" : "Ready"}
                  </StatusBadge>
                  <span>
                    Line {row.line}: {row.person ? `${row.person.name} · ${row.person.school}` : row.error}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      </div>

      <div className="list-editor-form-actions list-editor-form-actions--drawer">
        <Button size="sm" isDisabled={validPeople.length === 0} onClick={() => onImport(validPeople)}>
          Add {validPeople.length > 0 ? validPeople.length : ""} User
          {validPeople.length === 1 ? "" : "s"}
        </Button>
        <Button color="secondary" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
