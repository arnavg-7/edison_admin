"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload03Icon } from "@hugeicons/core-free-icons";
import {
  parseSchoolSetupCsv,
  schoolSetupCsvTemplate,
  type SetupCsvResult
} from "@/lib/schoolSetupCsv";
import { useSchoolSetup } from "@/lib/school-setup-store";
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

function downloadTemplate() {
  const blob = new Blob([schoolSetupCsvTemplate()], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "school-master-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk load of the district hierarchy from a spreadsheet — the realistic way a
 * district stands this up, rather than adding two hundred batches by hand.
 *
 * Merges rather than replaces, the same way the POAG and Skill groups imports
 * do: a row lands on the school, grade or batch it names if that already exists
 * and creates it if not, and anything the file never mentions is untouched. A
 * sheet covering one school must not wipe the other four.
 *
 * Nothing is applied until Import is pressed, and every rejected row says why
 * first — a half-applied hierarchy is worse than none, because every figure on
 * Home and Reporting hangs off it.
 */
export function SetupImportDrawer({ onClose }: { onClose: () => void }) {
  const { district, importHierarchy } = useSchoolSetup();
  const [result, setResult] = useState<SetupCsvResult | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    const text = await file.text();
    setResult(parseSchoolSetupCsv(text, district));
    setFileName(file.name);
  };

  const apply = () => {
    if (!result || result.rows.length === 0) return;
    importHierarchy(result.rows);
    onClose();
  };

  const ready = result?.rows.length ?? 0;

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Bulk upload schools</SheetTitle>
          <SheetDescription>
            One row per batch, with the school and grade columns repeating. Existing records are
            updated, missing ones are created, and anything the file leaves out stays as it is.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="poag-drawer-fields">
            <p className="sf-panel-note">
              Columns: <code>school</code>, <code>school_code</code>, <code>level</code>,{" "}
              <code>principal</code>, <code>city</code>, <code>grade</code>, <code>stream</code>,{" "}
              <code>grade_lead</code>, <code>batch</code>, <code>year</code>,{" "}
              <code>capacity</code>. Only <code>school</code> is required; order does not matter,
              the header names do. A row can stop early — a school with no grade creates the
              school alone, and a grade with no batch creates the grade ready for batches.
            </p>

            <button type="button" className="sf-inline-btn" onClick={downloadTemplate}>
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
              {/* Enrollment is measured, not configured. Saying so here stops
                  someone adding a column that would be silently ignored. */}
              <span className="sf-field-hint">
                There is no enrolled column — head counts sync from Genesis, so an imported batch
                starts empty and fills from the roster.
              </span>
            </label>

            {result ? (
              <div>
                <p className="sf-panel-note">
                  {fileName}: {ready} row{ready === 1 ? "" : "s"} ready
                  {result.issues.length > 0 ? `, ${result.issues.length} skipped` : ""}
                </p>

                {ready > 0 ? (
                  <p className="sf-card-hint">
                    {[
                      result.newSchools.length > 0
                        ? `Adds ${result.newSchools.length} school${result.newSchools.length === 1 ? "" : "s"} (${result.newSchools.join(", ")})`
                        : null,
                      result.newGrades.length > 0
                        ? `${result.newGrades.length} grade${result.newGrades.length === 1 ? "" : "s"}`
                        : null,
                      result.newBatches > 0
                        ? `${result.newBatches} batch${result.newBatches === 1 ? "" : "es"}`
                        : null,
                      result.updated > 0 ? `updates ${result.updated} existing` : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    .
                  </p>
                ) : null}

                {result.issues.length > 0 || ready > 0 ? (
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
                          Line {row.line}: {row.school}
                          {row.grade ? ` · ${row.grade}` : ""}
                          {row.batch ? ` · ${row.batch}` : ""}
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
            isDisabled={ready === 0}
            iconLeading={<HugeiconsIcon icon={Upload03Icon} size={16} strokeWidth={2} />}
          >
            Import {ready > 0 ? ready : ""} row{ready === 1 ? "" : "s"}
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
