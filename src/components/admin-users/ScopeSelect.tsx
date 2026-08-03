"use client";

import { schools } from "@/lib/data/schools";
import type { AdminScope } from "@/lib/data/adminUsers";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";

const DISTRICT_VALUE = "district";

const SCOPE_OPTIONS: ComboboxOption[] = [
  { value: DISTRICT_VALUE, label: "District-wide" },
  ...schools.map((school) => ({ value: school.id, label: school.name }))
];

export function scopeToValue(scope: AdminScope): string {
  return scope.type === "district" ? DISTRICT_VALUE : scope.schoolId;
}

export function valueToScope(value: string): AdminScope {
  return value === DISTRICT_VALUE ? { type: "district" } : { type: "school", schoolId: value };
}

export function ScopeSelect({
  value,
  onChange
}: {
  value: AdminScope;
  onChange: (scope: AdminScope) => void;
}) {
  return (
    <Combobox
      options={SCOPE_OPTIONS}
      value={scopeToValue(value)}
      onChange={(next) => onChange(valueToScope(next))}
      placeholder="Select a scope"
      ariaLabel="Scope"
    />
  );
}
