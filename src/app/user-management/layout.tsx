"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Button } from "@/components/ui/button";
import { InviteAdminUserModal } from "@/components/admin-users/InviteAdminUserModal";

const TABS = [
  { label: "Admin Users", href: "/user-management" },
  { label: "Pending Invitations", href: "/user-management/pending" }
];

/**
 * Owned by the IT Administrator: the small set of people with admin-level
 * access to this portal (Leadership, Portal Administrator, IT Administrator).
 * Separate from Student & Faculty 360, which is the Genesis-synced roster —
 * nothing here syncs in automatically, every account is added on this screen.
 */
export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInviting, setIsInviting] = useState(false);

  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">User Management</h1>
          <p className="sf-page-sub">
            Admin-level portal access: Leadership, Portal Administrator and IT Administrator
            roles. Student and faculty accounts sync in from Genesis and don&rsquo;t appear here.
          </p>
        </div>

        {pathname === "/user-management" ? (
          <Button onClick={() => setIsInviting(true)}>Invite User</Button>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
        {children}
      </Suspense>

      {isInviting ? <InviteAdminUserModal onClose={() => setIsInviting(false)} /> : null}
    </section>
  );
}
