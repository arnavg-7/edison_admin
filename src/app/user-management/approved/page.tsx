"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** Accounts whose access has been granted and taken up — stored status "Active". */
export default function ApprovedUsersPage() {
  return (
    <AdminUserList
      status="Active"
      heading="Approved users"
      noun="approved users"
      emptyTitle="No approved users yet"
      emptyMessage="Nobody has accepted an invite yet. Invites live on the Pending Invitations tab until they do."
    />
  );
}
