"use client";

import { useCallback } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { ComboboxOption } from "./Combobox";
import { useComboboxPopup } from "./useComboboxPopup";

/**
 * Pick-several sibling of Combobox, for filters where the answer is genuinely a
 * set rather than one value — Home's Grade filter, where an admin compares the
 * two grades a cohort is split across.
 *
 * Deliberately the same trigger, popup surface and keyboard model as Combobox
 * (both sit in the same filter bar, so a row of them has to read as one control
 * family); only three things differ, and each earns its keep:
 *
 *  - rows carry a checkbox, not a tick, because "on/off, several at once" is a
 *    different promise from "this is the current one";
 *  - a reset row sits at the top, since an empty set means "all" and there is
 *    otherwise no way back to it once something is ticked;
 *  - Enter/Space toggles and leaves the popup open, because closing after every
 *    tick would make picking three grades three round trips.
 */
export function MultiCombobox<T extends string = string>({
  values,
  options,
  onChange,
  resetLabel,
  placeholder = "Select options",
  disabled = false,
  ariaLabel,
  summarize = (picked) => `${picked.length} selected`,
  className
}: {
  /** Selected values. Empty means "no narrowing" — see resetLabel. */
  values: T[];
  options: ComboboxOption<T>[];
  onChange: (values: T[]) => void;
  /** The clear-everything row, e.g. "All grades". Doubles as the empty label. */
  resetLabel: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** Trigger text once two or more are picked; one pick shows its own label. */
  summarize?: (values: T[]) => string;
  className?: string;
}) {
  const selectedSet = new Set<T>(values);
  const firstSelectedIndex = options.findIndex((option) => selectedSet.has(option.value));

  // The reset row is row 0, so every option sits one further down. Counting it
  // in keeps arrow-key wrapping and the scroll-into-view lookup honest.
  const popup = useComboboxPopup({
    disabled,
    count: options.length + 1,
    initialIndex: firstSelectedIndex >= 0 ? firstSelectedIndex + 1 : 0
  });

  const toggle = useCallback(
    (value: T) => {
      const next = new Set(selectedSet);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      // Emitted in the options' own order, not click order, so the same set of
      // grades always serialises to the same URL.
      onChange(options.filter((option) => next.has(option.value)).map((option) => option.value));
    },
    [onChange, options, selectedSet]
  );

  const commit = useCallback(
    (index: number) => {
      if (index <= 0) {
        onChange([]);
        return;
      }
      const option = options[index - 1];
      if (option) toggle(option.value);
    },
    [onChange, options, toggle]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (popup.onNavKeyDown(event)) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(popup.activeIndex);
    }
  };

  const selectedLabels = options.filter((option) => selectedSet.has(option.value));
  const isEmpty = selectedLabels.length === 0;
  const triggerLabel = isEmpty
    ? resetLabel
    : selectedLabels.length === 1
      ? selectedLabels[0].label
      : summarize(selectedLabels.map((option) => option.value));

  const rowClass = (index: number) =>
    index === popup.activeIndex ? "sf-combobox-option is-active" : "sf-combobox-option";

  return (
    <>
      <button
        ref={popup.triggerRef}
        type="button"
        role="combobox"
        aria-expanded={popup.open}
        aria-haspopup="listbox"
        aria-controls={popup.open ? popup.listId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className={className ? `sf-combobox ${className}` : "sf-combobox"}
        onClick={() => (popup.open ? popup.closePopup() : popup.openPopup())}
        onKeyDown={onKeyDown}
      >
        {/* An empty selection shows the reset label rather than a placeholder
            tone: "All grades" is a real, chosen state here, not a blank field. */}
        <span className={disabled && isEmpty ? "sf-combobox-value is-placeholder" : "sf-combobox-value"}>
          {disabled ? placeholder : triggerLabel}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={15}
          strokeWidth={2}
          className="sf-combobox-caret"
        />
      </button>

      {popup.open && popup.popupStyle
        ? createPortal(
            <div
              ref={popup.popupRef}
              id={popup.listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={ariaLabel}
              className="sf-combobox-popup"
              style={popup.popupStyle}
            >
              {options.length === 0 ? (
                <p className="sf-combobox-empty">No options available</p>
              ) : (
                <>
                  <div
                    role="option"
                    aria-selected={isEmpty}
                    data-index={0}
                    className={`${rowClass(0)} sf-combobox-option--reset`}
                    onPointerEnter={() => popup.setActiveIndex(0)}
                    onClick={() => commit(0)}
                  >
                    <span>{resetLabel}</span>
                    {isEmpty ? <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} /> : null}
                  </div>

                  {options.map((option, index) => {
                    const checked = selectedSet.has(option.value);
                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={checked}
                        data-index={index + 1}
                        className={rowClass(index + 1)}
                        onPointerEnter={() => popup.setActiveIndex(index + 1)}
                        onClick={() => commit(index + 1)}
                      >
                        <span className="sf-combobox-check-row">
                          <span
                            className={
                              checked ? "sf-combobox-check is-checked" : "sf-combobox-check"
                            }
                            aria-hidden="true"
                          >
                            {checked ? (
                              <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={3} />
                            ) : null}
                          </span>
                          <span>{option.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
