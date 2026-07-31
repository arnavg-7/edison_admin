"use client";

import { goalTemplates } from "@/lib/data/academicGoals";
import { ListEditor } from "@/components/shared/ListEditor";

export default function GoalTemplatesPage() {
  const published = goalTemplates.filter((item) => item.status?.label === "Published").length;

  return (
    <div className="admin-content-panel">
      <div className="home-panel-head">
        <h2>Goal templates</h2>
        <span className="config-status-summary">
          {published} of {goalTemplates.length} published
        </span>
      </div>

      <ListEditor
        items={goalTemplates}
        addLabel="Add template"
        emptyTitle="No goal templates yet"
        emptyMessage="Add a template to let schools create goals from it."
      />
    </div>
  );
}
