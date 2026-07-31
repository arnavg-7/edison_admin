"use client";

import { useState } from "react";
import { SCHOOL_LEVELS, type SchoolLevel } from "@/lib/data/portalConfig";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { DevelopmentAreasEditor } from "@/components/portal-config/DevelopmentAreasEditor";

export default function DevelopmentAreasPage() {
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
            // Retained deliberately (confirmed 2026-07-31): the screen inventory
            // specifies a Module filter here, but this screen is its own single
            // module, so there is nothing to switch between yet. Keep it until
            // more modules exist rather than removing a specified control.
            id: "module",
            label: "Module",
            value: "development-areas",
            options: [{ value: "development-areas", label: "Development areas" }],
            onChange: () => {}
          }
        ]}
      />

      <DevelopmentAreasEditor level={level} />
    </>
  );
}
