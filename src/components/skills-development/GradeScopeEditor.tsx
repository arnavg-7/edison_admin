"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import type { GradeScope } from "@/lib/data/skillsDevelopment";
import { DevelopmentAreasEditor } from "./DevelopmentAreasEditor";
import { SkillsProfileEditor } from "./SkillsProfileEditor";
import { PoagProfileEditor } from "./PoagProfileEditor";
import { DevelopmentAreasHistory, SkillsProfileHistory } from "./TermHistory";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Every editor for one grade. The tabs are local rather than routed: the panels
 * are the same scope viewed several ways, and keeping them on one URL means the
 * school/grade a user drilled into stays in the address bar.
 *
 * "Skill groups" is the district's own skills taxonomy — groups and sub-skills,
 * bulk-imported from a department sheet. It used to be called "Skills profile";
 * that name now belongs to Edison's Portrait of a Graduate, and "Skill groups"
 * is what the panel has always actually managed.
 */
const TABS = ["Development areas", "Skill groups", "Skills profile"] as const;

/**
 * Development areas and Skill groups each archive per term, so they carry a
 * Current/History switch. Portrait of a Graduate does not: its ratings are
 * append-only per marking period on the faculty side, and the admin's own
 * history — who changed which wording — belongs in the district audit log
 * rather than in a second copy of this screen.
 */
const VIEWS = ["Current", "History"] as const;

/**
 * Skill groups stays hidden for now, at Edison's request — Portrait of a
 * Graduate and Development areas are what is under review while the pilot runs.
 *
 * A hide, not a removal: the editor, its term history, its CSV import and the
 * counts it feeds on the school picker are all untouched, and a student's skill
 * groups are still on their 360 profile. Take the name out of this list to bring
 * the tab straight back.
 */
const HIDDEN_TABS: readonly (typeof TABS)[number][] = ["Skill groups"];

const VISIBLE_TABS = TABS.filter((label) => !HIDDEN_TABS.includes(label));

const HAS_HISTORY: Record<(typeof TABS)[number], boolean> = {
  "Development areas": true,
  "Skill groups": true,
  "Skills profile": false
};

export function GradeScopeEditor({ scope }: { scope: GradeScope }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(VISIBLE_TABS[0]);
  const [view, setView] = useState<(typeof VIEWS)[number]>(VIEWS[0]);
  const gradeLabel = `Grade ${scope.grade}`;

  return (
    <>
      <div className="sf-scope-head">
        <h1 className="sf-page-title sf-page-title--with-back">
          <Link
            href="/skills-development"
            className="sf-back-btn"
            aria-label="Back to Skills & Development"
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

      {/* With one tab left there is nothing to switch between, and a lone tab is
          a dead control. The strip returns on its own once a name comes back off
          HIDDEN_TABS. */}
      {VISIBLE_TABS.length > 1 ? (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as (typeof TABS)[number])}
          className="sf-section-tabs"
        >
          <TabsList variant="line" aria-label="Configuration view">
            {VISIBLE_TABS.map((label) => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Segmented, against the section tabs' underline, so two tab rows in a
          row read as a hierarchy rather than as one wrapped set. Hidden entirely
          on a tab with no history — a switch whose second option does nothing is
          worse than no switch. */}
      {HAS_HISTORY[tab] ? (
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as (typeof VIEWS)[number])}
          className="sf-scope-views"
        >
          <TabsList aria-label={`${tab} view`}>
            {VIEWS.map((label) => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {tab === "Skills profile" ? (
        <PoagProfileEditor schoolId={scope.schoolId} grade={scope.grade} />
      ) : tab === "Development areas" ? (
        view === "Current" ? (
          <DevelopmentAreasEditor schoolId={scope.schoolId} grade={scope.grade} />
        ) : (
          <DevelopmentAreasHistory schoolId={scope.schoolId} grade={scope.grade} />
        )
      ) : view === "Current" ? (
        <SkillsProfileEditor schoolId={scope.schoolId} grade={scope.grade} />
      ) : (
        <SkillsProfileHistory schoolId={scope.schoolId} grade={scope.grade} />
      )}
    </>
  );
}
