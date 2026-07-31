"use client";

import { subjects } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function SubjectsPage() {
  const mapped = subjects.filter((item) => item.status?.label === "Mapped").length;

  return (
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Subject management</h2>
          <span className="sf-panel-note">
            {mapped} of {subjects.length} mapped to grade levels
          </span>
        </div>

        <ListEditor
          items={subjects}
          addLabel="Add subject"
          emptyTitle="No subjects configured"
          emptyMessage="Add a subject and map it to grade levels."
        />
      </div>
  );
}
