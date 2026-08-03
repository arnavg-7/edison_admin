"use client";

import { useState } from "react";
import { newAdminUserId, type AdminRole, type AdminScope, type AdminUser } from "@/lib/data/adminUsers";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { RoleCheckboxes } from "./RoleCheckboxes";
import { ScopeSelect } from "./ScopeSelect";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends an invite rather than creating a live account: the new record starts
 * at Pending Invite and only becomes Active once they accept it (there's no
 * real auth backend yet, so "accepting" isn't modeled — it stays Pending
 * until an admin flips it from the edit panel).
 */
export function ManualInviteForm({
  onBack,
  onCancel,
  onInvite
}: {
  onBack: () => void;
  onCancel: () => void;
  onInvite: (user: AdminUser) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [scope, setScope] = useState<AdminScope>({ type: "district" });

  const canSave = name.trim() !== "" && EMAIL_PATTERN.test(email.trim()) && roles.length > 0;

  const send = () => {
    if (!canSave) return;

    onInvite({
      id: newAdminUserId(name),
      name: name.trim(),
      email: email.trim(),
      roles,
      scope,
      status: "Pending Invite",
      lastLogin: null,
      dateAdded: new Date().toISOString(),
      invitedBy: ADMIN_ROLE_LABEL
    });
  };

  return (
    <>
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
      </label>

      <RoleCheckboxes value={roles} onChange={setRoles} />

      <label className="sf-field">
        <span>Scope</span>
        <ScopeSelect value={scope} onChange={setScope} />
      </label>

      <p className="sf-panel-note">
        They&rsquo;ll get an email invite. The account stays Pending until they accept it.
      </p>

      <div className="list-editor-form-actions">
        <Button onClick={send} disabled={!canSave}>
          Send Invite
        </Button>
        <button type="button" className="sf-btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="sf-btn sf-btn--quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}
