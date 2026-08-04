"use client";

import { useState } from "react";
import Link from "next/link";
import { accessSummary, type AdminRoleAssignment, type AdminScope, type AdminUser } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
export function EditAdminUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { updateUser } = useAdminUsers();
  const [roles, setRoles] = useState<AdminRoleAssignment[]>(user.roles);
  const [scope, setScope] = useState<AdminScope>(user.scope);
  const [resetRequested, setResetRequested] = useState(false);

  const isInactive = user.status === "Inactive";
  const isPending = user.status === "Pending Invite";

  const hasRoles = roles.length > 0;

  const save = () => {
    if (!hasRoles) return;
    updateUser(user.id, { roles, scope });
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
        onChange={setRoles}
        error={hasRoles ? undefined : "Select at least one role"}
      />

      <label className="sf-field">
        <span>Scope</span>
        <ScopeSelect value={scope} onChange={setScope} />
      </label>

      {hasRoles ? (
        <p className="sf-panel-note" aria-live="polite">
          {accessSummary(user.name, roles)}
        </p>
      ) : null}

      {isPending ? (
        <p className="sf-card-hint">
          This invite hasn&rsquo;t been accepted yet. Activate/deactivate applies once they sign
          in. Use Pending Invitations to resend or revoke it instead.
        </p>
      ) : (
        <label className="sf-switch-field">
          <span>
            <strong>{isInactive ? "Inactive" : "Active"}</strong>
            <span className="sf-panel-note">
              {isInactive ? "This person can't sign in." : "This person can sign in normally."}
            </span>
          </span>
          <Switch checked={!isInactive} onCheckedChange={toggleActive} />
        </label>
      )}

      <div className="sf-edit-panel-actions">
        <button type="button" className="sf-btn sf-btn--sm" onClick={requestPasswordReset} disabled={isPending}>
          Force password reset
        </button>
        {resetRequested ? (
          <span className="sf-panel-note">Reset requested. They&rsquo;ll be asked to set a new password next sign-in.</span>
        ) : null}
      </div>

      <Link className="sf-inline-link" href="/system-settings/audit-log">
        View this user&rsquo;s activity in Data Privacy &amp; Audit Log →
      </Link>

      <div className="list-editor-form-actions">
        <Button onClick={save} disabled={!hasRoles}>
          Save Changes
        </Button>
        <button type="button" className="sf-btn sf-btn--quiet" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
