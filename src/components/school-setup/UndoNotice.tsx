"use client";

import { useSchoolSetup } from "@/lib/school-setup-store";
import { Button } from "@/components/base/buttons/button";

/**
 * The way back from a cascading delete.
 *
 * A banner rather than a toast: the app has no toast layer, and a delete here can
 * take a school's grades, batches and hundreds of enrollments with it — that is
 * not something to offer back for four seconds in the corner and then withdraw.
 * It sits in the page flow until the admin resolves it either way.
 */
export function UndoNotice() {
  const { undo, applyUndo, dismissUndo } = useSchoolSetup();
  if (!undo) return null;

  return (
    <div className="sf-notice sf-notice--action">
      <div>
        <p className="sf-notice-title">Deleted {undo.label}</p>
        <p className="sf-notice-detail">
          Everything under it went too. Restore puts the hierarchy back exactly as it was.
        </p>
      </div>
      <div className="sf-row-actions">
        <Button color="secondary" size="sm" onClick={applyUndo}>
          Restore
        </Button>
        <Button color="tertiary" size="sm" onClick={dismissUndo}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
