"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** Accounts in use: the invitation was accepted and nobody has turned it off. */
export default function ActiveUsersPage() {
  return (
    <AdminUserList
      status="Active"
      heading="Active users"
      noun="active users"
      emptyTitle="No active users yet"
      emptyMessage="Nobody has accepted an invitation yet. Invitations sit on the Invited tab until they do."
    />
  );
}
