"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role/RoleContext";
import { gradeLevels } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

/**
 * Grade Levels is the Portal admin's first screen. IT admin owns none of the
 * academic settings, so they're sent to the first screen they do own rather
 * than landing on a permission message.
 */
export default function GradeLevelsPage() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "it_admin") {
      router.replace("/system-settings/users");
    }
  }, [role, router]);

  if (role === "it_admin") {
    return null;
  }

  return (
    <div className="admin-content-panel">
      <div className="home-panel-head">
        <h2>Grade levels</h2>
        <span className="config-status-summary">{gradeLevels.length} configured</span>
      </div>

      <ListEditor
        items={gradeLevels}
        addLabel="Add grade level"
        emptyTitle="No grade levels configured"
        emptyMessage="Add a grade level to map schools and subjects against it."
      />
    </div>
  );
}
