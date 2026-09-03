"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { INSTITUTIONAL_DOMAINS_LABEL } from "@/lib/data/adminUsers";

/**
 * Four tabs: everyone, and the three states an account can be in.
 *
 * A status has a tab as well as a filter because two of them are queues — an
 * invitation waiting to be accepted, and access that has been withdrawn — and a
 * queue is a place you go, not a value you set.
 *
 * What each role grants is stated where it is being granted, in the invite and
 * edit drawer, rather than on a tab of its own: a reference page nobody opens
 * before they act is a page that does not do the job.
 */
const TABS = [
  { label: "All Users", href: "/user-management" },
  { label: "Invited", href: "/user-management/invited" },
  { label: "Active", href: "/user-management/active" },
  { label: "Disabled", href: "/user-management/disabled" }
];

/**
 * Who can sign in to this portal, and over which schools.
 *
 * Access control rather than a directory. Every account here is created by an
 * invitation against an address the district has already issued — nothing syncs
 * in, unlike Student & Faculty 360, where the Genesis roster lands and where no
 * account holds an admin role.
 *
 * The invite button lives on the table rather than up here: the tabs include two
 * that are not the account list, and inviting from those would drop the new row
 * onto a tab you are not looking at.
 */
export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* One account's record is not a tab. It keeps the section heading and the way
     back, but the tab strip would have to mark one of four as current, and none
     of them is where you are. */
  const isRecord = /^\/user-management\/[^/]+$/.test(pathname) &&
    !["/user-management/invited", "/user-management/active", "/user-management/disabled"].includes(pathname);

  return (
    <section className="sf-main">
      {isRecord ? null : (
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">User Management</h1>
          <p className="sf-page-sub">
            Two roles: a Super Admin administers every school, a School Admin does the same job over
            one assigned school. Accounts are invited against a district address (
            {INSTITUTIONAL_DOMAINS_LABEL}).
          </p>
        </div>
      </div>
      )}

      <Suspense fallback={null}>
        {isRecord ? null : <SectionTabs tabs={TABS} />}
        {children}
      </Suspense>
    </section>
  );
}
