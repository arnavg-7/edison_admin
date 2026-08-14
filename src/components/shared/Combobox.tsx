"use client";

import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useComboboxPopup } from "./useComboboxPopup";

export type ComboboxOption<T extends string = string> = { value: T; label: string };

/**
 * The app's single pick-one dropdown control.
 *
 * Every single-value dropdown in Admin is a pick-one-from-a-known-list, so this
 * is a button + listbox rather than a text field: nothing here needs free
 * typing, and an editable input invited a chevron addon, a second focus ring and
 * raw values leaking into the trigger. One button, one popup, one focus ring.
 *
 * The popup is portaled to <body> and positioned from the trigger's rect, which
 * keeps it clear of the ancestors' `overflow: hidden` (cards, table wrappers)
 * and above the modal layer — see useComboboxPopup, shared with MultiCombobox.
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
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const popup = useComboboxPopup({
    disabled,
    count: options.length,
    initialIndex: selectedIndex >= 0 ? selectedIndex : 0
  });
  const { closePopup, focusTrigger } = popup;

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (option) onChange(option.value);
      closePopup();
      focusTrigger();
    },
    [closePopup, focusTrigger, onChange, options]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (popup.onNavKeyDown(event)) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(popup.activeIndex);
    }
  };

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

      {popup.open && popup.popupStyle
        ? createPortal(
            <div
              ref={popup.popupRef}
              id={popup.listId}
              role="listbox"
              aria-label={ariaLabel}
              className="sf-combobox-popup"
              style={popup.popupStyle}
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
                      index === popup.activeIndex
                        ? "sf-combobox-option is-active"
                        : "sf-combobox-option"
                    }
                    onPointerEnter={() => popup.setActiveIndex(index)}
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
