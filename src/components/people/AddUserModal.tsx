"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CsvIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import type { Person } from "@/lib/data/people";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ManualUserForm } from "./ManualUserForm";
import { CsvUserImport } from "./CsvUserImport";

type Step = "choice" | "manual" | "csv";

const TITLES: Record<Step, string> = {
  choice: "Add User",
  manual: "Add User Manually",
  csv: "Import Users from CSV"
};

const DESCRIPTIONS: Record<Step, string> = {
  choice: "Add one person at a time, or bring in a batch from a spreadsheet.",
  manual: "Fill in the required fields to create a new profile.",
  csv: "Upload a CSV of new students or faculty to add in bulk."
};

/**
 * A right-side drawer, not a centered modal — same reasoning as Academic
 * Goals' "Set a goal" drawer: the People results table stays visible and in
 * place behind it instead of being hidden behind an overlay, which matters
 * more here since the CSV step shows a preview the admin may want to check
 * against who's already listed.
 */
export function AddUserModal({
  onClose,
  onCreate,
  onCreateMany
}: {
  onClose: () => void;
  onCreate: (person: Person) => void;
  onCreateMany: (people: Person[]) => void;
}) {
  const [step, setStep] = useState<Step>("choice");

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{TITLES[step]}</SheetTitle>
          <SheetDescription>{DESCRIPTIONS[step]}</SheetDescription>
        </SheetHeader>

        {/* flex column, not overflow-y-auto directly on this div: the manual/csv
            steps need their own fields-scroll-vs-actions-footer split (each
            form is `flex h-full flex-col` internally), which only works if
            this ancestor hands them a real height to fill instead of just
            scrolling everything — actions included — as one column. */}
        <div className="flex min-h-0 flex-1 flex-col px-6 pt-2 pb-6">
          {step === "choice" ? (
            <div className="sf-choice-grid">
              <button type="button" className="sf-choice-card" onClick={() => setStep("manual")}>
                <span className="sf-choice-icon">
                  <HugeiconsIcon icon={UserAdd01Icon} size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="sf-choice-card-head">
                  <span className="sf-choice-card-title">Create manually</span>
                  {/* Each card opens a further step, so it carries the same forward
                      cue a row link would. Dim rather than hidden at rest: on touch
                      there is no hover to reveal it. */}
                  <HugeiconsIcon
                    className="sf-choice-card-go"
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <span className="sf-choice-card-desc">Add one user at a time with a short form.</span>
              </button>

              <button type="button" className="sf-choice-card" onClick={() => setStep("csv")}>
                <span className="sf-choice-icon">
                  <HugeiconsIcon icon={CsvIcon} size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="sf-choice-card-head">
                  <span className="sf-choice-card-title">Upload a CSV</span>
                  <HugeiconsIcon
                    className="sf-choice-card-go"
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <span className="sf-choice-card-desc">Bulk-add users from a spreadsheet export.</span>
              </button>
            </div>
          ) : step === "manual" ? (
            <ManualUserForm
              onBack={() => setStep("choice")}
              onCreate={(person) => {
                onCreate(person);
                onClose();
              }}
            />
          ) : (
            <CsvUserImport
              onBack={() => setStep("choice")}
              onImport={(people) => {
                onCreateMany(people);
                onClose();
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
