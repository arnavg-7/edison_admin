"use client";

import { Fragment, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PlusSignIcon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import {
  CREATOR_ROLE_LABELS,
  SCOPE_TYPES,
  SCOPE_TYPE_LABELS,
  aggregates,
  canArchive,
  canEditDefinition,
  goalSchoolId,
  measurementBadge,
  rollup,
  scopeLabel,
  sessionLabel,
  visibleTo,
  whyReadOnly,
  type Goal
} from "@/lib/data/goals";
import { useGoals } from "@/lib/goals-store";
import { useAdminActor, useAdminScope } from "@/lib/admin-scope";
import { useMounted } from "@/lib/use-mounted";
import { schools } from "@/lib/data/schools";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GoalDefinition } from "./GoalDefinition";
import { GoalDrawer } from "./GoalDrawer";
import { GoalAssignments } from "./GoalAssignments";
import { GoalRollup } from "./GoalRollup";

const ALL = "all";

/**
 * Every goal an admin can see, at every scope level.
 *
 * One list rather than a school → grade drill-down, because R1 puts goals at
 * five levels — district, school, grade, class and individual student — and a
 * drill-down can only ever show one of them. The old route hierarchy survives as
 * filters: narrowing to a school and a grade is a question you ask of the list,
 * not the only way to reach it.
 *
 * Rows carry their scope and who created it, since between them those decide
 * every permission on the screen (Sheet 2). A goal an admin may not edit still
 * appears — "visibility is broad; editing is narrow" — and says why.
 */
export function GoalsBoard({
  initialSchool,
  initialGrade
}: {
  /** Pre-set from the old drill-down routes, so their links still land right. */
  initialSchool?: string;
  initialGrade?: string;
}) {
  const { goals, assignments, archiveGoal, restoreGoal } = useGoals();
  const actor = useAdminActor();
  const { school: scopedSchool } = useAdminScope();
  const mounted = useMounted();

  const [scopeType, setScopeType] = useState<string>(ALL);
  /* Off by default: an admin manages admin goals. Faculty and student goals are
     visibility-only for them, so they are behind a toggle rather than mixed into
     the list they work in every day. */
  const [showOthers, setShowOthers] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState<string>(initialSchool ?? ALL);
  const [gradeFilter, setGradeFilter] = useState<string>(initialGrade ?? ALL);
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<Goal | null>(null);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string[]>([]);

  /* A school admin's board is their school's. Clamped here as well as in the
     filter list: the filter is a convenience, this is the rule. */
  const effectiveSchool = scopedSchool ? scopedSchool.id : schoolFilter;

  const gradesForFilter =
    effectiveSchool === ALL
      ? []
      : (schools.find((entry) => entry.id === effectiveSchool)?.grades ?? []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return goals
      .filter((goal) => visibleTo(actor, goal))
      .filter((goal) => (showArchived ? true : goal.isActive))
      .filter((goal) => scopeType === ALL || goal.scopeType === scopeType)
      .filter(
        (goal) =>
          showOthers ||
          goal.creatorRole === "district_admin" ||
          goal.creatorRole === "school_admin"
      )
      .filter((goal) => {
        if (effectiveSchool === ALL) return true;
        /* A district goal reaches into every school, so it belongs in a school's
           list — filtering it out would hide a goal that school's students are
           being measured against. */
        const owner = goalSchoolId(goal);
        return owner === null || owner === effectiveSchool;
      })
      .filter((goal) => {
        if (gradeFilter === ALL) return true;
        if (goal.scopeType === "grade") return goal.scopeId.endsWith(`:${gradeFilter}`);
        // Wider scopes cover the grade; narrower ones are checked by assignment.
        if (goal.scopeType === "district" || goal.scopeType === "school") return true;
        return assignments(goal).some((row) => row.grade === gradeFilter);
      })
      .filter(
        (goal) =>
          !term ||
          `${goal.title} ${goal.description} ${goal.createdBy}`.toLowerCase().includes(term)
      );
  }, [goals, actor, showArchived, scopeType, showOthers, effectiveSchool, gradeFilter, query, assignments]);

  /* How many rows the toggle would add, so the label can say what it reveals
     rather than leaving the count to be discovered by flipping it. */
  const othersCount = goals.filter(
    (goal) =>
      visibleTo(actor, goal) &&
      goal.isActive &&
      (goal.creatorRole === "faculty" || goal.creatorRole === "student")
  ).length;

  const archivedCount = goals.filter((goal) => visibleTo(actor, goal) && !goal.isActive).length;

  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  if (!mounted) return null;

  return (
    <>
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">Academic Goals</h1>
          <p className="sf-page-sub">
            Goals at every level — district, school, grade, class and individual student. Who
            created a goal decides who may change it; how it is measured decides how progress is
            tracked.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
        >
          Set a goal
        </Button>
      </div>

      <div className="sf-filter-bar sf-filter-bar--flush sf-filter-bar--top-spaced">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Goal, description or creator"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="sf-field">
          <span>Scope</span>
          <Combobox
            options={[
              { value: ALL, label: "All scope levels" },
              ...SCOPE_TYPES.map((type) => ({ value: type, label: SCOPE_TYPE_LABELS[type] }))
            ]}
            value={scopeType}
            onChange={setScopeType}
          />
        </label>

        {/* No School field for a school admin — the sidebar names their school. */}
        {scopedSchool ? null : (
          <label className="sf-field">
            <span>School</span>
            <Combobox
              options={[
                { value: ALL, label: "All schools" },
                ...schools.map((school) => ({ value: school.id, label: school.name }))
              ]}
              value={schoolFilter}
              onChange={(next) => {
                setSchoolFilter(next);
                setGradeFilter(ALL);
              }}
            />
          </label>
        )}

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={[
              { value: ALL, label: "All grades" },
              ...gradesForFilter.map((grade) => ({ value: grade, label: `Grade ${grade}` }))
            ]}
            value={gradeFilter}
            onChange={setGradeFilter}
            disabled={effectiveSchool === ALL}
            placeholder={effectiveSchool === ALL ? "Pick a school first" : "All grades"}
          />
        </label>

        {/* The count and the two "widen this list" controls share a line under
            the filters. The toggle was a filter field, where its label ran past
            the bar's right edge and clipped; it also belongs with Show archived
            rather than among the fields that narrow. */}
        <div className="sf-filter-foot">
          <p className="sf-filter-note">
            {visible.length} goal{visible.length === 1 ? "" : "s"}
            {archivedCount > 0 ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="sf-inline-btn"
                  onClick={() => setShowArchived((current) => !current)}
                >
                  {showArchived ? "Hide" : "Show"} {archivedCount} archived
                </button>
              </>
            ) : null}
          </p>

          {/* A switch, not a filter option: it widens what the list is rather
              than narrowing it, and it says how much wider. */}
          <label className="sf-field sf-field--toggle">
            <Switch checked={showOthers} onCheckedChange={setShowOthers} />
            <span>
              Show faculty &amp; student goals{" "}
              <span className="sf-field-hint">
                view only{othersCount > 0 ? ` · ${othersCount}` : ""}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Goals</h2>
          <span className="sf-panel-note">
            Expand a goal for its student progress and rollup
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No goals match these filters"
            message="Widen the scope, creator or grade filters, or set a goal for this scope."
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table sf-table--expandable">
              <thead>
                <tr>
                  <th scope="col">Goal</th>
                  <th scope="col">Scope</th>
                  <th scope="col">Set by</th>
                  <th scope="col">Measurement</th>
                  <th scope="col">Progress</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((goal) => {
                  const isOpen = open.includes(goal.id);
                  const detailId = `${goal.id}-detail`;
                  const rows = assignments(goal);
                  const totals = rollup(goal, rows);
                  const readOnly = whyReadOnly(actor, goal);

                  return (
                    <Fragment key={goal.id}>
                      <tr data-editing={editing?.id === goal.id || undefined}>
                        <td>
                          <div className="sf-row-expander">
                            <button
                              type="button"
                              className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                              aria-expanded={isOpen}
                              aria-controls={detailId}
                              onClick={() => toggle(goal.id)}
                            >
                              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                              <span className="sf-sr-only">
                                {isOpen
                                  ? `Hide progress for ${goal.title}`
                                  : `Show progress for ${goal.title}`}
                              </span>
                            </button>
                            <div>
                              <div className="list-editor-item-title">
                                {goal.title}
                                {goal.isActive ? null : (
                                  <StatusBadge tone="neutral">Archived</StatusBadge>
                                )}
                              </div>
                              <div className="list-editor-item-detail">{goal.description}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="list-editor-item-title">
                            {SCOPE_TYPE_LABELS[goal.scopeType]}
                          </div>
                          <div className="list-editor-item-detail">{scopeLabel(goal)}</div>
                        </td>
                        <td>
                          <div className="list-editor-item-title">{goal.createdBy}</div>
                          <div className="list-editor-item-detail">
                            {CREATOR_ROLE_LABELS[goal.creatorRole]}
                          </div>
                        </td>
                        <td>
                          {/* One badge, one line. The metric is not named because
                              POAG level is the only one this release, and the
                              operator and target are what differ between rows. */}
                          <StatusBadge tone={goal.measurementType === "auto" ? "ok" : "neutral"}>
                            {measurementBadge(goal)}
                          </StatusBadge>
                        </td>
                        <td>
                          {/* Only an aggregating goal gets a percentage. A
                              faculty or student goal shows the bare count: a %
                              in this column reads as a rollup, and those are
                              excluded from every rollup in R1. */}
                          <div className="list-editor-item-title">
                            {aggregates(goal)
                              ? `${Math.round(totals.pct)}%`
                              : `${totals.met} of ${totals.total} met`}
                          </div>
                          <div className="list-editor-item-detail">
                            {[
                              aggregates(goal) ? `${totals.met} of ${totals.total} met` : null,
                              /* Named, not silently dropped: an excluded student
                                 is a roster change, not a gap in the data. */
                              totals.inactive > 0 ? `${totals.inactive} left the scope` : null,
                              aggregates(goal) ? null : "not in rollups"
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </td>
                        <td>
                          {/* Editing is narrow, and where it is denied the row
                              says why rather than showing a dead button. */}
                          {canEditDefinition(actor, goal) ? (
                            <div className="sf-row-actions">
                              <Button
                                color="secondary"
                                size="xs"
                                onClick={() => {
                                  setCreating(false);
                                  setEditing(goal);
                                }}
                              >
                                Edit<span className="sf-sr-only"> {goal.title}</span>
                              </Button>
                              {goal.isActive ? (
                                <Button
                                  color="secondary-destructive"
                                  size="xs"
                                  onClick={() => archiveGoal(goal.id)}
                                  isDisabled={!canArchive(actor, goal)}
                                >
                                  Archive<span className="sf-sr-only"> {goal.title}</span>
                                </Button>
                              ) : (
                                <Button
                                  color="secondary"
                                  size="xs"
                                  onClick={() => restoreGoal(goal.id)}
                                >
                                  Restore<span className="sf-sr-only"> {goal.title}</span>
                                </Button>
                              )}
                            </div>
                          ) : (
                            /* A lock, not a sentence: the prose cost two lines on
                               every locked row. The icon says "not yours to
                               change"; the tooltip says which rule, and it is a
                               button so keyboard and touch reach it too. */
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button type="button" className="goal-lock" aria-label={readOnly ?? "Read-only"}>
                                    <HugeiconsIcon icon={SquareLock02Icon} size={16} strokeWidth={2} />
                                  </button>
                                }
                              />
                              <TooltipContent className="max-w-64">{readOnly}</TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      </tr>

                      {isOpen ? (
                        <tr className="sf-subrow" id={detailId}>
                          <td colSpan={6}>
                            <div className="goal-detail">
                              {/* What the list no longer carries: the window, and
                                  the full auto-metric contract. */}
                              <GoalDefinition goal={goal} />
                              <GoalRollup goal={goal} rows={rows} />
                              <GoalAssignments goal={goal} rows={rows} />
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating || editing ? (
        <GoalDrawer
          goal={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}
