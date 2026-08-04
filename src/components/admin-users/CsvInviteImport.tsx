"use client";

import { useState } from "react";
import { schools } from "@/lib/data/schools";
import {
  ADMIN_ROLE_LABELS,
  FIXED_ROLE_PERMISSION,
  defaultRolePermission,
  newAdminUserId,
  type AdminRole,
  type AdminRoleAssignment,
  type AdminUser
} from "@/lib/data/adminUsers";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

const ROLE_KEYS: Record<string, AdminRole> = {
  leadership: "leadership",
  portal_administrator: "portal_administrator",
  "portal administrator": "portal_administrator",
  it_administrator: "it_administrator",
  "it administrator": "it_administrator"
};

const SAMPLE_CSV =
  "name,email,roles,scope\n" +
  'Dana Whitfield,dwhitfield@edison.example.org,"leadership;portal_administrator:edit",Edison High School\n' +
  "Sam Rivera,srivera@edison.example.org,it_administrator:view,district\n";

/**
 * `it_administrator:view` — the optional `:view`/`:edit` suffix sets that
 * role's permission level. Omitted, it falls back to the same default the
 * manual form uses, so pre-permission CSVs still import.
 */
function parseRoleEntry(raw: string): AdminRoleAssignment | null {
  const [roleRaw, levelRaw] = raw.split(":").map((part) => part.trim());
  const role = ROLE_KEYS[roleRaw];
  if (!role) return null;

  const fixed = FIXED_ROLE_PERMISSION[role];
  if (fixed) return { role, permission: fixed };

  if (!levelRaw) return { role, permission: defaultRolePermission(role) };
  if (levelRaw === "view" || levelRaw === "view only") return { role, permission: "view" };
  if (levelRaw === "edit" || levelRaw === "can edit") return { role, permission: "edit" };
  return null;
}

type ParsedRow = { line: number; user?: AdminUser; error?: string };

/** Simple comma split — fine for the plain exports this template expects, not full RFC 4180. */
function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((cell) => cell.trim().toLowerCase().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    // Quoted cells (for the "a;b" roles list) may contain commas-free content
    // here, but keep the same simple splitter the People CSV import uses.
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = cells[index] ?? "";
    });
    return row;
  });
}

function toAdminUser(row: Record<string, string>, line: number): ParsedRow {
  const name = row.name?.trim();
  const email = row.email?.trim();
  const rolesRaw = row.roles?.trim();
  const scopeRaw = row.scope?.trim();

  if (!name) return { line, error: "missing name" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { line, error: `invalid email "${email ?? ""}"` };
  }
  if (!rolesRaw) return { line, error: "missing roles" };

  const roles = rolesRaw
    .split(/[;|]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .map(parseRoleEntry);

  if (roles.length === 0 || roles.some((role) => !role)) {
    return {
      line,
      error: `roles must be one or more of ${Object.values(ADMIN_ROLE_LABELS).join(", ")}, separated by ";", each optionally suffixed ":view" or ":edit"`
    };
  }

  let scope: AdminUser["scope"] = { type: "district" };
  if (scopeRaw && scopeRaw.toLowerCase() !== "district") {
    const school = schools.find((entry) => entry.name.toLowerCase() === scopeRaw.toLowerCase());
    if (!school) return { line, error: `unknown school "${scopeRaw}"` };
    scope = { type: "school", schoolId: school.id };
  }

  return {
    line,
    user: {
      id: `${newAdminUserId(name)}-${line}`,
      name,
      email,
      roles: roles as AdminRoleAssignment[],
      scope,
      status: "Pending Invite",
      lastLogin: null,
      dateAdded: new Date().toISOString(),
      invitedBy: ADMIN_ROLE_LABEL
    }
  };
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "admin-invite-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk invite — parsed and validated client-side, same shape as the manual
 * form. Useful at school-year start/end when a batch of admins turns over at
 * once rather than one at a time.
 */
export function CsvInviteImport({
  onBack,
  onImport
}: {
  onBack: () => void;
  onImport: (users: AdminUser[]) => void;
}) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsvRows(text).map((row, index) => toAdminUser(row, index + 2));
    setRows(parsed);
    setFileName(file.name);
  };

  const validUsers = (rows ?? []).flatMap((row) => (row.user ? [row.user] : []));
  const errorCount = (rows ?? []).filter((row) => row.error).length;

  return (
    <>
      <p className="sf-panel-note">
        Columns: <code>name, email, roles, scope</code>. Roles are one or more of{" "}
        <code>leadership</code>, <code>portal_administrator</code>, <code>it_administrator</code>,
        separated by <code>;</code>. Add <code>:view</code> or <code>:edit</code> to a role to set
        its permission level (defaults to edit; Leadership is always view only). Scope is{" "}
        <code>district</code> or an exact school name, and applies to every role on the account.
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
            if (file) handleFile(file);
          }}
        />
      </label>

      {rows ? (
        <div>
          <p className="sf-panel-note">
            {fileName}: {validUsers.length} ready to invite
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
                    Line {row.line}: {row.user ? `${row.user.name} · ${row.user.email}` : row.error}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="list-editor-form-actions">
        <Button
          size="sm"
          isDisabled={validUsers.length === 0}
          onClick={() => onImport(validUsers)}
          iconLeading={<HugeiconsIcon icon={MailAdd01Icon} strokeWidth={2} className="size-4 shrink-0" />}
        >
          Invite {validUsers.length > 0 ? validUsers.length : ""} User
          {validUsers.length === 1 ? "" : "s"}
        </Button>
        <Button color="secondary" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
    </>
  );
}
