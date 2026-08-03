"use client";

import { useState } from "react";
import type { AdminRole } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
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
    updateUsers(ids, { roles });
    onClose();
  };

  return (
    <Modal title={`Reassign role${count === 1 ? "" : "s"} for ${count} user${count === 1 ? "" : "s"}`} onClose={onClose}>
      <p className="sf-panel-note">
        This replaces every selected account&rsquo;s current role(s) with what you pick below.
      </p>

      <RoleCheckboxes value={roles} onChange={setRoles} legend="New role(s)" />

      <div className="list-editor-form-actions">
        <Button onClick={apply} disabled={roles.length === 0}>
          Apply to {count} User{count === 1 ? "" : "s"}
        </Button>
        <button type="button" className="sf-btn sf-btn--quiet" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
