"use client";

export type SectionFilterOption = { value: string; label: string };

export type SectionFilterConfig = {
  id: string;
  label: string;
  value: string;
  options: SectionFilterOption[];
  onChange: (value: string) => void;
};

/**
 * Page-level filters (Integrations). Local state rather
 * than URL-persisted — only the Reporting global bar needs to survive
 * drill-down and sharing.
 */
export function SectionFilterBar({ filters }: { filters: SectionFilterConfig[] }) {
  return (
    <div className="sf-filter-bar">
      {filters.map((filter) => (
        <label className="sf-field" key={filter.id}>
          <span>{filter.label}</span>
          <select value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
