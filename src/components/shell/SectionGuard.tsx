"use client";

import { useRole } from "@/lib/role/RoleContext";
import { ROLE_LABELS, SECTION_ACCESS, canAccess, type SectionId } from "@/lib/role/roles";

// Guards direct-URL access to a section the current role can't see. Reads the
// same SECTION_ACCESS map the sidebar does — no parallel permission check.
export function SectionGuard({
  section,
  children
}: {
  section: SectionId;
  children: React.ReactNode;
}) {
  const { role } = useRole();

  if (canAccess(role, section)) {
    return <>{children}</>;
  }

  const allowed = SECTION_ACCESS[section].map((value) => ROLE_LABELS[value]).join(", ");

  return (
    <section className="admin-main">
      <h1>Not available for your role</h1>
      <p className="admin-subtitle">
        You are signed in as {ROLE_LABELS[role]}. This section is available to: {allowed}.
      </p>
    </section>
  );
}
