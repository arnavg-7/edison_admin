"use client";

import { Fragment, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload03Icon } from "@hugeicons/core-free-icons";
import { POAG_BANDS, type PoagBand } from "@/lib/data/poag";
import {
  bandsMissingFor,
  parsePoagCsv,
  poagCsvTemplate,
  poagLevelColumn,
  type PoagCsvResult
} from "@/lib/poagCsv";
import { usePoag } from "@/lib/poag-store";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

function downloadTemplate(levelLabels: string[]) {
  const blob = new Blob([poagCsvTemplate(levelLabels)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "poag-content-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk load of pillars and their level definitions — the admin-side "load
 * poag_content from POAG_Content_Master.xlsx", which is step one of the build
 * sequence and the reason the wording is in a table rather than in code.
 *
 * Merges rather than replaces, the same way the Skill groups import does: a row
 * for a pillar that already exists rewords it, a row for one that does not adds
 * it, and anything the file does not mention is left alone. A file covering only
 * High School is a normal thing to upload and must not wipe the other two bands.
 *
 * Nothing is applied until Import is pressed, and every row that will not load
 * says why first — a silent partial import of a district's rubric would be worse
 * than no import.
 */
export function PoagImportDrawer({ band, onClose }: { band: PoagBand; onClose: () => void }) {
  const { pillars, levels, importContent } = usePoag();
  const [result, setResult] = useState<PoagCsvResult | null>(null);
  const [fileName, setFileName] = useState("");

  const levelLabels = levels.map((level) => level.label);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setResult(
      parsePoagCsv(
        text,
        pillars.map((pillar) => pillar.rubricKey),
        levelLabels
      )
    );
    setFileName(file.name);
  };

  const apply = () => {
    if (!result || result.rows.length === 0) return;

    importContent(
      result.rows.map((row) => ({
        pillar: {
          displayTitle: row.displayTitle,
          rubricKey: row.rubricKey,
          hoverText: row.hoverText,
          subjectIds: row.subjectIds
        },
        /* A blank subjects column means "not stated", not "all subjects" — a
           sheet carrying only wording must not silently unscope a pillar it
           never mentions. */
        keepSubjects: row.subjectsUnset,
        band: row.band,
        content: { descriptor: row.descriptor, levels: row.levels }
      }))
    );
    onClose();
  };

  /* A pillar the file adds for one band only is still live everywhere — teachers
     in the other bands would see it with nothing written underneath. Named per
     pillar before importing rather than left to be found later. */
  const gaps = result
    ? result.newPillars
        .map((pillar) => ({ ...pillar, missing: bandsMissingFor(result, pillar.rubricKey) }))
        .filter((entry) => entry.missing.length > 0)
    : [];

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Bulk upload pillars</SheetTitle>
          <SheetDescription>
            One row per pillar per grade band. Existing pillars are reworded, new ones are added,
            and anything the file leaves out stays as it is.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="poag-drawer-fields">
            {/* The level columns are the district's live scale, so they are
                listed from it rather than written out — a district that added a
                level needs its column named here, not Edison's original four. */}
            <p className="sf-panel-note">
              Columns: <code>display_title</code>, <code>rubric_key</code>, <code>hover_text</code>,{" "}
              <code>band</code>, <code>descriptor</code>, then one column per level —{" "}
              {levelLabels.map((label, index) => (
                <Fragment key={label}>
                  {index > 0 ? ", " : null}
                  <code>{poagLevelColumn(label)}</code>
                </Fragment>
              ))}
              . Order does not matter; the header names do. <code>band</code> is one of{" "}
              {POAG_BANDS.join(", ")}. Leave <code>rubric_key</code> blank on a new pillar and it is
              taken from the title.
            </p>

            <button
              type="button"
              className="sf-inline-btn"
              onClick={() => downloadTemplate(levelLabels)}
            >
              Download a template CSV
            </button>

            <label className="sf-field">
              <span>CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <span className="sf-field-hint">
                Currently viewing {band} wording, but an upload applies to whichever bands the file
                names.
              </span>
            </label>

            {result ? (
              <div>
                <p className="sf-panel-note">
                  {fileName}: {result.rows.length} row{result.rows.length === 1 ? "" : "s"} ready
                  {result.issues.length > 0 ? `, ${result.issues.length} skipped` : ""}
                  {result.bands.length > 0 ? ` · ${result.bands.join(", ")}` : ""}
                </p>

                {result.newPillars.length > 0 || result.updatedPillars.length > 0 ? (
                  <p className="sf-card-hint">
                    {result.newPillars.length > 0
                      ? `Adds ${result.newPillars.length} pillar${result.newPillars.length === 1 ? "" : "s"}: ${result.newPillars.map((pillar) => pillar.displayTitle).join(", ")}. `
                      : ""}
                    {result.updatedPillars.length > 0
                      ? `Rewords ${result.updatedPillars.length} existing pillar${result.updatedPillars.length === 1 ? "" : "s"}.`
                      : ""}
                  </p>
                ) : null}

                {gaps.length > 0 ? (
                  <p className="sf-field-error">
                    {gaps
                      .map(
                        (entry) =>
                          `${entry.displayTitle} has no wording for ${entry.missing.join(" or ")}`
                      )
                      .join("; ")}
                    . Those bands will show the pillar with empty levels until it is written.
                  </p>
                ) : null}

                {result.issues.length > 0 || result.rows.length > 0 ? (
                  <ul className="sf-csv-row-list">
                    {result.issues.map((issue) => (
                      <li key={`issue-${issue.line}`} className="is-error">
                        <StatusBadge tone="error">Skipped</StatusBadge>
                        <span>
                          Line {issue.line}: {issue.message}
                        </span>
                      </li>
                    ))}
                    {result.rows.map((row) => (
                      <li key={`row-${row.line}`} className="is-ok">
                        <StatusBadge tone="ok">Ready</StatusBadge>
                        <span>
                          Line {row.line}: {row.displayTitle} · {row.band}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button
            size="sm"
            onClick={apply}
            isDisabled={!result || result.rows.length === 0}
            iconLeading={<HugeiconsIcon icon={Upload03Icon} size={16} strokeWidth={2} />}
          >
            Import {result && result.rows.length > 0 ? result.rows.length : ""} row
            {result?.rows.length === 1 ? "" : "s"}
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
