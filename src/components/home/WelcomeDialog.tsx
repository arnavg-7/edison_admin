"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/base/buttons/button";

/**
 * Demo stand-in for the greeting a real invite-acceptance flow would show:
 * click the invite email, sign in with Google, land here. There's no auth
 * backend yet (see the TODOs on `useAdminScope`), so there's no real signed-in
 * name to greet — this uses a placeholder person, the same one the Invite
 * form's own example points to.
 *
 * A single screen, not a tour: three of Home's own sections as a static
 * collage, each with a miniature of its real anatomy (the same chart series
 * colors, status tints and role-badge style used on the actual screens)
 * rather than a generic icon, so the collage is a true preview and not
 * decoration standing in for content. Shows every time Home mounts —
 * nothing here persists a "seen" flag.
 */
function WelcomeCollage() {
  return (
    <div className="sf-welcome-collage" aria-hidden>
      <div className="sf-welcome-chip sf-welcome-chip--home is-active">
        <span className="sf-welcome-chip-label">Home</span>
        <div className="sf-welcome-bars">
          <span className="sf-welcome-bar" style={{ height: "60%", background: "var(--sf-series-1)" }} />
          <span className="sf-welcome-bar" style={{ height: "90%", background: "var(--sf-series-2)" }} />
          <span className="sf-welcome-bar" style={{ height: "45%", background: "var(--sf-series-4)" }} />
          <span className="sf-welcome-bar" style={{ height: "72%", background: "var(--sf-series-1)" }} />
        </div>
      </div>

      <div className="sf-welcome-chip sf-welcome-chip--attention">
        <span className="sf-welcome-chip-label">Needs Attention</span>
        <div className="sf-welcome-attention-rows">
          <span className="sf-welcome-attention-row">
            <span className="sf-welcome-dot-status sf-welcome-dot-status--error" />
            At-risk students
          </span>
          <span className="sf-welcome-attention-row">
            <span className="sf-welcome-dot-status sf-welcome-dot-status--warn" />
            Overdue alerts
          </span>
          <span className="sf-welcome-attention-row">
            <span className="sf-welcome-dot-status sf-welcome-dot-status--ok" />
            Sync healthy
          </span>
        </div>
      </div>

      <div className="sf-welcome-chip sf-welcome-chip--roles">
        <span className="sf-welcome-chip-label">User Management</span>
        <div className="sf-welcome-role-pills">
          <span className="sf-welcome-role-pill">IT Administrator</span>
          <span className="sf-welcome-role-pill">School Admin</span>
        </div>
      </div>
    </div>
  );
}

export function WelcomeDialog() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  const dismiss = () => setOpen(false);

  return (
    <AlertDialog open onOpenChange={(next) => setOpen(next)}>
      <AlertDialogContent className="sf-welcome-card">
        <div className="sf-welcome-hero">
          <WelcomeCollage />
        </div>

        <AlertDialogHeader>
          <AlertDialogTitle>Welcome, Priya Nair!</AlertDialogTitle>
          <AlertDialogDescription>
            You’re all set. This is Home — a morning scan of enrollment, attendance, and who
            needs attention today.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button size="sm" onClick={dismiss}>
            Get started
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
