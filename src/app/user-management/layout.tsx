"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Button } from "@/components/base/buttons/button";
import { InviteAdminUserModal } from "@/components/admin-users/InviteAdminUserModal";
import { useAdminScope } from "@/lib/admin-scope";
import { SCHOOL_ADMIN_GRANTABLE } from "@/lib/data/adminUsers";

const TABS = [
  { label: "All Users", href: "/user-management" },
  { label: "Approved Users", href: "/user-management/approved" },
  { label: "Revoked Users", href: "/user-management/revoked" },
  { label: "Inactive Users", href: "/user-management/inactive" },
  { label: "Pending Invitations", href: "/user-management/pending" },
  /* Faculty hold no admin role, so this is a count rather than a slice of the
     account list — but it is the other half of "who is on the platform", and
     an admin looking for that will look here first. */
  { label: "Faculty Accounts", href: "/user-management/faculty" },
  /* Last, and about roles rather than people: it is what those accounts point
     at, and the thing to read before sending an invite. */
  { label: "Roles & Permissions", href: "/user-management/roles" }
];

/**
 * Tabs that are not the account table: Pending runs its own actions on invites,
 * and the last two are a count and a reference. Inviting from any of them would
 * land the new row on a tab you are not looking at.
 */
const NO_INVITE_HREFS = [
  "/user-management/pending",
  "/user-management/faculty",
  "/user-management/roles"
];

/**
 * Who can sign in to this portal, and what they can do once they have.
 *
 * Access control rather than a directory: an account here is a role, a scope
 * and a per-section grid, and all three are granted on this screen. Separate
 * from Student & Faculty 360, which is the Genesis-synced roster — nothing here
 * syncs in, every admin account is created by an invitation.
 *
 * A school admin sees their own school's admins and nobody above them; the
 * district's Super Admins see everyone. That narrowing happens in the list
 * itself rather than here, so every tab inherits it.
 */
export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { school } = useAdminScope();
  const [isInviting, setIsInviting] = useState(false);

  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">User Management</h1>
          <p className="sf-page-sub">
            {school
              ? `Admin access for ${school.name} — the other people who administer this school, and what each of them can open. Faculty accounts sync in from Genesis and hold no admin role.`
              : "Admin access to this portal: Super Admin, School Admin and Leadership roles, each granting a set of sections that can be adjusted per person. Faculty accounts sync in from Genesis and hold no admin role."}
          </p>
        </div>

        {NO_INVITE_HREFS.includes(pathname) ? null : (
          <Button
            size="sm"
            onClick={() => setIsInviting(true)}
            iconLeading={<HugeiconsIcon icon={MailAdd01Icon} strokeWidth={2} className="size-4 shrink-0" />}
          >
            Invite User
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
        {children}
      </Suspense>

      {isInviting ? (
        <InviteAdminUserModal
          grantable={school ? SCHOOL_ADMIN_GRANTABLE : undefined}
          onClose={() => setIsInviting(false)}
        />
      ) : null}
    </section>
  );
}
