"use client";

import { gradeLevels } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function GradeLevelsPage() {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Grade levels</h2>
        <span className="sf-panel-note">{gradeLevels.length} configured</span>
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
