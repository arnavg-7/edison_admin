"use client";

import { useState } from "react";
import {
  ADMIN_ROLE_GRANTS,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  INSTITUTIONAL_DOMAINS_LABEL,
  isEmailShaped,
  isInstitutionalEmail,
  nameFromEmail,
  newAdminUserId,
  roleNeedsSchool,
  type AdminRole,
  type AdminUser
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { schools } from "@/lib/data/schools";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

/**
 * Attach a role to an address the district has already issued, and send the
 * invitation.
 *
 * The order of the fields is the order of the decisions: which mailbox, then
 * what that person may do, then — only if the role needs one — which school.
 * The grant summary is the last thing before the button because it is what the
 * admin is actually agreeing to, and it is generated from the role rather than
 * written here, so it cannot drift from what the role really allows.
 *
 * Editing an existing account uses the same form minus the address: the mailbox
 * is the account's identity, and moving a role to a different person is a new
 * invitation rather than an edit.
 */
export function InviteUserDrawer({
  user,
  invitedBy,
  onClose
}: {
  /** Present when editing; absent when inviting someone new. */
  user?: AdminUser;
  invitedBy: string;
  onClose: () => void;
}) {
  const { adminUsers, addUser, updateUser, sendInvite } = useAdminUsers();
  const editing = user !== undefined;

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<AdminRole>(user?.role ?? "school_admin");
  const [schoolId, setSchoolId] = useState(
    user?.scope.type === "school" ? user.scope.schoolId : ""
  );

  const trimmedEmail = email.trim().toLowerCase();
  const needsSchool = roleNeedsSchool(role);

  /* Three separate failures with three separate fixes, so they are three
     separate messages rather than one "invalid email". */
  const emailError = editing
    ? null
    : trimmedEmail === ""
      ? null
      : !isEmailShaped(trimmedEmail)
        ? "That is not a complete email address."
        : !isInstitutionalEmail(trimmedEmail)
          ? `Admin access needs a district address — ${INSTITUTIONAL_DOMAINS_LABEL}. A personal mailbox cannot be shut off when someone leaves.`
          : adminUsers.some((entry) => entry.email.toLowerCase() === trimmedEmail)
            ? "That address already has an account. Edit it instead of inviting again."
            : null;

  const canSave =
    (editing || (trimmedEmail !== "" && emailError === null)) &&
    name.trim() !== "" &&
    (!needsSchool || schoolId !== "");

  const save = () => {
    if (!canSave) return;

    const scope = needsSchool
      ? ({ type: "school", schoolId } as const)
      : ({ type: "district" } as const);

    if (editing) {
      updateUser(user.id, { name: name.trim(), role, scope });
      onClose();
      return;
    }

    const id = newAdminUserId(name);
    addUser({
      id,
      name: name.trim(),
      email: trimmedEmail,
      role,
      scope,
      status: "Invited",
      lastLogin: null,
      dateAdded: new Date().toISOString(),
      invitedBy,
      inviteSentAt: null,
      inviteSends: 0
    });
    // Stamps the send and counts it, so the row shows a real invitation rather
    // than a status somebody set.
    sendInvite(id);
    onClose();
  };

  const grants = ADMIN_ROLE_GRANTS[role];
  const schoolName = schools.find((school) => school.id === schoolId)?.name;

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit access" : "Invite an admin"}</SheetTitle>
          <SheetDescription>
            {editing
              ? "Change the role or the school. The address stays as it is — it is the account."
              : "The mailbox is created in the district directory first. Attach a role to it here."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="list-editor-form list-editor-form--drawer">
            <label className="sf-field">
              <span>District email</span>
              <input
                type="email"
                autoFocus={!editing}
                value={email}
                disabled={editing}
                placeholder={`name${INSTITUTIONAL_DOMAINS_LABEL.split(" or ")[0]}`}
                onChange={(event) => {
                  setEmail(event.target.value);
                  /* Fills the name from the address, but only while it is
                     untouched — an admin who typed a name should not have it
                     overwritten by the next keystroke in the field above. */
                  if (name.trim() === "" || name === nameFromEmail(email)) {
                    setName(nameFromEmail(event.target.value));
                  }
                }}
              />
              {emailError ? <span className="sf-field-error">{emailError}</span> : null}
            </label>

            <label className="sf-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                placeholder="As it should appear in the portal"
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="sf-field">
              <span>Role</span>
              <Combobox
                options={ADMIN_ROLE_ORDER.map((entry) => ({
                  value: entry,
                  label: ADMIN_ROLE_LABELS[entry]
                }))}
                value={role}
                onChange={(next) => setRole(next as AdminRole)}
              />
            </label>

            {needsSchool ? (
              <label className="sf-field">
                <span>School</span>
                <Combobox
                  options={schools.map((school) => ({ value: school.id, label: school.name }))}
                  value={schoolId}
                  onChange={setSchoolId}
                  placeholder="Select a school"
                />
              </label>
            ) : null}

            {/* Generated from the role, so what an admin reads here is what the
                role actually grants rather than a description of it. */}
            <div className="role-grant">
              <p className="role-grant-head">
                {ADMIN_ROLE_LABELS[role]}
                <span>{needsSchool ? (schoolName ?? grants.reach) : grants.reach}</span>
              </p>
              <ul>
                {grants.grants.map((line) => (
                  <li className="is-granted" key={line}>
                    {line}
                  </li>
                ))}
                {grants.denies.map((line) => (
                  <li className="is-denied" key={line}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            {editing ? "Save changes" : "Send invitation"}
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
