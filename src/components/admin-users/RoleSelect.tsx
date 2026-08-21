"use client";

import { useCallback } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ROLE_PRESETS,
  type AdminRole
} from "@/lib/data/adminUsers";
import { useComboboxPopup } from "@/components/shared/useComboboxPopup";

/**
 * Which role(s) an account holds, as a dropdown.
 *
 * Defaults to multi-select — an account can hold more than one role at once,
 * e.g. the seeded accounts that are both Leadership and School Admin — so
 * Edit and Bulk Reassign, which have to keep showing whatever an existing
 * account already holds, leave `multiple` at its default.
 *
 * The Invite form passes `multiple={false}`: a brand-new invite never starts
 * with an existing multi-role account to preserve, so picking a role there
 * replaces whatever was picked before, the same one-at-a-time behaviour as
 * every other dropdown in this app.
 *
 * Ticking one fills the access grid below with that role's levels. It is a
 * starting point and says so, because the grid beneath is what actually gets
 * saved and can differ from any role in the list.
 *
 * `grantable` is what the person doing the granting is allowed to hand out. A
 * School Admin cannot create a Super Admin, so that row is not offered — absent
 * rather than disabled, since it is not a thing they can ask for.
 */
export function RoleSelect({
  value,
  onChange,
  grantable = ADMIN_ROLE_ORDER,
  multiple = true,
  legend = "Roles",
  error
}: {
  value: AdminRole[];
  onChange: (roles: AdminRole[]) => void;
  grantable?: AdminRole[];
  multiple?: boolean;
  legend?: string;
  error?: string;
}) {
  const options = ADMIN_ROLE_ORDER.filter((role) => grantable.includes(role));
  const selectedSet = new Set<AdminRole>(value);
  const firstSelectedIndex = options.findIndex((role) => selectedSet.has(role));

  const popup = useComboboxPopup({
    disabled: false,
    count: options.length,
    initialIndex: firstSelectedIndex >= 0 ? firstSelectedIndex : 0
  });

  const toggle = useCallback(
    (role: AdminRole) => {
      if (!multiple) {
        onChange([role]);
        return;
      }
      onChange(
        selectedSet.has(role)
          ? value.filter((entry) => entry !== role)
          : ADMIN_ROLE_ORDER.filter((entry) => entry === role || value.includes(entry))
      );
    },
    [multiple, onChange, selectedSet, value]
  );

  /* Keeps focus on the trigger when a row is clicked, the same trick
     MultiCombobox relies on — otherwise the browser moves focus to the body,
     the trigger's keydown handler stops running, and Escape falls through to
     the Sheet/Modal behind the popup instead of just closing it. */
  const holdFocus = (event: React.MouseEvent) => event.preventDefault();

  const commit = useCallback(
    (index: number) => {
      const role = options[index];
      if (role) toggle(role);
      // A single pick is a done deal, same as Combobox — closing it here
      // instead of leaving it open avoids implying there's a second row left
      // to add, the way the multi-select case genuinely has.
      if (!multiple) popup.closePopup();
      popup.focusTrigger();
    },
    [multiple, options, popup, toggle]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (popup.onNavKeyDown(event)) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(popup.activeIndex);
    }
  };

  const selectedLabels = options.filter((role) => selectedSet.has(role)).map((role) => ADMIN_ROLE_LABELS[role]);
  const isEmpty = selectedLabels.length === 0;
  /* The actual names, not a count — a count reads as one combined value and
     hides which roles are actually held, which is exactly what this person
     came here to check. */
  const triggerLabel = isEmpty ? `Select role${multiple ? "(s)" : ""}` : selectedLabels.join(", ");

  const rowClass = (index: number) =>
    index === popup.activeIndex ? "sf-combobox-option is-active" : "sf-combobox-option";

  return (
    <div className="sf-field">
      <span>{legend}</span>

      <button
        ref={popup.triggerRef}
        type="button"
        role="combobox"
        aria-expanded={popup.open}
        aria-haspopup="listbox"
        aria-controls={popup.open ? popup.listId : undefined}
        aria-label={legend}
        aria-describedby={error ? "role-group-error" : undefined}
        className="sf-combobox"
        onClick={() => (popup.open ? popup.closePopup() : popup.openPopup())}
        onKeyDown={onKeyDown}
      >
        <span className={isEmpty ? "sf-combobox-value is-placeholder" : "sf-combobox-value"}>
          {triggerLabel}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={2} className="sf-combobox-caret" />
      </button>

      {popup.open && popup.popupStyle
        ? createPortal(
            <div
              ref={popup.popupRef}
              id={popup.listId}
              role="listbox"
              aria-multiselectable={multiple}
              aria-label={legend}
              className="sf-combobox-popup"
              style={popup.popupStyle}
            >
              {options.map((role, index) => {
                const checked = selectedSet.has(role);
                return (
                  <div
                    key={role}
                    role="option"
                    aria-selected={checked}
                    data-index={index}
                    className={`${rowClass(index)} sf-role-select-option`}
                    onPointerEnter={() => popup.setActiveIndex(index)}
                    onMouseDown={holdFocus}
                    onClick={() => commit(index)}
                  >
                    <span className="sf-role-select-text">
                      <span>{ADMIN_ROLE_LABELS[role]}</span>
                      <span className="sf-role-select-purpose">{ROLE_PRESETS[role].purpose}</span>
                    </span>
                    {checked ? (
                      <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} className="sf-role-select-tick" />
                    ) : null}
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}

      {error ? (
        <p className="sf-field-error" id="role-group-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
