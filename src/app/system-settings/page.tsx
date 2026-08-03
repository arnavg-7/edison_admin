"use client";

import { gradeLevels } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function GradeLevelsPage() {
  return (
    <div className="sf-panel">
      <ListEditor
        heading="Grade levels"
        items={gradeLevels}
        addLabel="Add grade level"
        emptyTitle="No grade levels configured"
        emptyMessage="Add a grade level to map schools and subjects against it."
      />
    </div>
  );
}
