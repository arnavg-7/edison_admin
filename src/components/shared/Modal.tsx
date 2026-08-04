"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

/**
 * First modal primitive in the app — everything else uses inline forms, but
 * a detail/create flow triggered from a card list reads better as an
 * overlay than an in-place row expansion.
 */
export function Modal({
  title,
  onClose,
  children,
  size = "md"
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "lg" for flows with more to show at once, e.g. a multi-step wizard. */
  size?: "md" | "lg";
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="sf-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={size === "lg" ? "sf-modal sf-modal--lg" : "sf-modal"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sf-modal-head">
          <h2>{title}</h2>
          <button type="button" className="sf-modal-close" aria-label="Close" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="sf-modal-body">{children}</div>
      </div>
    </div>
  );
}
