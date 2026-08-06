"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** Every admin account, whatever its status — the other tabs are slices of this. */
export default function AllUsersPage() {
  return (
    <AdminUserList
      heading="All users"
      noun="users"
      emptyTitle="No admin users yet"
      emptyMessage="Invite the first Leadership, Portal Administrator or IT Administrator account."
    />
  );
}
