"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

export type ComboboxOption<T extends string = string> = { value: T; label: string };

/** Popup sits above .sf-modal-overlay (z-index 100) so it works inside modals. */
const POPUP_Z_INDEX = 200;
const GAP = 4;
const MAX_POPUP_HEIGHT = 260;

type Placement = { left: number; top: number; width: number; openUp: boolean };

/**
 * The app's single dropdown control.
 *
 * Every dropdown in Admin is a pick-one-from-a-known-list, so this is a button
 * + listbox rather than a text field: nothing here needs free typing, and an
 * editable input invited a chevron addon, a second focus ring and raw values
 * leaking into the trigger. One button, one popup, one focus ring.
 *
 * The popup is portaled to <body> and positioned from the trigger's rect, which
 * keeps it clear of the ancestors' `overflow: hidden` (cards, table wrappers)
 * and above the modal layer.
 */
export function Combobox<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  ariaLabel,
  className
}: {
  value: T | "";
  options: ComboboxOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

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
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, measure, selectedIndex]);

  const closePopup = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (option) onChange(option.value);
      closePopup();
      triggerRef.current?.focus();
    },
    [closePopup, onChange, options]
  );

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

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPopup();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closePopup();
        break;
      case "Tab":
        closePopup();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + options.length) % options.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className={className ? `sf-combobox ${className}` : "sf-combobox"}
        onClick={() => (open ? closePopup() : openPopup())}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? "sf-combobox-value" : "sf-combobox-value is-placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={15}
          strokeWidth={2}
          className="sf-combobox-caret"
        />
      </button>

      {open && placement
        ? createPortal(
            <div
              ref={popupRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="sf-combobox-popup"
              style={{
                position: "fixed",
                left: placement.left,
                top: placement.openUp ? undefined : placement.top,
                bottom: placement.openUp ? window.innerHeight - placement.top : undefined,
                // At least as wide as the trigger, but free to grow to the
                // longest label so options never wrap in a narrow filter column.
                minWidth: placement.width,
                width: "max-content",
                maxWidth: Math.max(placement.width, 320),
                maxHeight: MAX_POPUP_HEIGHT,
                zIndex: POPUP_Z_INDEX
              }}
            >
              {options.length === 0 ? (
                <p className="sf-combobox-empty">No options available</p>
              ) : (
                options.map((option, index) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    data-index={index}
                    className={
                      index === activeIndex ? "sf-combobox-option is-active" : "sf-combobox-option"
                    }
                    onPointerEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                  >
                    <span>{option.label}</span>
                    {option.value === value ? (
                      <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} />
                    ) : null}
                  </div>
                ))
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
