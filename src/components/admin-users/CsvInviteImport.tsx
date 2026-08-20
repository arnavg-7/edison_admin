"use client";

import { useState } from "react";
import { schools } from "@/lib/data/schools";
import {
  ADMIN_ROLE_LABELS,
  INSTITUTIONAL_DOMAINS_LABEL,
  isEmailShaped,
  isInstitutionalEmail,
  fullAccess,
  newAdminUserId,
  presetAccess,
  type AdminRole,
  type AdminUser
} from "@/lib/data/adminUsers";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InstitutionalEmailDialog } from "./InstitutionalEmailDialog";

/* The roles a sheet may name, including what they were called before: a file
   written against the old role names still loads, and lands on the role that
   replaced it rather than being skipped as unrecognised. */
const ROLE_KEYS: Record<string, AdminRole> = {
  super_admin: "super_admin",
  "super admin": "super_admin",
  school_admin: "school_admin",
  "school admin": "school_admin",
  leadership: "leadership",
  portal_administrator: "school_admin",
  "portal administrator": "school_admin",
  it_administrator: "super_admin",
  "it administrator": "super_admin"
};

const SAMPLE_CSV =
  "name,email,roles,scope\n" +
  'Dana Whitfield,dwhitfield@edison.example.org,"leadership;portal_administrator",Edison High School\n' +
  "Sam Rivera,srivera@edison.example.org,it_administrator,district\n";

/**
 * A role name, and nothing else.
 *
 * `it_administrator:view` used to be accepted, back when a role carried a level.
 * Access is now a grid on the account, seeded from the roles named here — so a
 * suffix is read and ignored rather than failing the row. A bulk upload grants
 * exactly what the roles grant; anything narrower is a per-person decision, and
 * a spreadsheet is not where those get made.
 */
function parseRoleEntry(raw: string): AdminRole | null {
  const [roleRaw] = raw.split(":").map((part) => part.trim());
  return ROLE_KEYS[roleRaw] ?? null;
}

type ParsedRow = {
  line: number;
  user?: AdminUser;
  error?: string;
  /** Set when the row was skipped for being off-domain, so the popup can list it. */
  rejectedEmail?: string;
};

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
  if (!email || !isEmailShaped(email)) {
    return { line, error: `invalid email "${email ?? ""}"` };
  }
  /* Same rule the manual invite enforces — a bulk upload is the likeliest way
     for a personal address to slip in unnoticed. */
  if (!isInstitutionalEmail(email)) {
    return { line, error: `"${email}" is not on ${INSTITUTIONAL_DOMAINS_LABEL}`, rejectedEmail: email };
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
      error: `roles must be one or more of ${Object.values(ADMIN_ROLE_LABELS).join(", ")}, separated by ";"`
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
      roles: roles as AdminRole[],
      /* The roles' own grid, exactly. A bulk upload is the same grant the role
         defines; narrowing one person is done on that person. */
      access: fullAccess(presetAccess(roles as AdminRole[])),
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
  const [rejectedEmails, setRejectedEmails] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsvRows(text).map((row, index) => toAdminUser(row, index + 2));
    setRows(parsed);
    setFileName(file.name);
    /* Surfaced up front rather than left to be spotted in the per-row list: an
       off-domain address is a rule the uploader may not know about, unlike a
       typo'd role or school name that the row's own error explains. */
    setRejectedEmails(parsed.flatMap((row) => (row.rejectedEmail ? [row.rejectedEmail] : [])));
  };

  const validUsers = (rows ?? []).flatMap((row) => (row.user ? [row.user] : []));
  const errorCount = (rows ?? []).filter((row) => row.error).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto auto-rows-min">
      <p className="sf-panel-note">
        Columns: <code>name, email, roles, scope</code>. Roles are one or more of{" "}
        <code>leadership</code>, <code>portal_administrator</code>, <code>it_administrator</code>,
        separated by <code>;</code>. Each role carries its own access level — see Roles &amp;
        Permissions — so there is nothing to set per row. Scope is <code>district</code> or an
        exact school name, and applies to every role on the account. Every email must be a
        district institutional address ({INSTITUTIONAL_DOMAINS_LABEL}).
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
      </div>

      <div className="list-editor-form-actions list-editor-form-actions--drawer">
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

      {rejectedEmails.length > 0 ? (
        <InstitutionalEmailDialog emails={rejectedEmails} onClose={() => setRejectedEmails([])} />
      ) : null}
    </div>
  );
}
