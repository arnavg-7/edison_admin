"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  GOAL_SEMESTERS,
  findSemester,
  goalCategories,
  isPastSemester,
  type GoalThreshold,
  type GradeGoal
} from "@/lib/data/academicGoals";
import {
  deleteGoal,
  goalsInScope,
  sameScope,
  saveGoal,
  type GoalScope
} from "@/lib/academic-goals-store";
import { gradeLabel, gradesForSchool, schools } from "@/lib/data/schools";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { GradeGoalStudents } from "./GradeGoalStudents";
import { GoalProgressCell } from "./GoalProgressCell";
import { GoalTargets } from "./GoalTargets";
import { StudentGoalsPanel } from "./StudentGoalsPanel";
import { HugeiconsIcon as ExpandIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePoag } from "@/lib/poag-store";
import { subjectsForGrade } from "@/lib/data/poagCoverage";
import { MANUAL_GOAL_STATUSES, targetSentence } from "@/lib/data/gradeGoalProgress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

// TODO: local state only — persist through the Admin DB Academic Goals
// contract when it exists.

type ComboOption = { value: string; label: string };

const categoryOptions: ComboOption[] = goalCategories.map((category) => ({
  value: category.title,
  label: category.title
}));



/** Every school, so a goal can be set for a grade other than the one on screen. */
const schoolOptions: ComboOption[] = schools.map((school) => ({
  value: school.id,
  label: school.name
}));

/** Filter sentinel: no narrowing on that field. */
const ALL = "all";

let seq = 0;
const nextId = (scope: string) => `gg-local-${scope}-${Date.now()}-${seq++}`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/** Formats a YYYY-MM-DD string without going through Date/timezone conversion. */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function formatDateRange(from: string, to: string): string {
  return `${formatIsoDate(from)} – ${formatIsoDate(to)}`;
}

type Draft = {
  /** The scope the goal is being written to — starts as the grade on screen. */
  schoolId: string;
  grade: string;
  title: string;
  description: string;
  category: string;
  /** The chosen semester's name; its dates come with it — see GOAL_SEMESTERS. */
  semesterName: string;
  /* Measurement, held flat rather than as the union the record uses: a drawer
     keeps every field a user might switch back to, so toggling to Manual and
     back must not lose the pillar they had already picked. It is narrowed to the
     union on save. */
  measurementType: "manual" | "auto";
  pillarKey: string;
  requiredLevel: string;
  /** "" means any subject. */
  subjectId: string;
  /* Cohort targets, drafted in full so a half-typed one is not lost while the
     admin adds another. */
  thresholds: GoalThreshold[];
};

function emptyDraft(scope: GoalScope): Draft {
  return {
    schoolId: scope.schoolId,
    grade: scope.grade,
    title: "",
    description: "",
    category: goalCategories[0]?.title ?? "",
    semesterName: "",
    measurementType: "manual",
    pillarKey: "",
    requiredLevel: "",
    subjectId: "",
    thresholds: []
  };
}

/**
 * Goal setting for one grade at one school: the admin names a goal,
 * describes it, tags a category, and assigns it to a semester with start
 * and end dates. Once a goal's semester end date has passed, it moves to
 * the read-only Goal History tab.
 *
 * Student goals sit beside them on a third tab: those are personal goals a
 * student or their teacher wrote for one student, not goals an admin set for
 * the grade, so they are read-only here.
 *
 * Tabs are local rather than routed, mirroring Skills & Development's
 * identical drill-down (`GradeScopeEditor`): the panels are the same grade's
 * goals viewed three ways, so keeping them on one URL means the school/grade
 * drilled into stays in the address bar.
 */
const TABS = ["Goals", "Student goals", "Goal History"] as const;

export function GradeGoalsEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const router = useRouter();
  const scope: GoalScope = { schoolId, grade };

  const [goals, setGoals] = useState<GradeGoal[]>(() => goalsInScope(scope));
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

  useEffect(() => {
    setGoals(goalsInScope({ schoolId, grade }));
  }, [schoolId, grade]);

  const { pillars, levels } = usePoag();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  /* Which goals are opened out onto their student list. Several at once, so two
     goals' spreads can be compared without closing one to open the other. */
  const [openGoals, setOpenGoals] = useState<string[]>([]);

  const toggleGoal = (id: string) =>
    setOpenGoals((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(scope));

  const semesterOptions: ComboOption[] = GOAL_SEMESTERS.map((semester) => ({
    value: semester.name,
    label: semester.name
  }));
  const chosenSemester = findSemester(draft.semesterName);
  /* What a target can name, following the measurement type the drawer is on. */
  const draftLevels =
    draft.measurementType === "auto"
      ? levels.map((level) => level.label)
      : [...MANUAL_GOAL_STATUSES];

  const startAdd = () => {
    setDraft(emptyDraft(scope));
    setEditingId(null);
    setIsAdding(true);
  };

  /* Pillars and levels come from the POAG store, not the seed: the goal's target
     is one of those labels, so a renamed level has to be offered here or a goal
     could be written against wording that no longer exists. */
  const pillarOptions: ComboOption[] = pillars.map((pillar) => ({
    value: pillar.rubricKey,
    label: pillar.displayTitle
  }));
  const levelOptions: ComboOption[] = levels.map((level) => ({
    value: level.label,
    label: level.label
  }));
  const subjectOptions: ComboOption[] = [
    { value: "", label: "Any subject" },
    ...subjectsForGrade(grade).map((subject) => ({ value: subject.id, label: subject.name }))
  ];

  const startEdit = (goal: GradeGoal) => {
    setDraft({
      // A goal in this table belongs to this grade; changing either field in the
      // drawer moves it.
      schoolId,
      grade,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      semesterName: goal.semester.name,
      measurementType: goal.measurement.type,
      pillarKey: goal.measurement.type === "auto" ? goal.measurement.pillarKey : "",
      requiredLevel: goal.measurement.type === "auto" ? goal.measurement.requiredLevel : "",
      subjectId: goal.measurement.type === "auto" ? (goal.measurement.subjectId ?? "") : "",
      thresholds: goal.thresholds
    });
    setIsAdding(false);
    setEditingId(goal.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  /** Switching school keeps the grade only if the new school teaches it. */
  const setDraftSchool = (nextSchoolId: string) => {
    const grades = gradesForSchool(nextSchoolId);
    setDraft({
      ...draft,
      schoolId: nextSchoolId,
      grade: grades.includes(draft.grade) ? draft.grade : ""
    });
  };

  const canSave =
    draft.schoolId !== "" &&
    draft.grade !== "" &&
    draft.title.trim() !== "" &&
    draft.description.trim() !== "" &&
    /* A known semester, not any string: the dates ride on it, so an unrecognised
       name would leave the goal with no window to be measured against. */
    findSemester(draft.semesterName) !== undefined &&
    /* An auto goal with no pillar or no target level would evaluate every student
       against nothing, so it cannot be saved half-specified. */
    (draft.measurementType === "manual" ||
      (draft.pillarKey !== "" && draft.requiredLevel !== ""));

  const save = () => {
    if (!canSave) {
      return;
    }

    const target: GoalScope = { schoolId: draft.schoolId, grade: draft.grade };

    const goal: GradeGoal = {
      id: editingId ?? nextId(`${target.schoolId}-${target.grade}`),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      // Non-null: canSave has already required a known semester.
      semester: findSemester(draft.semesterName)!,
      /* Only targets that name a level survive: a row left half-filled is an
         intention, not a rule, and would evaluate against nothing. */
      thresholds: draft.thresholds.filter((threshold) => threshold.level !== ""),
      measurement:
        draft.measurementType === "auto"
          ? {
              type: "auto",
              pillarKey: draft.pillarKey,
              requiredLevel: draft.requiredLevel,
              // "" is the any-subject rule, stored as null.
              subjectId: draft.subjectId === "" ? null : draft.subjectId
            }
          : { type: "manual" }
    };

    saveGoal(target, goal, editingId ? scope : undefined);
    // Re-read rather than patch the list: a goal written to another grade — or
    // moved out of this one by an edit — has to leave this table.
    setGoals(goalsInScope(scope));
    cancel();

    /* Goals only ever show on their own grade's page, so a goal set for another
       scope would land somewhere the admin can't see from here. Follow it, and
       the page title and breadcrumb confirm where it went. */
    if (!sameScope(target, scope)) {
      router.push(`/academic-goals/${target.schoolId}/${encodeURIComponent(target.grade)}`);
    }
  };

  const remove = (id: string) => {
    deleteGoal(scope, id);
    setGoals(goalsInScope(scope));
    if (editingId === id) {
      cancel();
    }
  };

  /* Narrowing the list, not the scope. School and Grade are the exception: they
     are the route this screen is, so changing them navigates rather than
     filtering — a Grade 9 screen showing Grade 10 goals would be lying. */
  const [goalQuery, setGoalQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [measuredFilter, setMeasuredFilter] = useState(ALL);
  /* Held here rather than inside each goal's student list, so a name typed once
     applies to every goal on the screen — and the tallies follow it, which is how
     "how are the Sharmas doing across this grade" gets answered. */
  const [studentQuery, setStudentQuery] = useState("");

  const matchesFilters = (goal: GradeGoal) => {
    const term = goalQuery.trim().toLowerCase();
    if (term && !`${goal.title} ${goal.description}`.toLowerCase().includes(term)) return false;
    if (categoryFilter !== ALL && goal.category !== categoryFilter) return false;
    if (measuredFilter !== ALL && goal.measurement.type !== measuredFilter) return false;
    return true;
  };

  const allCurrent = goals.filter((goal) => !isPastSemester(goal));
  const current = allCurrent.filter(matchesFilters);
  const history = goals.filter((goal) => isPastSemester(goal)).filter(matchesFilters);

  /* No active goals — the empty state owns the CTA, so the panel head hides its
     own. This used to also require `!isAdding`, because the inline form replaced
     the empty state; the drawer opens over it, so the empty state should stay. */
  /* Distinguishes "this grade has no goals" from "your filters match none of
     them" — the empty state and its call to action are only right for the first. */
  const hasNoCurrentGoals = allCurrent.length === 0;
  const filtersNarrowed = current.length !== allCurrent.length;
  const anyFilter =
    goalQuery.trim() !== "" ||
    categoryFilter !== ALL ||
    measuredFilter !== ALL ||
    studentQuery.trim() !== "";

  const clearFilters = () => {
    setGoalQuery("");
    setCategoryFilter(ALL);
    setMeasuredFilter(ALL);
    setStudentQuery("");
  };

  /* Add and edit are one form in one drawer, so `isAdding` and `editingId` share
     a single open state — they were already mutually exclusive (each setter
     clears the other), and a drawer can only show one of them at a time. */
  const isFormOpen = isAdding || editingId !== null;

  const gradeOptions: ComboOption[] = gradesForSchool(draft.schoolId).map((value) => ({
    value,
    label: gradeLabel(value)
  }));

  const fields = (
    <div className="list-editor-form list-editor-form--drawer">
      {/* Which grade the goal is being set for. Defaults to the grade whose page
          the drawer was opened from, so the common case is a no-op, but a goal
          that belongs to another grade — or the whole of another school, one
          grade at a time — no longer means backing out to the school list
          first. Sits above the goal's own fields because it is the thing that
          decides who the goal is for. */}
      <div className="sf-field-row">
        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={schoolOptions}
            value={draft.schoolId}
            onChange={setDraftSchool}
            placeholder="Select a school"
            ariaLabel="School this goal is for"
          />
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeOptions}
            value={draft.grade}
            onChange={(next) => setDraft({ ...draft, grade: next })}
            placeholder="Select a grade"
            disabled={draft.schoolId === ""}
            ariaLabel="Grade this goal is for"
          />
        </label>
      </div>

      <label className="sf-field">
        <span>Goal name</span>
        <input
          type="text"
          autoFocus
          value={draft.title}
          placeholder="e.g. Attendance improvement plan"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          placeholder="What is this goal, and what does success look like?"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Category</span>
        <Combobox
          options={categoryOptions}
          value={draft.category}
          onChange={(next) => setDraft({ ...draft, category: next })}
          placeholder="Select a category"
        />
      </label>

      {/* One field, not a name plus two date pickers. A goal is set for a
          semester and a semester already has dates, so there is nothing here for
          an admin to type — and no way to write a goal to a window no term runs,
          which is what decides whether it is current and, on an auto goal, when
          falling short becomes Not met. */}
      <label className="sf-field">
        <span>Semester</span>
        <Combobox
          options={semesterOptions}
          value={draft.semesterName}
          onChange={(semesterName) => setDraft({ ...draft, semesterName })}
          placeholder="Select a semester"
        />
        {chosenSemester ? (
          <span className="sf-field-hint">
            Runs {formatDateRange(chosenSemester.from, chosenSemester.to)}.
            {isPastSemester({ semester: chosenSemester } as GradeGoal)
              ? " This semester has ended, so the goal lands in Goal history."
              : ""}
          </span>
        ) : null}
      </label>

      {/* The second decision, and a separate one from what the goal says: who
          settles whether it is done. Its own group, because picking Auto changes
          what the rest of the form asks for. */}
      <fieldset className="goal-fieldset">
        <legend>How progress is measured</legend>

        <div className="tone-options">
          <label className="tone-option">
            <input
              type="radio"
              name="goal-measurement"
              checked={draft.measurementType === "manual"}
              onChange={() => setDraft({ ...draft, measurementType: "manual" })}
            />
            <span className="tone-name">Manual — the student reports their status</span>
          </label>
          <label className="tone-option">
            <input
              type="radio"
              name="goal-measurement"
              checked={draft.measurementType === "auto"}
              onChange={() => setDraft({ ...draft, measurementType: "auto" })}
            />
            <span className="tone-name">Auto — measured from the POAG rating</span>
          </label>
        </div>

        {draft.measurementType === "auto" ? (
          <>
            <label className="sf-field">
              <span>Pillar</span>
              <Combobox
                options={pillarOptions}
                value={draft.pillarKey}
                onChange={(next) => setDraft({ ...draft, pillarKey: next })}
                placeholder="Select a pillar"
              />
            </label>

            <div className="sf-field-row">
              <label className="sf-field">
                <span>Level to reach</span>
                <Combobox
                  options={levelOptions}
                  value={draft.requiredLevel}
                  onChange={(next) => setDraft({ ...draft, requiredLevel: next })}
                  placeholder="Select a level"
                />
              </label>

              <label className="sf-field">
                <span>Measured in</span>
                <Combobox
                  options={subjectOptions}
                  value={draft.subjectId}
                  onChange={(next) => setDraft({ ...draft, subjectId: next })}
                />
              </label>
            </div>
          </>
        ) : null}
      </fieldset>

      {/* Cohort targets, in their own group below the per-student measurement —
          they are a statement about the spread, which only means anything once
          you know what is being measured. */}
      <fieldset className="goal-fieldset">
        <legend>Targets for the grade</legend>

        {draft.thresholds.map((threshold, index) => (
          /* A card per target, not one wrapping line. At the drawer's width a
             sentence of three controls wrapped to four rows with nothing tying
             them together; boxed and labelled, each target stays one object. */
          <div className="goal-threshold" key={threshold.id}>
            <div className="goal-threshold-head">
              <span>Target {index + 1}</span>
              <Button
                color="tertiary"
                size="xs"
                onClick={() =>
                  setDraft({
                    ...draft,
                    thresholds: draft.thresholds.filter((_, i) => i !== index)
                  })
                }
              >
                Remove<span className="sf-sr-only"> target {index + 1}</span>
              </Button>
            </div>

            <div className="goal-threshold-row">
              <Combobox
                options={[
                  { value: "floor", label: "At least" },
                  { value: "ceiling", label: "No more than" }
                ]}
                value={threshold.kind}
                onChange={(kind) =>
                  setDraft({
                    ...draft,
                    thresholds: draft.thresholds.map((entry, i) =>
                      i === index ? { ...entry, kind: kind as GoalThreshold["kind"] } : entry
                    )
                  })
                }
                className="goal-threshold-kind"
                ariaLabel={`Target ${index + 1} kind`}
              />

              {/* sf-input, the app's shared field class: without it this had no
                  border or background and read as plain text. Clamped on entry
                  rather than validated after — 140% is not worth an error. */}
              <span className="goal-threshold-percent">
                <input
                  type="number"
                  className="sf-input"
                  min={0}
                  max={100}
                  value={threshold.percent}
                  aria-label={`Target ${index + 1} percentage`}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      thresholds: draft.thresholds.map((entry, i) =>
                        i === index
                          ? {
                              ...entry,
                              percent: Math.max(0, Math.min(100, Number(event.target.value) || 0))
                            }
                          : entry
                      )
                    })
                  }
                />
                <span aria-hidden>%</span>
              </span>
            </div>

            <div className="goal-threshold-row">
              <span className="goal-threshold-word">
                of students {threshold.kind === "floor" ? "at or above" : "at"}
              </span>

              <Combobox
                options={draftLevels.map((level) => ({ value: level, label: level }))}
                value={threshold.level}
                onChange={(level) =>
                  setDraft({
                    ...draft,
                    thresholds: draft.thresholds.map((entry, i) =>
                      i === index ? { ...entry, level } : entry
                    )
                  })
                }
                placeholder="Pick a level"
                className="goal-threshold-level"
                ariaLabel={`Target ${index + 1} level`}
              />
            </div>
          </div>
        ))}

        {/* A button, not a faint text link: adding a target is the action this
            group exists for, and it was the least visible thing in it. */}
        <Button
          color="secondary"
          size="sm"
          className="justify-self-start"
          iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
          onClick={() =>
            setDraft({
              ...draft,
              thresholds: [
                ...draft.thresholds,
                {
                  id: `th-local-${Date.now()}-${draft.thresholds.length}`,
                  kind: draft.thresholds.length === 0 ? "floor" : "ceiling",
                  level: "",
                  percent: draft.thresholds.length === 0 ? 70 : 10
                }
              ]
            })
          }
        >
          {draft.thresholds.length === 0 ? "Add a target" : "Add another target"}
        </Button>
      </fieldset>
    </div>
  );

  /**
   * The form lives in a right-side drawer rather than inline in the panel. Inline,
   * it pushed the goals table down the page on add and swallowed a row whole on
   * edit, so the list you were working against moved or disappeared underneath
   * you. A drawer leaves the table in place.
   *
   * Actions sit in the drawer's own footer, not in the field list, so they stay
   * reachable at the bottom edge while the fields above scroll.
   */
  const formDrawer = (
    <Sheet
      open={isFormOpen}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      {/* The variant-prefixed form of the width, matching SheetContent's own
          `data-[side=right]:sm:max-w-sm`. A plain `sm:max-w-lg` is a different
          key to tailwind-merge, so both survive and the data-variant one wins —
          the drawer stayed 384px, too narrow for the two-column date row. */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editingId ? "Edit goal" : "Set a goal"}</SheetTitle>
          <SheetDescription>
            {editingId
              ? "Update this goal's grade, details, category or semester."
              : "Pick the school and grade it's for, name it, tag a category, and assign it to a semester."}
          </SheetDescription>
        </SheetHeader>

        {/* min-h-0 so this scrolls instead of forcing the footer off-screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">{fields}</div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            {editingId ? "Save goal" : "Submit goal"}
          </Button>
          <Button color="secondary" size="sm" onClick={cancel}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as (typeof TABS)[number])}
        className="sf-section-tabs"
      >
        <TabsList variant="line" aria-label="Goals view">
          {TABS.map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "Student goals" ? (
        <StudentGoalsPanel schoolId={schoolId} grade={grade} />
      ) : null}

      {tab === "Goals" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Current goals</h2>
            {/* While empty, the only call to action lives inside the empty state, so
                there aren't two "Set a goal" buttons competing on one screen. */}
            {hasNoCurrentGoals ? null : <Button
                size="sm"
                onClick={startAdd}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
              >
                Set a goal
              </Button>}
          </div>

          {/* Under the heading, inside the panel it filters — the school and grade
              pickers move the screen, the rest narrow what is on it. */}
          {hasNoCurrentGoals ? null : (
            <div className="sf-filter-bar sf-filter-bar--flush">
              <label className="sf-field sf-field--search">
                <span>Search goals</span>
                <input
                  type="search"
                  value={goalQuery}
                  placeholder="Goal name or description"
                  onChange={(event) => setGoalQuery(event.target.value)}
                />
              </label>

              <label className="sf-field">
                <span>School</span>
                <Combobox
                  options={schoolOptions}
                  value={schoolId}
                  onChange={(nextSchool) => {
                    /* Straight to that school's first grade: a school alone is not
                       a scope this screen can render. */
                    const first = gradesForSchool(nextSchool)[0];
                    if (first) router.push(`/academic-goals/${nextSchool}/${encodeURIComponent(first)}`);
                  }}
                />
              </label>

              <label className="sf-field">
                <span>Grade</span>
                <Combobox
                  options={gradesForSchool(schoolId).map((entry) => ({
                    value: entry,
                    label: gradeLabel(entry)
                  }))}
                  value={grade}
                  onChange={(nextGrade) =>
                    router.push(`/academic-goals/${schoolId}/${encodeURIComponent(nextGrade)}`)
                  }
                />
              </label>

              <label className="sf-field">
                <span>Category</span>
                <Combobox
                  options={[{ value: ALL, label: "All categories" }, ...categoryOptions]}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
              </label>

              <label className="sf-field">
                <span>Measured</span>
                <Combobox
                  options={[
                    { value: ALL, label: "Manual and auto" },
                    { value: "manual", label: "Manual" },
                    { value: "auto", label: "Auto" }
                  ]}
                  value={measuredFilter}
                  onChange={setMeasuredFilter}
                />
              </label>

              <label className="sf-field sf-field--search">
                <span>Student</span>
                <input
                  type="search"
                  value={studentQuery}
                  placeholder="Narrow every goal to one student"
                  onChange={(event) => setStudentQuery(event.target.value)}
                />
              </label>

              <p className="sf-filter-note">
                {current.length} of {allCurrent.length} goal
                {allCurrent.length === 1 ? "" : "s"}
                {studentQuery.trim() !== ""
                  ? ` · progress shown for students matching “${studentQuery.trim()}”`
                  : ""}
                {anyFilter ? (
                  <>
                    {" · "}
                    <button type="button" className="sf-inline-btn" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </>
                ) : null}
              </p>
            </div>
          )}

          {hasNoCurrentGoals ? (
            <EmptyState
              title="No current goals"
              message="Set a goal for this grade's semester to get started."
              action={<Button
                size="sm"
                onClick={startAdd}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
              >
                Set a goal
              </Button>}
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table sf-table--expandable">
                <thead>
                  <tr>
                    <th scope="col">Goal</th>
                    <th scope="col">Category</th>
                    <th scope="col">Semester</th>
                    <th scope="col">Measured</th>
                    <th scope="col">Dates</th>
                    {/* An admin sets the goal; the students report where they
                        are with it. This column is that report, summed. */}
                    <th scope="col">Student progress</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {/* Editing no longer swaps the row out for the form — the row
                      stays put and the drawer opens over it, so you can still
                      see the goal you're editing and the ones around it. */}
                  {current.map((goal) => {
                    const isOpen = openGoals.includes(goal.id);
                    const detailId = `${goal.id}-students`;

                    return (
                      <Fragment key={goal.id}>
                      <tr data-editing={editingId === goal.id || undefined}>
                        <td>
                          <div className="sf-row-expander">
                            <button
                              type="button"
                              className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                              aria-expanded={isOpen}
                              aria-controls={detailId}
                              onClick={() => toggleGoal(goal.id)}
                            >
                              <ExpandIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                              <span className="sf-sr-only">
                                {isOpen
                                  ? `Hide student progress for ${goal.title}`
                                  : `Show student progress for ${goal.title}`}
                              </span>
                            </button>
                            <div>
                              <div className="list-editor-item-title">{goal.title}</div>
                              <div className="list-editor-item-detail">{goal.description}</div>
                            </div>
                          </div>
                        </td>
                        <td>{goal.category}</td>
                        <td>{goal.semester.name}</td>
                        <td>
                          {/* The type, and for an auto goal the target it is
                              measured against — that target is the goal, so it
                              belongs on the row rather than one click in. */}
                          <StatusBadge
                            tone={goal.measurement.type === "auto" ? "ok" : "neutral"}
                          >
                            {goal.measurement.type === "auto" ? "Auto" : "Manual"}
                          </StatusBadge>
                          {goal.measurement.type === "auto" ? (
                            <div className="list-editor-item-detail">{targetSentence(goal)}</div>
                          ) : null}
                        </td>
                        <td>{formatDateRange(goal.semester.from, goal.semester.to)}</td>
                        <td>
                          <GoalProgressCell
                            schoolId={schoolId}
                            grade={grade}
                            goal={goal}
                            studentQuery={studentQuery}
                          />
                        </td>
                        <td>
                          <div className="sf-row-actions">
                            <Button color="secondary" size="xs" onClick={() => startEdit(goal)}>
                              Edit<span className="sf-sr-only"> {goal.title}</span>
                            </Button>
                            <Button
                              color="secondary-destructive"
                              size="xs"
                              onClick={() => remove(goal.id)}
                            >
                              Delete<span className="sf-sr-only"> {goal.title}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isOpen ? (
                        <tr className="sf-subrow" id={detailId}>
                          <td colSpan={7}>
                            <div className="goal-detail">
                              {/* Cohort first, students second: "is this grade
                                  acceptable" before "who needs help". */}
                              <GoalTargets schoolId={schoolId} grade={grade} goal={goal} />
                              <GradeGoalStudents
                                schoolId={schoolId}
                                grade={grade}
                                goal={goal}
                                studentQuery={studentQuery}
                              />
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

          {formDrawer}
        </div>
      ) : null}

      {/* Named rather than an else branch: with a third tab beside them, "not
          Goals" is no longer the same thing as "Goal History". */}
      {tab === "Goal History" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Goal history</h2>
            <span className="sf-panel-note">{history.length} past</span>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No goal history yet"
              message="Goals for this grade move here once their semester's end date has passed."
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table sf-table--expandable">
                <thead>
                  <tr>
                    <th scope="col">Goal</th>
                    <th scope="col">Category</th>
                    <th scope="col">Semester</th>
                    <th scope="col">Measured</th>
                    <th scope="col">Dates</th>
                    {/* A closed goal's outcome is the point of keeping it: who met
                        it, and on an auto goal who was short when the window shut.
                        Without this the failure case was recorded nowhere an admin
                        could read it. */}
                    <th scope="col">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((goal) => {
                    const isOpen = openGoals.includes(goal.id);
                    const detailId = `${goal.id}-history-students`;

                    return (
                    <Fragment key={goal.id}>
                    <tr>
                      <td>
                        <div className="sf-row-expander">
                          <button
                            type="button"
                            className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            onClick={() => toggleGoal(goal.id)}
                          >
                            <ExpandIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                            <span className="sf-sr-only">
                              {isOpen
                                ? `Hide the outcome for ${goal.title}`
                                : `Show the outcome for ${goal.title}`}
                            </span>
                          </button>
                          <div>
                            <div className="list-editor-item-title">{goal.title}</div>
                            <div className="list-editor-item-detail">{goal.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>{goal.category}</td>
                      <td>{goal.semester.name}</td>
                      <td>
                        <StatusBadge tone={goal.measurement.type === "auto" ? "ok" : "neutral"}>
                          {goal.measurement.type === "auto" ? "Auto" : "Manual"}
                        </StatusBadge>
                        {goal.measurement.type === "auto" ? (
                          <div className="list-editor-item-detail">{targetSentence(goal)}</div>
                        ) : null}
                      </td>
                      <td>{formatDateRange(goal.semester.from, goal.semester.to)}</td>
                      <td>
                        <GoalProgressCell
                            schoolId={schoolId}
                            grade={grade}
                            goal={goal}
                            studentQuery={studentQuery}
                          />
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="sf-subrow" id={detailId}>
                        <td colSpan={6}>
                          {/* A closed goal's targets are its verdict, so they lead
                              here too. */}
                          <div className="goal-detail">
                            <GoalTargets schoolId={schoolId} grade={grade} goal={goal} />
                            <GradeGoalStudents
                              schoolId={schoolId}
                              grade={grade}
                              goal={goal}
                              studentQuery={studentQuery}
                            />
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
      ) : null}
    </>
  );
}
