"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CsvIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Modal } from "@/components/shared/Modal";
import { ManualInviteForm } from "./ManualInviteForm";
import { CsvInviteImport } from "./CsvInviteImport";

type Step = "choice" | "manual" | "csv";

const TITLES: Record<Step, string> = {
  choice: "Invite User",
  manual: "Invite User",
  csv: "Bulk Invite from CSV"
};

export function InviteAdminUserModal({ onClose }: { onClose: () => void }) {
  const { addUser, addUsers } = useAdminUsers();
  const [step, setStep] = useState<Step>("choice");

  return (
    <Modal title={TITLES[step]} onClose={onClose} size="lg">
      {step === "choice" ? (
        <div className="sf-choice-grid">
          <button type="button" className="sf-choice-card" onClick={() => setStep("manual")}>
            <span className="sf-choice-icon">
              <HugeiconsIcon icon={UserAdd01Icon} size={26} strokeWidth={1.8} />
            </span>
            <span className="sf-choice-card-title">Invite one person</span>
            <span className="sf-choice-card-desc">Name, email, role(s) and scope.</span>
          </button>

          <button type="button" className="sf-choice-card" onClick={() => setStep("csv")}>
            <span className="sf-choice-icon">
              <HugeiconsIcon icon={CsvIcon} size={26} strokeWidth={1.8} />
            </span>
            <span className="sf-choice-card-title">Bulk invite via CSV</span>
            <span className="sf-choice-card-desc">
              Useful at school-year start/end when a batch turns over at once.
            </span>
          </button>
        </div>
      ) : step === "manual" ? (
        <ManualInviteForm
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
    </Modal>
  );
}
