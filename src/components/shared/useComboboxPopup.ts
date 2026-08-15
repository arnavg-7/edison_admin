"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/** Popup sits above .sf-modal-overlay (z-index 100) so it works inside modals. */
const POPUP_Z_INDEX = 200;
const GAP = 4;
const MAX_POPUP_HEIGHT = 260;

type Placement = { left: number; top: number; width: number; openUp: boolean };

/**
 * The trigger-plus-portaled-popup plumbing shared by Combobox (pick one) and
 * MultiCombobox (pick several): measuring the trigger, flipping the popup up
 * when there is no room below, closing on an outside pointer-down, following the
 * trigger on scroll/resize, and keeping the arrowed-to row in view.
 *
 * Only what a keypress *means* differs between the two — Enter commits and
 * closes in one, toggles and stays open in the other — so `onNavKeyDown`
 * handles the shared navigation keys and reports whether it consumed the event,
 * leaving each component to add just its own Enter/Space behaviour.
 */
export function useComboboxPopup({
  disabled,
  count,
  initialIndex
}: {
  disabled: boolean;
  /** Number of focusable rows, so the arrow keys can wrap. */
  count: number;
  /** Row to highlight when the popup opens — usually the selected one. */
  initialIndex: number;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - GAP;
    const above = rect.top - GAP;
    // Flip up only when below genuinely can't hold the list but above can.
    const openUp = below < Math.min(MAX_POPUP_HEIGHT, above) && above > below;

    setPlacement({
      left: rect.left,
      top: openUp ? rect.top - GAP : rect.bottom + GAP,
      width: rect.width,
      openUp
    });
  }, []);

  const openPopup = useCallback(() => {
    if (disabled) return;
    measure();
    setActiveIndex(initialIndex);
    setOpen(true);
  }, [disabled, initialIndex, measure]);

  const closePopup = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const focusTrigger = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  // A closed popup can't drift, and a disabled control shouldn't stay open.
  useEffect(() => {
    if (disabled && open) closePopup();
  }, [closePopup, disabled, open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      closePopup();
    };
    // Reposition rather than close: the filter bars this sits in are inside a
    // scrolling main region, and closing on scroll feels like a dropped click.
    const onReflow = () => measure();

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [closePopup, measure, open]);

  // Keep the highlighted row in view when arrowing past the popup's edge.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    popupRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  /**
   * Opens on the first keypress, then walks rows. Returns true when the event
   * was consumed here; false means "this key is yours to interpret".
   */
  const onNavKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): boolean => {
    if (disabled) return true;

    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openPopup();
      }
      return true;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        /* Stops here rather than bubbling: these popups often sit inside a
           Sheet or Modal, which also closes on Escape — so one keypress
           dismissed the dropdown *and* threw away the form behind it. With the
           popup shut, a second Escape reaches the dialog as it should. */
        event.stopPropagation();
        closePopup();
        return true;
      case "Tab":
        closePopup();
        return true;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % count);
        return true;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + count) % count);
        return true;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        return true;
      case "End":
        event.preventDefault();
        setActiveIndex(count - 1);
        return true;
      default:
        return false;
    }
  };

  /**
   * At least as wide as the trigger, but free to grow to the longest label so
   * options never wrap in a narrow filter column.
   */
  const popupStyle: React.CSSProperties | null = placement
    ? {
        position: "fixed",
        left: placement.left,
        top: placement.openUp ? undefined : placement.top,
        bottom: placement.openUp ? window.innerHeight - placement.top : undefined,
        minWidth: placement.width,
        width: "max-content",
        maxWidth: Math.max(placement.width, 320),
        maxHeight: MAX_POPUP_HEIGHT,
        zIndex: POPUP_Z_INDEX
      }
    : null;

  return {
    listId,
    triggerRef,
    popupRef,
    open,
    activeIndex,
    setActiveIndex,
    openPopup,
    closePopup,
    focusTrigger,
    onNavKeyDown,
    popupStyle
  };
}
