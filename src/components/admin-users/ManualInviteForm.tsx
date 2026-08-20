"use client";

import { useState } from "react";
import {
  INSTITUTIONAL_DOMAINS_LABEL,
  SECTION_LABELS,
  accessSummary,
  fullAccess,
  isEmailShaped,
  isInstitutionalEmail,
  matchesPreset,
  newAdminUserId,
  presetAccess,
  type AdminRole,
  type AdminScope,
  type AdminUser,
  type SectionAccessMap
} from "@/lib/data/adminUsers";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { AccessGrid } from "./AccessGrid";
import { RoleCheckboxes } from "./RoleCheckboxes";
import { ScopeSelect } from "./ScopeSelect";
import { InstitutionalEmailDialog } from "./InstitutionalEmailDialog";

/**
 * Sends an invite rather than creating a live account: the new record starts
 * at Pending Invite and only becomes Active once they accept it (there's no
 * real auth backend yet, so "accepting" isn't modeled — it stays Pending
 * until an admin flips it from the edit panel).
 */
export function ManualInviteForm({
  onBack,
  onInvite,
  grantable
}: {
  onBack: () => void;
  onInvite: (user: AdminUser) => void;
  /** What the person sending this invite is allowed to hand out. */
  grantable?: AdminRole[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [access, setAccess] = useState<SectionAccessMap>({});
  const [scope, setScope] = useState<AdminScope>({ type: "district" });
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);

  /* Changing the roles refills the grid. Anything already adjusted goes with
     it, which is the honest behaviour: the levels on screen belonged to the
     roles that were ticked, and those are no longer the roles. */
  const setRolesAndReset = (next: AdminRole[]) => {
    setRoles(next);
    setAccess(fullAccess(presetAccess(next)));
  };

  const hasRoles = roles.length > 0;
  /* The institutional-domain rule is deliberately not folded in here: a
     disabled Send can't say why, and "looks like an email but isn't ours" is
     exactly the case that needs explaining, so Send stays live and the popup
     does the explaining. */
  const canSave = name.trim() !== "" && isEmailShaped(email) && hasRoles;
  const summary = accessSummary(name, access, SECTION_LABELS);

  const send = () => {
    if (!canSave) return;

    if (!isInstitutionalEmail(email)) {
      setRejectedEmail(email.trim());
      return;
    }

    onInvite({
      id: newAdminUserId(name),
      name: name.trim(),
      email: email.trim(),
      roles,
      access: fullAccess(access),
      scope,
      status: "Pending Invite",
      lastLogin: null,
      dateAdded: new Date().toISOString(),
      invitedBy: ADMIN_ROLE_LABEL
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto auto-rows-min">
      <label className="sf-field">
        <span>Full name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Priya Nair"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="sf-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          placeholder="e.g. pnair@edison.example.org"
          onChange={(event) => setEmail(event.target.value)}
        />
        {/* Inside the label, so it's part of the field's accessible name rather
            than copy a screen reader has to go looking for. */}
        <span className="sf-field-hint">
          Must be a district institutional address ({INSTITUTIONAL_DOMAINS_LABEL}).
        </span>
      </label>

      <RoleCheckboxes
        value={roles}
        onChange={setRolesAndReset}
        grantable={grantable}
        error={hasRoles ? undefined : "Select at least one role"}
      />

      {/* Scope is deliberately outside the role group: it applies across every
          role the account holds, not per role. */}
      <label className="sf-field">
        <span>Scope</span>
        <ScopeSelect value={scope} onChange={setScope} />
      </label>

      <div className="sf-field">
        <span>Access</span>
        <AccessGrid value={access} onChange={setAccess} disabled={!hasRoles} />
        <span className="sf-field-hint">
          {hasRoles
            ? matchesPreset(roles, access)
              ? "As the role grants it. Change any row to give this person something different."
              : "Adjusted for this person — no longer exactly what the role grants."
            : "Pick a role above to fill this in."}
        </span>
      </div>

      <p className="sf-panel-note" aria-live="polite">
        {hasRoles ? `${summary} ` : ""}
        They&rsquo;ll get an email invite. The account stays Pending until they accept it.
      </p>
      </div>

      <div className="list-editor-form-actions list-editor-form-actions--drawer">
        <Button
          size="sm"
          onClick={send}
          isDisabled={!canSave}
          iconLeading={<HugeiconsIcon icon={MailAdd01Icon} strokeWidth={2} className="size-4 shrink-0" />}
        >
          Send Invite
        </Button>
        {/* No Cancel button: Back is the only other move from here, and the
            modal's own ✕ already dismisses. */}
        <Button color="secondary" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      {rejectedEmail ? (
        <InstitutionalEmailDialog emails={[rejectedEmail]} onClose={() => setRejectedEmail(null)} />
      ) : null}
    </div>
  );
}
