"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Upload03Icon
} from "@hugeicons/core-free-icons";
import {
  isSeedPillar,
  poagBandForGrade,
  type PoagPillar
} from "@/lib/data/poag";
import {
  poagCoverageFor,
  poagCoverageTotals,
  poagDistributionFor,
  studentsInGrade,
  subjectsForGrade,
  unmappedSubjects
} from "@/lib/data/poagCoverage";
import { schools } from "@/lib/data/schools";
import { POAG_FOCUS_ALL, usePoag } from "@/lib/poag-store";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PoagContentDrawer } from "./PoagContentDrawer";
import { PoagImportDrawer } from "./PoagImportDrawer";
import { PoagLevelTrack } from "./PoagLevelTrack";
import { poagLevelTint } from "./poagLevelTint";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { styles as buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/lib/utils/cx";

/** Grades across the district that read the same band's wording as this one. */
function gradesInBand(band: string): number {
  return schools.reduce(
    (total, school) =>
      total + school.grades.filter((grade) => poagBandForGrade(grade) === band).length,
    0
  );
}

/**
 * Edison Portrait of a Graduate, from the admin's side.
 *
 * The faculty screen rates a student against six pillars; an admin never does —
 * write access belongs to a class's principal teacher and nobody else (handoff
 * spec §3.3), and there is no admin override in v1. So this is deliberately not
 * a read-only copy of that screen. It is the three things the admin does own:
 *
 *  1. the wording — held in a content table precisely so Edison can revise it
 *     without a release, which makes this screen the place that happens;
 *  2. the pilot's focus pillar — Edison's teachers rate one pillar at a time,
 *     and something has to decide which;
 *  3. oversight — where the grade sits, and who has rated and who has not.
 *
 * Everything is scoped to one grade at one school, because that is the page it
 * hangs off. Wording is the exception and says so: it is stored per grade band.
 */
export function PoagProfileEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const { pillars, levels, contentFor, isEdited, focusFor, setFocus, removePillar } =
    usePoag();
  const [expanded, setExpanded] = useState<string[]>([]);
  /* `editing` holds the pillar being reworded; `adding` opens the same drawer
     with no pillar behind it. Two flags rather than one nullable value, because
     null already means "add". */
  const [editing, setEditing] = useState<PoagPillar | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const band = poagBandForGrade(grade);
  const bandGrades = gradesInBand(band);

  const focus = focusFor(schoolId, grade);
  const focusOptions: ComboboxOption[] = [
    { value: POAG_FOCUS_ALL, label: "All six pillars" },
    ...pillars.map((pillar) => ({ value: pillar.rubricKey, label: pillar.displayTitle }))
  ];

  const coverage = poagCoverageFor(schoolId, grade);
  const totals = poagCoverageTotals(coverage);
  const roll = studentsInGrade(schoolId, grade);
  const unmapped = unmappedSubjects();
  const gradeSubjects = subjectsForGrade(grade);
  const hasSubjects = gradeSubjects.length > 0;

  /* The distribution is per subject, never across them: v1 defines no rule for
     combining a student's rating in Calculus with the same pillar in Geology,
     and summing anyway would count a three-subject student three times. */
  const [subjectId, setSubjectId] = useState(gradeSubjects[0]?.id ?? "");
  const subject = gradeSubjects.find((entry) => entry.id === subjectId) ?? gradeSubjects[0] ?? null;
  const subjectRows = coverage.filter((row) => row.subjectId === subject?.id);
  const subjectTotals = poagCoverageTotals(subjectRows);
  const distribution = subject
    ? poagDistributionFor(schoolId, grade, subject.id, pillars, levels.length)
    : [];
  const subjectOptions: ComboboxOption[] = gradeSubjects.map((entry) => ({
    value: entry.id,
    label: entry.name
  }));

  const toggle = (rubricKey: string) =>
    setExpanded((current) =>
      current.includes(rubricKey)
        ? current.filter((entry) => entry !== rubricKey)
        : [...current, rubricKey]
    );

  return (
    <>
      {/* ── Pillar content ──────────────────────────────────────────────── */}
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Edison Portrait of a Graduate</h2>
          <div className="sf-panel-head-end">
            <span className="sf-panel-note">
              {pillars.length} pillars · {band} wording
            </span>
            <Button
              color="secondary"
              size="sm"
              onClick={() => setImporting(true)}
              iconLeading={<HugeiconsIcon icon={Upload03Icon} size={16} strokeWidth={2} />}
            >
              Bulk upload
            </Button>
            <Button
              size="sm"
              onClick={() => setAdding(true)}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add pillar
            </Button>
          </div>
        </div>

        {/* Both counts and the scale itself are read from the store — the
            district can add a seventh pillar or a fifth level, and a sentence
            that said "six" and named four levels would be wrong the moment it
            did. */}
        <p className="sf-card-hint">
          {pillars.length} pillars, each rated{" "}
          {levels.map((level) => level.label).join(" → ")} by the class&rsquo;s principal teacher,
          once per marking period. Ratings are held per subject; admins have read access only — no
          rating is ever written from this screen.
        </p>

        <div className="poag-controls">
          <label className="sf-field">
            <span>Pilot focus</span>
            <Combobox
              options={focusOptions}
              value={focus}
              onChange={(next) => setFocus(schoolId, grade, next)}
              ariaLabel="Pillar teachers rate this marking period"
            />
          </label>
          <p className="sf-field-hint">
            {focus === POAG_FOCUS_ALL
              ? "Teachers see all six pillars. Narrow to one while the pilot runs — Edison's teachers rate a single pillar at a time."
              : `Teachers in Grade ${grade} rate only ${
                  pillars.find((pillar) => pillar.rubricKey === focus)?.displayTitle
                } this marking period. The other five stay visible and read-only.`}
          </p>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table sf-table--expandable poag-table">
            <thead>
              <tr>
                <th scope="col">Pillar</th>
                <th scope="col">Levels written</th>
                <th scope="col">Wording</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pillars.map((pillar) => {
                const isOpen = expanded.includes(pillar.rubricKey);
                const content = contentFor(band, pillar.rubricKey);
                const detailId = `poag-${pillar.rubricKey.replace(/\W+/g, "-")}`;
                const edited = isEdited(band, pillar.rubricKey);
                const isFocus = focus === pillar.rubricKey;
                const written = content.levels.filter((text) => text.trim() !== "").length;
                const seeded = isSeedPillar(pillar.rubricKey);

                return (
                  <Fragment key={pillar.rubricKey}>
                    <tr className={isFocus ? "poag-row is-focus" : "poag-row"}>
                      <td>
                        <div className="sf-row-expander">
                          <button
                            type="button"
                            className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                            aria-expanded={isOpen}
                            aria-controls={detailId}
                            onClick={() => toggle(pillar.rubricKey)}
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                            <span className="sf-sr-only">
                              {isOpen
                                ? `Hide wording for ${pillar.displayTitle}`
                                : `Show wording for ${pillar.displayTitle}`}
                            </span>
                          </button>
                          {/* Both names, stacked. They are the same pillar seen
                              from the Skills Chart and from the Rubric, and an
                              admin needs to see that pairing — the rubric key is
                              what a rating row stores, so renaming the display
                              title above it moves nothing. */}
                          <span className="poag-pillar-cell">
                            <span className="poag-pillar-name">
                              {pillar.displayTitle}
                              {isFocus ? <StatusBadge tone="ok">Pilot focus</StatusBadge> : null}
                            </span>
                            {/* Only when the two names differ. Three of the six
                                pillars are called the same thing in both the
                                Skills Chart and the Rubric, and a derived key
                                always matches its title — printing the same
                                string twice is noise, not a pairing. */}
                            {pillar.rubricKey === pillar.displayTitle ? null : (
                              <code className="poag-rubric-key">{pillar.rubricKey}</code>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        {/* Whether this band is fully authored — the admin's
                            question at a glance. A blank level is a student
                            with nothing to read, so it is called out rather
                            than left to be discovered on expand. */}
                        {written === levels.length ? (
                          <span className="poag-levels-written">
                            {written} of {levels.length}
                          </span>
                        ) : (
                          <StatusBadge tone="error">
                            {written} of {levels.length}
                          </StatusBadge>
                        )}
                      </td>
                      <td>
                        {/* A district-added pillar is neither — there is no
                            Edison rubric behind it to have diverged from. */}
                        {!seeded ? (
                          <StatusBadge tone="ok">Added</StatusBadge>
                        ) : edited ? (
                          <StatusBadge tone="warn">Edited</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">From rubric</StatusBadge>
                        )}
                      </td>
                      <td>
                        <div className="sf-row-actions">
                          <Button
                            color="secondary"
                            size="xs"
                            onClick={() => setEditing(pillar)}
                            iconLeading={
                              <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />
                            }
                          >
                            Edit
                          </Button>

                          {/* Edison's six stay. They are the Portrait of a
                              Graduate as signed off, and ratings across the
                              district already point at their rubric keys. */}
                          {seeded ? null : (
                            <AlertDialog>
                              <AlertDialogTrigger
                                className={cx(
                                  buttonStyles.common.root,
                                  buttonStyles.sizes.xs.root,
                                  buttonStyles.colors["secondary-destructive"].root
                                )}
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                                Remove
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove {pillar.displayTitle}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    It stops being part of the Portrait of a Graduate for every
                                    grade in the district, and its wording goes with it in all
                                    three bands. Ratings teachers already filed against it are not
                                    deleted, but nothing will display them.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogClose
                                    variant="destructive"
                                    onClick={() => removePillar(pillar.rubricKey)}
                                  >
                                    Remove
                                  </AlertDialogClose>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="sf-subrow" id={detailId}>
                        <td colSpan={4}>
                          <p className="poag-hover-text">
                            <strong>Hover definition</strong> · {pillar.hoverText}
                          </p>
                          <p className="poag-descriptor">{content.descriptor}</p>
                          <ol className="poag-levels">
                            {levels.map((level) => (
                              <li key={level.value}>
                                <span className="poag-level-head">
                                  <PoagLevelTrack
                                    level={level.value}
                                    label={`${pillar.displayTitle} at ${level.label}`}
                                  />
                                  <span className="poag-level-name">{level.label}</span>
                                </span>
                                <span className="poag-level-text">
                                  {content.levels[level.value] || "Not yet written."}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="sf-panel-note poag-band-note">
          Wording is stored per grade band, not per grade — editing here changes what all{" "}
          {bandGrades} {band.toLowerCase()} grades across the district read. Grade {grade} is{" "}
          {band} because Edison put every grade up to 5 in Elementary, so the band follows the
          grade rather than the school.
        </p>
      </div>

      {/* ── Distribution ──────────────────────────────────────────────────
          Above coverage: where the grade sits is the read the screen exists to
          give, and the class-by-class coverage table is the chase-up list you
          go to next, so it tails the page rather than standing between the
          wording and the picture of what it produced. */}
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Where this grade sits</h2>
          <span className="sf-panel-note">
            {subject
              ? `${subjectTotals.ratedStudents} of ${subjectTotals.students} rated in ${subject.name}`
              : `${roll} students, no subject mapped`}
          </span>
        </div>

        {!subject || subjectTotals.ratedStudents === 0 ? (
          <EmptyState
            title="Nothing rated yet"
            message={
              subject
                ? `No ${subject.name} class in this grade has recorded a rating for the current marking period, so there is no distribution to show.`
                : "POAG ratings are held per subject, and no subject is mapped to this grade."
            }
          />
        ) : (
          <>
            <div className="poag-controls">
              <label className="sf-field">
                <span>Subject</span>
                <Combobox
                  options={subjectOptions}
                  value={subject.id}
                  onChange={setSubjectId}
                  ariaLabel="Subject to break down"
                />
              </label>
              {/* Says why there is no "all subjects" option here, so its absence
                  reads as a decision rather than a gap. */}
              <p className="sf-field-hint">
                One subject at a time. A rating is one teacher&rsquo;s judgement in one class, and
                v1 defines no rule for combining a student&rsquo;s Critical Thinking in Mathematics
                with the same pillar in Science — so there is no across-subjects view.
              </p>
            </div>

            {/* Tints come from the level's position on the scale rather than a
                fixed class per level — see poagLevelTint: four hand-picked
                colours cannot stretch to a scale the district can add to. */}
            <ul className="poag-legend">
              {levels.map((level) => (
                <li key={level.value}>
                  <span
                    className="poag-legend-swatch"
                    style={{ background: poagLevelTint(level.value, levels.length).background }}
                    aria-hidden="true"
                  />
                  {level.label}
                </li>
              ))}
            </ul>

            <div className="poag-dist">
              {distribution.map((row) => (
                <div className="poag-dist-row" key={row.rubricKey}>
                  <span className="poag-dist-label">{row.displayTitle}</span>
                  <span className="poag-dist-track">
                    {row.counts.map((count, level) => {
                      if (count === 0) return null;
                      const pct = (count / row.rated) * 100;
                      const tint = poagLevelTint(level, levels.length);
                      return (
                        <span
                          key={level}
                          className="poag-dist-seg"
                          data-ink={tint.lightInk ? "light" : undefined}
                          style={{ width: `${pct}%`, background: tint.background }}
                          /* Counts are printed in the segment and repeated here
                             for anyone who can't read a 4%-wide one, so the
                             chart never depends on colour or width alone. */
                          title={`${levels[level]?.label ?? ""}: ${count} students`}
                        >
                          <span className="poag-dist-count">{count}</span>
                        </span>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>

            <p className="sf-panel-note">
              Counts are {subject.name} students rated this marking period, not the whole grade. A
              pillar no teacher has rated yet reads as zero rather than as everyone at Learning.
            </p>
          </>
        )}
      </div>

      {/* ── Rating coverage ─────────────────────────────────────────────── */}
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Rating coverage</h2>
          <span className="sf-panel-note">
            {totals.ratedClasses} of {totals.classes} classes · {totals.ratedStudents} of{" "}
            {totals.students} student ratings in
          </span>
        </div>

        {!hasSubjects ? (
          <EmptyState
            title="No subjects mapped to this grade"
            message="POAG ratings are held per subject, so a grade with no mapped subject has nowhere to record one. Map a subject to this grade in System Settings first."
            action={
              <Button color="secondary" size="sm" href="/system-settings/subjects">
                Open Subject management
              </Button>
            }
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Class</th>
                  <th scope="col">Principal teacher</th>
                  <th scope="col">Students</th>
                  <th scope="col">Rated</th>
                  <th scope="col">Last rated</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((row) => {
                  const complete = row.rated >= row.students && row.students > 0;
                  return (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>
                        {row.principalTeacher ?? (
                          /* Does not occur in the current export — every one of
                             the 2,291 classes has exactly one primary teacher —
                             but a class that lost one would be unratable, so it
                             is called out rather than rendered as a blank. */
                          <StatusBadge tone="error">No primary teacher</StatusBadge>
                        )}
                      </td>
                      <td>{row.students}</td>
                      <td>{row.rated}</td>
                      <td>{row.lastRatedAt ? formatDateTime(row.lastRatedAt) : "—"}</td>
                      <td>
                        {complete ? (
                          <StatusBadge tone="ok">Complete</StatusBadge>
                        ) : row.rated > 0 ? (
                          <StatusBadge tone="warn">{row.students - row.rated} outstanding</StatusBadge>
                        ) : (
                          <StatusBadge tone="error">Not started</StatusBadge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="sf-panel-note poag-coverage-note">
          Only the principal teacher of a class may rate it — taken from the{" "}
          <code>primary</code>{" "}
          flag already in Edison&rsquo;s OneRoster export, so rights move with
          the roster if a section is reassigned mid-year. Co-teachers have read access and no
          write.
          {unmapped.length > 0 ? (
            <>
              {" "}
              {unmapped.map((subject) => subject.name).join(", ")}{" "}
              {unmapped.length === 1 ? "is" : "are"} unmapped to any grade, so{" "}
              {unmapped.length === 1 ? "it has" : "they have"} no POAG coverage anywhere —{" "}
              <Link className="sf-inline-link" href="/system-settings/subjects">
                map {unmapped.length === 1 ? "it" : "them"} in Subject management
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>

      {editing || adding ? (
        <PoagContentDrawer
          pillar={editing}
          band={band}
          bandGradeCount={bandGrades}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      ) : null}

      {importing ? (
        <PoagImportDrawer band={band} onClose={() => setImporting(false)} />
      ) : null}

    </>
  );
}
