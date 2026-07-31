"use client";

import { goalCategories } from "@/lib/data/academicGoals";
import { ListEditor } from "@/components/shared/ListEditor";

export default function GoalCategoriesPage() {
  const active = goalCategories.filter((item) => item.status?.label === "Active").length;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Goal categories</h2>
        <span className="sf-panel-note">
          {active} of {goalCategories.length} active
        </span>
      </div>

      <ListEditor
        items={goalCategories}
        addLabel="Add category"
        emptyTitle="No categories yet"
        emptyMessage="Add a category to group goal templates."
      />
    </div>
  );
}
