"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ShieldKeyIcon } from "@hugeicons/core-free-icons";
import { INSTITUTIONAL_DOMAINS_LABEL } from "@/lib/data/adminUsers";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

/**
 * Shown when an invite is aimed at an address outside the district's domains.
 * A blocked Send button alone doesn't explain itself — the rule isn't visible
 * in the address you typed — so this says which domain is required and why,
 * then hands the form back so it can be corrected.
 *
 * Takes the rejected addresses so it can serve both invite paths: one from the
 * manual form, or the offending rows from a CSV.
 */
export function InstitutionalEmailDialog({
  emails,
  onClose
}: {
  emails: string[];
  onClose: () => void;
}) {
  const isBatch = emails.length > 1;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <HugeiconsIcon icon={ShieldKeyIcon} strokeWidth={1.8} />
          </AlertDialogMedia>
          <AlertDialogTitle>Institutional email required</AlertDialogTitle>
          <AlertDialogDescription>
            {isBatch
              ? `${emails.length} rows use an address outside ${INSTITUTIONAL_DOMAINS_LABEL} and were skipped: ${emails.slice(0, 3).join(", ")}${emails.length > 3 ? `, and ${emails.length - 3} more` : ""}.`
              : `${emails[0] ?? "That address"} isn’t on ${INSTITUTIONAL_DOMAINS_LABEL}, so the invite can’t be sent.`}{" "}
            Admin access needs a district-issued account: a personal mailbox can&rsquo;t be
            deprovisioned when someone leaves, so their access would outlive their job.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose onClick={onClose}>Got it</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
