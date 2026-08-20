"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminRole } from "@/lib/data/adminUsers";
import { ManualInviteForm } from "./ManualInviteForm";
import { CsvInviteImport } from "./CsvInviteImport";

type Step = "choice" | "manual" | "csv";

const TITLES: Record<Step, string> = {
  choice: "Invite User",
  manual: "Invite User",
  csv: "Bulk Invite from CSV"
};

const DESCRIPTIONS: Record<Step, string> = {
  choice: "Invite one admin, or bring in a batch from a spreadsheet.",
  manual: "Name, email, role(s) and scope.",
  csv: "Upload a CSV to invite a batch of admin accounts at once."
};

/**
 * A right-side drawer, not a centered modal — same pattern as Academic
 * Goals' "Set a goal" drawer, so the admin user list stays visible and in
 * place behind it instead of being hidden behind an overlay.
 */
export function InviteAdminUserModal({
  onClose,
  grantable
}: {
  onClose: () => void;
  /** Roles the person sending this invite may hand out. */
  grantable?: AdminRole[];
}) {
  const { addUser, addUsers } = useAdminUsers();
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
                  <HugeiconsIcon icon={UserIcon} size={26} strokeWidth={1.8} />
                </span>
                <span className="sf-choice-card-title">Invite one person</span>
                <span className="sf-choice-card-desc">Name, email, role(s) and scope.</span>
              </button>

              <button type="button" className="sf-choice-card" onClick={() => setStep("csv")}>
                <span className="sf-choice-icon">
                  <HugeiconsIcon icon={File01Icon} size={26} strokeWidth={1.8} />
                </span>
                <span className="sf-choice-card-title">Bulk invite via CSV</span>
                <span className="sf-choice-card-desc">
                  Useful at school-year start/end when a batch turns over at once.
                </span>
              </button>
            </div>
          ) : step === "manual" ? (
            <ManualInviteForm
              grantable={grantable}
              onBack={() => setStep("choice")}
              onInvite={(user) => {
                addUser(user);
                onClose();
              }}
            />
          ) : (
            <CsvInviteImport
              onBack={() => setStep("choice")}
              onImport={(users) => {
                addUsers(users);
                onClose();
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
