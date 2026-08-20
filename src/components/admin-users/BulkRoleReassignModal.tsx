"use client";

import { useState } from "react";
import { fullAccess, presetAccess, type AdminRole } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/base/buttons/button";
import { RoleCheckboxes } from "./RoleCheckboxes";

/**
 * Replaces (not adds to) the selected accounts' roles — the school-year
 * turnover case this exists for is "these N people are now Leadership",
 * not "add Leadership on top of whatever they already had".
 */
export function BulkRoleReassignModal({
  count,
  ids,
  onClose
}: {
  count: number;
  ids: string[];
  onClose: () => void;
}) {
  const { updateUsers } = useAdminUsers();
  const [roles, setRoles] = useState<AdminRole[]>([]);

  const apply = () => {
    if (roles.length === 0) return;
    /* The roles' grid, applied to everyone selected. A bulk change cannot
         honour a per-person adjustment — there is no one person — so it says
         so plainly above rather than quietly keeping stale levels. */
    updateUsers(ids, { roles, access: fullAccess(presetAccess(roles)) });
    onClose();
  };

  return (
    <Modal title={`Reassign role${count === 1 ? "" : "s"} for ${count} user${count === 1 ? "" : "s"}`} onClose={onClose}>
      <p className="sf-panel-note">
        This replaces every selected account&rsquo;s current role(s) with what you pick below,
        and resets their access to what those roles grant &mdash; including anyone whose access
        was adjusted by hand.
      </p>

      <RoleCheckboxes
        value={roles}
        onChange={setRoles}
        legend="New role(s)"
        error={roles.length === 0 ? "Select at least one role" : undefined}
      />

      <div className="list-editor-form-actions">
        <Button size="sm" onClick={apply} isDisabled={roles.length === 0}>
          Apply to {count} User{count === 1 ? "" : "s"}
        </Button>
        <Button color="tertiary" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
