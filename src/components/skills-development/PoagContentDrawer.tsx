"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  POAG_BANDS,
  isSeedPillar,
  seedPoagLevels,
  poagRubricKeyFrom,
  type PoagBand,
  type PoagBandContent,
  type PoagPillar
} from "@/lib/data/poag";
import { usePoag } from "@/lib/poag-store";
import { subjects } from "@/lib/data/systemSettings";
import { MultiCombobox } from "@/components/shared/MultiCombobox";
import { Button } from "@/components/base/buttons/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

/**
 * Editing the wording one band's students and teachers read for one pillar.
 *
 * A right-side drawer, matching the Development areas editor next door — the
 * pillar table stays visible behind it, so the row being reworded is still on
 * screen while it is reworded.
 *
 * The header states the blast radius before anything is typed. Content is held
 * per band, so this is not an edit to Grade 9 at Edison High: it is an edit to
 * every High School grade in the district, and an admin should know that before
 * they start rather than after they save.
 */
export function PoagContentDrawer({
  pillar,
  band,
  bandGradeCount,
  onClose
}: {
  /** null to add a new pillar; a pillar to reword an existing one. */
  pillar: PoagPillar | null;
  band: PoagBand;
  /** How many grades across the district read this band's text. */
  bandGradeCount: number;
  onClose: () => void;
}) {
  const {
    pillars,
    levels,
    contentFor,
    updateContent,
    addPillar,
    updatePillar,
    addLevel,
    renameLevel,
    removeLevel,
    isEdited,
    resetContent
  } = usePoag();
  const isNew = pillar === null;
  const saved = pillar ? contentFor(band, pillar.rubricKey) : null;

  const [title, setTitle] = useState(pillar?.displayTitle ?? "");
  const [hover, setHover] = useState(pillar?.hoverText ?? "");
  /* Only editable while adding. After that it is what every rating already filed
     against this pillar points at, so changing it would orphan them. */
  const [rubricKey, setRubricKey] = useState(pillar?.rubricKey ?? "");
  /* Empty means every subject. Kept as the empty list rather than "all the ids"
     so a subject added to the district later is picked up automatically. */
  const [subjectIds, setSubjectIds] = useState<string[]>(pillar?.subjectIds ?? []);
  const [keyTouched, setKeyTouched] = useState(false);

  /* Sized to the live scale, not to what was stored: a pillar written before the
     district added a level has one fewer string saved than there are fields. */
  /* The scale is drafted here rather than written straight through to the
     store. It is district-wide state reached from a drawer that offers Cancel,
     and a Cancel that leaves a renamed level and an extra column behind is not
     a cancel. Committed alongside the wording on save. */
  const [scale, setScale] = useState<string[]>(() => levels.map((level) => level.label));

  const [draft, setDraft] = useState<PoagBandContent>({
    descriptor: saved?.descriptor ?? "",
    levels: levels.map((level) => saved?.levels[level.value] ?? "")
  });

  const effectiveKey = isNew ? (keyTouched ? rubricKey.trim() : poagRubricKeyFrom(title)) : rubricKey;
  const duplicateKey =
    isNew && effectiveKey !== "" && pillars.some((entry) => entry.rubricKey === effectiveKey);

  const setLevel = (index: number, value: string) =>
    setDraft((current) => {
      // Padded rather than indexed into: a level added since the draft was
      // taken would otherwise leave a hole in the array.
      const next = Array.from(
        { length: Math.max(current.levels.length, index + 1) },
        (_, at) => current.levels[at] ?? ""
      );
      next[index] = value;
      return { ...current, levels: next };
    });

  /* Counted against the live scale, not the draft: adding a level with the
     drawer open leaves the draft one entry short, and a blank that the draft
     does not yet have a slot for is still a blank. */
  const missing = scale.filter(
    (_, index) => (draft.levels[index] ?? "").trim() === ""
  ).length;
  /* An unnamed level would render as a blank column header on the faculty
     matrix, so it blocks the save the same way blank wording does. */
  const blankLevelName = scale.some((label) => label.trim() === "");
  const canSave =
    title.trim() !== "" &&
    hover.trim() !== "" &&
    effectiveKey !== "" &&
    !duplicateKey &&
    draft.descriptor.trim() !== "" &&
    !blankLevelName &&
    missing === 0;

  const save = () => {
    if (!canSave) return;

    /* Scale first, so the content written below lands against the positions it
       was written for. Removals run top-down — the store only ever drops the
       top level, so taking them in any other order would drop the wrong one. */
    for (let index = levels.length - 1; index >= scale.length; index -= 1) {
      removeLevel(index);
    }
    scale.forEach((label, index) => {
      if (index >= levels.length) addLevel(label.trim());
      else if (label.trim() !== levels[index].label) renameLevel(index, label.trim());
    });

    if (isNew) {
      addPillar({
        displayTitle: title.trim(),
        rubricKey: effectiveKey,
        hoverText: hover.trim(),
        subjectIds
      });
    } else {
      updatePillar(effectiveKey, {
        displayTitle: title.trim(),
        hoverText: hover.trim(),
        subjectIds
      });
    }

    updateContent(band, effectiveKey, {
      descriptor: draft.descriptor.trim(),
      // Exactly one entry per level on the scale as it stands at save time.
      levels: scale.map((_, index) => (draft.levels[index] ?? "").trim())
    });
    onClose();
  };

  const revert = () => {
    if (!pillar) return;
    resetContent(band, pillar.rubricKey);
    onClose();
  };

  /* A new pillar is live in all three bands the moment it exists, but this
     drawer only writes one of them — so the other two are named up front. */
  const otherBands = POAG_BANDS.filter((entry) => entry !== band);

  const subjectOptions = subjects.map((subject) => ({
    value: subject.id,
    label: subject.name
  }));
  const subjectNames = subjects
    .filter((subject) => subjectIds.includes(subject.id))
    .map((subject) => subject.name)
    .join(" and ");

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Variant-prefixed width, same as the Development areas drawer: a plain
          sm:max-w-* loses to SheetContent's own data-[side=right] class. */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isNew ? "Add pillar" : pillar.displayTitle}</SheetTitle>
          <SheetDescription>
            {isNew
              ? `A new pillar joins the Portrait of a Graduate for every grade in the district. You are writing its ${band} wording here.`
              : `${band} wording. Saving changes what every ${band.toLowerCase()} grade reads — ${bandGradeCount} ${bandGradeCount === 1 ? "grade" : "grades"} across the district, not just this one.`}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="poag-drawer-fields">
            {/* Title and hover are district-wide; everything below them is this
                band only. Both are editable — they are what the UI shows — while
                the rubric key is not, because it is what a rating row stores. */}
            <label className="sf-field">
              <span>Display title</span>
              <input
                type="text"
                value={title}
                placeholder="e.g. Curiosity"
                onChange={(event) => setTitle(event.target.value)}
              />
              <span className="sf-field-hint">
                The only name anyone sees. Shared by all three bands.
              </span>
            </label>

            <label className="sf-field">
              <span>Rubric key</span>
              <input
                type="text"
                value={effectiveKey}
                readOnly={!isNew}
                placeholder="Taken from the title if left blank"
                onChange={(event) => {
                  setKeyTouched(true);
                  setRubricKey(event.target.value);
                }}
              />
              <span className={duplicateKey ? "sf-field-error" : "sf-field-hint"}>
                {duplicateKey
                  ? `"${effectiveKey}" is already in use. Two pillars sharing a key would join to the same ratings.`
                  : isNew
                    ? "Set once, then permanent — it is what every rating filed against this pillar points at."
                    : "Fixed. Renaming the title above moves no existing rating."}
              </span>
            </label>

            <label className="sf-field">
              <span>Hover definition</span>
              <textarea
                rows={2}
                value={hover}
                placeholder="The Skills Chart one-liner shown on hover."
                onChange={(event) => setHover(event.target.value)}
              />
              <span className="sf-field-hint">Shared by all three bands, like the title.</span>
            </label>

            {/* Which subjects rate this pillar. Sits with the title and hover
                because it is a fact about the pillar across the district, not
                about this band's wording — and it decides who is ever asked for
                it: a pillar scoped to Science never appears to a Maths teacher. */}
            <label className="sf-field">
              <span>Rated in</span>
              <MultiCombobox
                options={subjectOptions}
                values={subjectIds}
                onChange={setSubjectIds}
                resetLabel="All subjects"
                ariaLabel="Subjects this pillar is rated in"
                summarize={(picked) => `${picked.length} subjects`}
              />
              <span className="sf-field-hint">
                {subjectIds.length === 0
                  ? "Every subject, including any added later. Edison's six are district-wide competencies, so they stay unscoped."
                  : `Only ${subjectNames} teachers are asked for this pillar. The others never see it, and it is left out of their coverage.`}
              </span>
            </label>

            {isNew ? (
              <p className="sf-field-hint">
                This writes {band} wording only. {otherBands.join(" and ")} will show the pillar
                with empty levels until someone writes theirs — or upload all three bands at once
                from the bulk import.
              </p>
            ) : null}

            <label className="sf-field">
              <span>Grade-band descriptor</span>
              <textarea
                rows={2}
                value={draft.descriptor}
                placeholder="One line summarising this pillar for this band."
                onChange={(event) =>
                  setDraft((current) => ({ ...current, descriptor: event.target.value }))
                }
              />
              <span className="sf-field-hint">
                Shown at the top of the row when a teacher or student expands it.
              </span>
            </label>

            {/* The scale lives here rather than in a section of its own: the
                levels are the columns of the very table being written, and an
                admin defining a pillar is the person who knows whether the four
                positions fit it. Every control below is district-wide, which the
                note says before any of them is touched. */}
            <div className="poag-scale-head">
              <span className="sf-field-label">Levels</span>
              <span className="sf-panel-note">{scale.length} on the scale · district-wide</span>
            </div>

            {scale.map((label, index) => {
              /* Removable only at the top, and only if the district put it
                 there — the store enforces the same rule. A rating filed at a
                 position that stopped existing has nowhere to go. */
              const removable =
                index >= seedPoagLevels.length && index === scale.length - 1;

              return (
                <div className="sf-field poag-level-field" key={index}>
                  <div className="poag-level-label">
                    {/* Numbered outside the input: the position is the meaning
                        and is not the admin's to change, whereas the name is. */}
                    <span className="poag-level-ordinal">Level {index + 1}</span>
                    <input
                      type="text"
                      className="poag-level-name-input"
                      value={label}
                      aria-label={`Name of level ${index + 1}`}
                      onChange={(event) =>
                        setScale((current) =>
                          current.map((entry, at) => (at === index ? event.target.value : entry))
                        )
                      }
                    />
                    {removable ? (
                      <button
                        type="button"
                        className="sf-icon-btn sf-icon-btn--danger"
                        aria-label={`Remove ${label} from the scale`}
                        onClick={() => setScale((current) => current.slice(0, -1))}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    rows={3}
                    value={draft.levels[index] ?? ""}
                    placeholder={`What ${label || `level ${index + 1}`} looks like for a ${band.toLowerCase()} student.`}
                    onChange={(event) => setLevel(index, event.target.value)}
                  />
                </div>
              );
            })}

            <div className="poag-scale-actions">
              <Button
                color="secondary"
                size="sm"
                onClick={() => setScale((current) => [...current, `Level ${current.length + 1}`])}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
              >
                Add level
              </Button>
              <span className="sf-field-hint">
                Joins the top of the progression, never the middle — a rating stores the position
                it was filed at, so inserting below one would move it. Renaming changes the scale
                for every pillar in every band; Edison&rsquo;s {seedPoagLevels.length} can be
                reworded but not removed.
              </span>
            </div>

            {blankLevelName ? (
              <p className="sf-field-error">Every level needs a name.</p>
            ) : null}

            {missing > 0 ? (
              <p className="sf-field-error">
                All {levels.length} levels need text — a student sitting on a blank level has
                nothing to read.
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            {isNew ? "Create pillar" : "Save wording"}
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {/* Only Edison's own six have a rubric to revert to. */}
          {pillar && isSeedPillar(pillar.rubricKey) && isEdited(band, pillar.rubricKey) ? (
            <Button color="tertiary" size="sm" onClick={revert}>
              Revert to rubric
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
