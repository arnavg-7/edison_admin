"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { schools } from "@/lib/data/schools";
import { Button } from "@/components/base/buttons/button";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import type { ExportCategory, ExportEntityType, ExportFormat } from "@/app/api/exports/download/route";

const CATEGORY_OPTIONS: ComboboxOption<ExportCategory>[] = [
  { value: "full_report", label: "Full Report" },
  { value: "attendance", label: "Attendance" }
];

const ENTITY_OPTIONS: ComboboxOption<ExportEntityType>[] = [
  { value: "all", label: "Students & Faculty" },
  { value: "student", label: "Students Only" },
  { value: "faculty", label: "Faculty Only" }
];

const SCHOOL_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All schools" },
  ...schools.map((school) => ({ value: school.id, label: school.name }))
];

const FORMAT_OPTIONS: ComboboxOption<ExportFormat>[] = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "XLSX" }
];

/**
 * "Download report" on every reporting tab, replacing the old version of
 * this same button (one fixed CSV/PDF export of every KPI on the Metrics
 * Catalog page only) with a scoped request: pick a category, an entity, a
 * school, and a format, and only that slice comes back.
 *
 * Every field is a Combobox, including Data Category: the ticket offered a
 * choice of radio or dropdown, and a dropdown keeps all four fields one
 * control family instead of mixing a radio group in with three dropdowns.
 *
 * Only two categories are offered. Grades/Marks and Faculty Logs have no
 * data model anywhere in this app, and building them would mean inventing a
 * dataset from nothing. Grade/Section and Date Range sub-filters aren't
 * offered for the same reason: neither Attendance nor Full Report has
 * per-grade or per-day figures to narrow by yet. School and Target Entity
 * are real filters, the API route actually narrows rows by them.
 *
 * Buttons run on the Untitled button (not the shadcn one some earlier drafts
 * of this drawer used) at size="sm", the same engine and size every other
 * drawer's Save/Cancel pair in this app uses, so this reads as one drawer
 * system rather than a one-off.
 */
export function ExportReportDrawer() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ExportCategory>("full_report");
  const [entityType, setEntityType] = useState<ExportEntityType>("all");
  const [institutionId, setInstitutionId] = useState("all");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExport = async () => {
    setIsExporting(true);
    setError(null);

    const params = new URLSearchParams({ category, entity_type: entityType, format });
    if (institutionId !== "all") params.set("institution_id", institutionId);

    try {
      const response = await fetch(`/api/exports/download?${params.toString()}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? `Export failed (${response.status}).`);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${category}-export.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError("Export failed. Check your connection and try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        className="sf-print-hide"
        size="sm"
        onClick={() => setOpen(true)}
        iconLeading={<HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={2} />}
      >
        Download report
      </Button>

      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
      >
        <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Download report</SheetTitle>
            <SheetDescription>
              Export exactly the data you need, scoped to a category, entity and school, not the
              whole report.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <div className="list-editor-form list-editor-form--drawer">
              <label className="sf-field">
                <span>Data Category</span>
                <Combobox
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(value) => setCategory(value)}
                />
              </label>

              {/* Two halves of one setting — who and where the export covers —
                  same pattern GlobalFilterBar's own School/Grade pair uses,
                  rather than four flat fields all reading as equally
                  unrelated to each other. */}
              <div className="sf-field-row">
                <label className="sf-field">
                  <span>Target Entity</span>
                  <Combobox
                    options={ENTITY_OPTIONS}
                    value={entityType}
                    onChange={(value) => setEntityType(value)}
                  />
                </label>

                <label className="sf-field">
                  <span>School</span>
                  <Combobox
                    options={SCHOOL_OPTIONS}
                    value={institutionId}
                    onChange={setInstitutionId}
                  />
                </label>
              </div>

              <label className="sf-field">
                <span>File Format</span>
                <Combobox
                  options={FORMAT_OPTIONS}
                  value={format}
                  onChange={(value) => setFormat(value)}
                />
              </label>

              {category === "attendance" && entityType === "faculty" ? (
                <p className="sf-field-error">
                  This district has no per-faculty attendance dataset. This combination will return
                  no rows.
                </p>
              ) : null}

              {error ? <p className="sf-field-error">{error}</p> : null}
            </div>
          </div>

          <SheetFooter className="flex-row">
            <Button size="sm" onClick={runExport} isDisabled={isExporting}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
            <Button color="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
