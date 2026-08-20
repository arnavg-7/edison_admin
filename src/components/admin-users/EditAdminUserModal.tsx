"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ADMIN_STATUS_LABELS,
  SECTION_LABELS,
  accessSummary,
  fullAccess,
  type AdminRole,
  type AdminScope,
  type AdminUser,
  type SectionAccessMap
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/base/buttons/button";
import { Switch } from "@/components/ui/switch";
import { configuredAccess, useRoleConfig } from "@/lib/role-config-store";
import { AccessGrid } from "./AccessGrid";
import { RoleCheckboxes } from "./RoleCheckboxes";
import { ScopeSelect } from "./ScopeSelect";

/**
 * Role, scope and active/inactive live here since they're this screen's own
 * concern. Password reset and the audit trail don't: there's no auth backend
 * to actually reset a password against, and the audit log is a shared,
 * district-wide record — duplicating a per-user slice of it here would give
 * this screen a second, divergent copy of history that already lives on
 * Data Privacy & Audit Log.
 */
export function EditAdminUserModal({
  user,
  onClose,
  grantable
}: {
  user: AdminUser;
  onClose: () => void;
  /** What the person editing is allowed to hand out. */
  grantable?: AdminRole[];
}) {
  const { updateUser } = useAdminUsers();
  const [roles, setRoles] = useState<AdminRole[]>(user.roles);
  const [access, setAccess] = useState<SectionAccessMap>(fullAccess(user.access));
  const [scope, setScope] = useState<AdminScope>(user.scope);
  const [resetRequested, setResetRequested] = useState(false);
  const { config } = useRoleConfig();

  /* Changing the roles refills the grid — the levels on screen belonged to the
     roles that were ticked, and those are no longer the roles. */
  const setRolesAndReset = (next: AdminRole[]) => {
    setRoles(next);
    setAccess(fullAccess(configuredAccess(config, next)));
  };

  /* Nothing here applies until Save. Role, scope and the grid are one change to
     what somebody can do on Monday, and a control that took effect on click
     would apply half of it. */
  const dirty =
    JSON.stringify(roles) !== JSON.stringify(user.roles) ||
    JSON.stringify(scope) !== JSON.stringify(user.scope) ||
    JSON.stringify(fullAccess(access)) !== JSON.stringify(fullAccess(user.access));

  const isInactive = user.status === "Inactive";
  const isInvited = user.status === "Invited";
  /* Whether this is a real sign-in-capable account. Active/Inactive is a
     two-state switch, so offering it for an account nobody has accepted yet
     would silently overwrite that status with one end of a toggle it was never
     part of — and there's no password to reset on an account nobody can use. */
  const isLiveAccount = !isInvited;

  const hasRoles = roles.length > 0;

  const save = () => {
    if (!hasRoles) return;
    updateUser(user.id, { roles, scope, access: fullAccess(access) });
    onClose();
  };

  const toggleActive = (checked: boolean) => {
    updateUser(user.id, { status: checked ? "Active" : "Inactive" });
  };

  const requestPasswordReset = () => {
    // TODO: no auth backend yet — this only flips a local confirmation, it
    // doesn't send anything. Wire to the real reset flow once one exists.
    setResetRequested(true);
  };

  return (
    <Modal title={`Edit ${user.name}`} onClose={onClose}>
      <p className="sf-panel-note">{user.email}</p>

      <RoleCheckboxes
        value={roles}
        onChange={setRolesAndReset}
        grantable={grantable}
        error={hasRoles ? undefined : "Select at least one role"}
      />

      <label className="sf-field">
        <span>Scope</span>
        <ScopeSelect value={scope} onChange={setScope} />
      </label>

      <div className="sf-field">
        <span>Access</span>
        <AccessGrid value={access} onChange={setAccess} disabled={!hasRoles} />
        <span className="sf-field-hint">
          {!hasRoles
            ? "Pick a role above to fill this in."
            : JSON.stringify(fullAccess(access)) === JSON.stringify(fullAccess(configuredAccess(config, roles)))
              ? "As the role grants it."
              : "Adjusted for this person — no longer exactly what the role grants."}
        </span>
      </div>

      {hasRoles ? (
        <p className="sf-panel-note" aria-live="polite">
          {accessSummary(user.name, access, SECTION_LABELS)}
        </p>
      ) : null}

      {isInvited ? (
        <p className="sf-card-hint">
          This invitation hasn&rsquo;t been accepted yet, so there is nothing to switch on or off.
          Resend or withdraw it on the Invited tab.
        </p>
      ) : (
        <label className="sf-switch-field">
          <span>
            <strong>{isInactive ? ADMIN_STATUS_LABELS.Inactive : ADMIN_STATUS_LABELS.Active}</strong>
            <span className="sf-panel-note">
              {isInactive ? "This person can't sign in." : "This person can sign in normally."}
            </span>
          </span>
          <Switch checked={!isInactive} onCheckedChange={toggleActive} />
        </label>
      )}

      <div className="sf-edit-panel-actions">
        <Button color="secondary" size="sm" onClick={requestPasswordReset} isDisabled={!isLiveAccount}>
          Force password reset
        </Button>
        {resetRequested ? (
          <span className="sf-panel-note">Reset requested. They&rsquo;ll be asked to set a new password next sign-in.</span>
        ) : null}
      </div>

      <Link className="sf-inline-link" href="/system-settings/audit-log">
        View this user&rsquo;s activity in Data Privacy &amp; Audit Log →
      </Link>

      <div className="list-editor-form-actions">
        {/* Disabled until something has actually changed, so the button is a
            statement about this form rather than a permanent offer. */}
        <Button size="sm" onClick={save} isDisabled={!hasRoles || !dirty}>
          {dirty ? "Save Changes" : "Saved"}
        </Button>
        <Button color="tertiary" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
