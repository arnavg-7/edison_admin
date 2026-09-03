"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

export default function ActivePage() {
  return (
    <div className="sf-panel">
      <AdminUserList status="Active" heading="Accounts that can sign in" />
    </div>
  );
}
