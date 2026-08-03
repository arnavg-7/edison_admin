"use client";

import { subjects } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function SubjectsPage() {
  return (
      <div className="sf-panel">
        <ListEditor
          heading="Subject management"
          items={subjects}
          addLabel="Add subject"
          emptyTitle="No subjects configured"
          emptyMessage="Add a subject and map it to grade levels."
        />
      </div>
  );
}
