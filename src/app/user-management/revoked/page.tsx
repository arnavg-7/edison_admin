"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/**
 * Access handed back rather than deleted: the record stays so it can be
 * restored, or removed for good once the district is sure.
 */
export default function RevokedUsersPage() {
  return (
    <AdminUserList
      status="Revoked"
      heading="Revoked users"
      noun="revoked users"
      emptyTitle="No revoked users"
      emptyMessage="Nobody's admin access has been revoked. Revoked accounts stay here until they're restored or removed."
    />
  );
}
