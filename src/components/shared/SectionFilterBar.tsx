"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Select value={filter.value} onValueChange={(value) => filter.onChange(value ?? filter.value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ))}
    </div>
  );
}
