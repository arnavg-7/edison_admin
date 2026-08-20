"use client";

import { SECTIONS } from "@/lib/nav";
import {
  SECTION_LEVEL_LABELS,
  SECTION_LEVEL_ORDER,
  fullAccess,
  type SectionAccessMap,
  type SectionLevel
} from "@/lib/data/adminUsers";

/**
 * What one account may do, section by section.
 *
 * A row per section and three states per row, because the question an admin is
 * answering is not "which role is this person" but "can they change the goals".
 * The role above fills this in; this is where it becomes true for one person,
 * and nothing is applied until the form around it is saved.
 *
 * Reporting has no Edit. The section is read-only by construction — every
 * figure on it is a Salesforce report — so offering the level would be offering
 * a capability the screen cannot honour.
 */
const READ_ONLY_SECTIONS = new Set(["reporting"]);

export function AccessGrid({
  value,
  onChange,
  disabled = false
}: {
  value: SectionAccessMap;
  onChange: (next: SectionAccessMap) => void;
  /** True while there is no role to seed from, so the grid reads as inert. */
  disabled?: boolean;
}) {
  const access = fullAccess(value);

  const set = (section: string, level: SectionLevel) =>
    onChange({ ...access, [section]: level });

  return (
    <div className="sf-access-grid" data-disabled={disabled ? "" : undefined}>
      {SECTIONS.map((section) => {
        const current = access[section.id];
        const levels = READ_ONLY_SECTIONS.has(section.id)
          ? SECTION_LEVEL_ORDER.filter((level) => level !== "edit")
          : SECTION_LEVEL_ORDER;

        return (
          <div className="sf-access-row" key={section.id}>
            <span className="sf-access-section">{section.label}</span>

            <div
              className="sf-access-levels"
              role="radiogroup"
              aria-label={`${section.label} access`}
            >
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={current === level}
                  disabled={disabled}
                  className={
                    current === level ? "sf-access-choice is-active" : "sf-access-choice"
                  }
                  data-level={level}
                  onClick={() => set(section.id, level)}
                >
                  {SECTION_LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
