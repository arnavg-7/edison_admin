"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** Deactivated accounts: they keep their roles but can't sign in. */
export default function InactiveUsersPage() {
  return (
    <AdminUserList
      status="Inactive"
      heading="Inactive users"
      noun="inactive users"
      emptyTitle="No inactive users"
      emptyMessage="Every admin account is either approved or still pending. Deactivating one moves it here."
    />
  );
}
