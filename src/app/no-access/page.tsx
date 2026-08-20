"use client";

import { useAdminScope } from "@/lib/admin-scope";
import { ADMIN_ROLE_LABELS } from "@/lib/data/adminUsers";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * Where an account with no sections lands.
 *
 * A role holding nothing is a legitimate configuration — access parked rather
 * than revoked — so signing in as one has to arrive somewhere. Without this the
 * gate would send them to a section they cannot open, which sends them back
 * here, and the portal would spin.
 *
 * It names who they are and what they hold, because the person reading it can
 * do nothing about it and the admin they forward it to needs both.
 */
export default function NoAccessPage() {
  const { user, roles } = useAdminScope();

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">Nothing to open</h1>
      <EmptyState
        title={
          roles.length === 0
            ? "This account holds no role"
            : "The roles on this account open no sections"
        }
        message={
          roles.length === 0
            ? `${user?.name ?? "This account"} can sign in but has not been given a role. Whoever administers this portal can assign one in User Management.`
            : `${user?.name ?? "This account"} holds ${roles
                .map((role) => ADMIN_ROLE_LABELS[role])
                .join(" and ")}, and no section is currently granted to ${
                roles.length === 1 ? "it" : "them"
              }. Whoever administers this portal can grant sections on User Management → Roles & Access.`
        }
      />
    </section>
  );
}
