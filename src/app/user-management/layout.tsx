"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Button } from "@/components/base/buttons/button";
import { InviteAdminUserModal } from "@/components/admin-users/InviteAdminUserModal";

const TABS = [
  { label: "All Users", href: "/user-management" },
  { label: "Approved Users", href: "/user-management/approved" },
  { label: "Revoked Users", href: "/user-management/revoked" },
  { label: "Inactive Users", href: "/user-management/inactive" },
  { label: "Pending Invitations", href: "/user-management/pending" },
  /* Last, and the only tab that is not a slice of the account list: it is what
     those accounts point at, and the thing to read before sending an invite. */
  { label: "Roles & Permissions", href: "/user-management/roles" }
];

/**
 * Pending Invitations is the one tab that runs its own actions (resend/revoke
 * an invite) rather than the account table, so inviting from there would land
 * the new row on a different tab than the one you're looking at.
 */
const PENDING_HREF = "/user-management/pending";

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

        {pathname !== PENDING_HREF ? (
          <Button
            size="sm"
            onClick={() => setIsInviting(true)}
            iconLeading={<HugeiconsIcon icon={MailAdd01Icon} strokeWidth={2} className="size-4 shrink-0" />}
          >
            Invite User
          </Button>
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
