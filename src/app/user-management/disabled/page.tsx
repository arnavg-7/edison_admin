"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** Kept rather than deleted: a disabled account is part of the audit trail. */
export default function DisabledPage() {
  return (
    <div className="sf-panel">
      <AdminUserList status="Disabled" heading="Access withdrawn" />
    </div>
  );
}
