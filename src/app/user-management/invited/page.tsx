"use client";

import { AdminUserList } from "@/components/admin-users/AdminUserList";

/** The queue: invitations sent and not yet accepted, expired ones included. */
export default function InvitedPage() {
  return (
    <div className="sf-panel">
      <AdminUserList status="Invited" heading="Invitations awaiting acceptance" />
    </div>
  );
}
