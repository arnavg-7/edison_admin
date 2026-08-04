"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CsvIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import type { Person } from "@/lib/data/people";
import { Modal } from "@/components/shared/Modal";
import { ManualUserForm } from "./ManualUserForm";
import { CsvUserImport } from "./CsvUserImport";

type Step = "choice" | "manual" | "csv";

const TITLES: Record<Step, string> = {
  choice: "Add User",
  manual: "Add User Manually",
  csv: "Import Users from CSV"
};

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
    <Modal title={TITLES[step]} onClose={onClose} size="lg">
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
          onCancel={onClose}
          onCreate={(person) => {
            onCreate(person);
            onClose();
          }}
        />
      ) : (
        <CsvUserImport
          onBack={() => setStep("choice")}
          onCancel={onClose}
          onImport={(people) => {
            onCreateMany(people);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
