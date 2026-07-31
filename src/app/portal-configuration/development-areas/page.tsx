"use client";

import { useState } from "react";
import { developmentAreas, SCHOOL_LEVELS, type SchoolLevel } from "@/lib/data/portalConfig";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { ListEditor } from "@/components/shared/ListEditor";

export default function DevelopmentAreasPage() {
  const [level, setLevel] = useState<SchoolLevel>("HS");
  const items = developmentAreas[level];

  return (
    <>
      <SectionFilterBar
        filters={[
          {
            id: "level",
            label: "School Level",
            value: level,
            options: SCHOOL_LEVELS,
            onChange: (value) => setLevel(value as SchoolLevel)
          },
          {
            id: "module",
            label: "Module",
            value: "development-areas",
            options: [{ value: "development-areas", label: "Development areas" }],
            onChange: () => {}
          }
        ]}
      />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Development areas</h2>
          <span className="config-status-summary">
            {items.filter((item) => item.status?.label === "Published").length} of {items.length}{" "}
            published
          </span>
        </div>

        <ListEditor
          key={level}
          items={items}
          addLabel="Add development area"
          emptyTitle="No development areas yet"
          emptyMessage="Add the first development area for this school level."
        />
      </div>
    </>
  );
}
