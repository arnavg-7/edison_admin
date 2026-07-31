"use client";

import { useState } from "react";
import { SCHOOL_LEVELS, type SchoolLevel } from "@/lib/data/portalConfig";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { SkillsProfileEditor } from "@/components/portal-config/SkillsProfileEditor";

export default function SkillsProfilePage() {
  const [level, setLevel] = useState<SchoolLevel>("HS");

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
            // Retained deliberately (confirmed 2026-07-31) — see the matching
            // note on the development-areas screen.
            id: "module",
            label: "Module",
            value: "skills-profile",
            options: [{ value: "skills-profile", label: "Skills profile" }],
            onChange: () => {}
          }
        ]}
      />

      <SkillsProfileEditor level={level} />
    </>
  );
}
