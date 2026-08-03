"use client";

import { useState } from "react";
import Link from "next/link";
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
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/skills-development">Skills &amp; Development</Link>
        <span aria-hidden>/</span>
        <Link href={`/skills-development/${scope.schoolId}`}>{scope.schoolName}</Link>
        <span aria-hidden>/</span>
        <span>{gradeLabel}</span>
      </nav>

      <div className="sf-scope-head">
        <h2>
          {gradeLabel} · {scope.schoolName}
        </h2>
        <p className="sf-page-sub">
          Edits apply to this grade only. Every other grade keeps its own areas and skills.
        </p>
      </div>

      {!scope.inScope ? (
        <p className="sf-scope-flag">
          Outside the committed HS-only scope — nothing has been configured for this grade. The
          editors below work, but adding content here extends the agreed scope.
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as (typeof TABS)[number])}>
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
