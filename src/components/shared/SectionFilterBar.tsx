"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";

export type SectionFilterOption = { value: string; label: string };

export type SectionFilterConfig = {
  id: string;
  label: string;
  value: string;
  options: SectionFilterOption[];
  onChange: (value: string) => void;
};

const isOptionEqual = (a: SectionFilterOption, b: SectionFilterOption) => a.value === b.value;

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
          <Combobox
            items={filter.options}
            value={filter.options.find((option) => option.value === filter.value) ?? null}
            onValueChange={(option) => filter.onChange(option?.value ?? filter.value)}
            isItemEqualToValue={isOptionEqual}
          >
            <ComboboxInput placeholder={filter.label} />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: SectionFilterOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>
      ))}
    </div>
  );
}
