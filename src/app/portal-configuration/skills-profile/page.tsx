"use client";

import { useState } from "react";
import { skillsProfile, SCHOOL_LEVELS, type SchoolLevel } from "@/lib/data/portalConfig";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { ListEditor } from "@/components/shared/ListEditor";

export default function SkillsProfilePage() {
  const [level, setLevel] = useState<SchoolLevel>("HS");
  const items = skillsProfile[level];

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
            value: "skills-profile",
            options: [{ value: "skills-profile", label: "Skills profile" }],
            onChange: () => {}
          }
        ]}
      />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Skills profile</h2>
          <span className="config-status-summary">
            {items.filter((item) => item.status?.label === "Published").length} of {items.length}{" "}
            published
          </span>
        </div>

        <ListEditor
          key={level}
          items={items}
          addLabel="Add skill"
          emptyTitle="No skills configured yet"
          emptyMessage="Add the first skill for this school level."
        />
      </div>
    </>
  );
}
