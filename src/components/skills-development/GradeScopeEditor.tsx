"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import type { GradeScope } from "@/lib/data/skillsDevelopment";
import { DevelopmentAreasEditor } from "./DevelopmentAreasEditor";
import { SkillsProfileEditor } from "./SkillsProfileEditor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Both editors for one grade. The tabs are local rather than routed: the two
 * panels are the same scope viewed two ways, and keeping them on one URL means
 * the school/grade a user drilled into stays in the address bar.
 */
const TABS = ["Development areas", "Skills profile"] as const;

export function GradeScopeEditor({ scope }: { scope: GradeScope }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const gradeLabel = `Grade ${scope.grade}`;

  return (
    <>
      <div className="sf-scope-head">
        <h1 className="sf-page-title sf-page-title--with-back">
          <Link
            href={`/skills-development/${scope.schoolId}`}
            className="sf-back-btn"
            aria-label={`Back to ${scope.schoolName} grades`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          </Link>
          {gradeLabel} · {scope.schoolName}
        </h1>
      </div>

      {!scope.inScope ? (
        <p className="sf-scope-flag">
          Outside the committed HS-only scope. Nothing has been configured for this grade. The
          editors below work, but adding content here extends the agreed scope.
        </p>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as (typeof TABS)[number])}
        className="sf-section-tabs"
      >
        <TabsList variant="line" aria-label="Configuration view">
          {TABS.map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "Development areas" ? (
        <DevelopmentAreasEditor schoolId={scope.schoolId} grade={scope.grade} />
      ) : (
        <SkillsProfileEditor schoolId={scope.schoolId} grade={scope.grade} />
      )}
    </>
  );
}
