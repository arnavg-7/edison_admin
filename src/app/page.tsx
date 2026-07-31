"use client";

import { useRole } from "@/lib/role/RoleContext";
import { ROLE_LABELS } from "@/lib/role/roles";

export default function HomePage() {
  const { role } = useRole();

  return (
    <section className="admin-main">
      <h1>Home</h1>
      <p className="admin-subtitle">Signed in as {ROLE_LABELS[role]}.</p>
      <div className="admin-content-panel">
        <p>Role-specific Home renders land in the next phase.</p>
      </div>
    </section>
  );
}
