"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ATTENTION_CATEGORIES,
  ATTENTION_SEVERITIES,
  AT_RISK_PLACEHOLDER_RULES,
  SEVERITY_TONE,
  attentionItems,
  type AttentionCategory,
  type AttentionSeverity
} from "@/lib/data/needsAttention";
import { formatSalesforceStamp } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox } from "@/components/shared/Combobox";

const SEVERITY_RANK: Record<AttentionSeverity, number> = { critical: 0, high: 1, medium: 2 };

const CATEGORY_LABEL: Record<AttentionCategory, string> = ATTENTION_CATEGORIES.reduce(
  (acc, item) => ({ ...acc, [item.value]: item.label }),
  {} as Record<AttentionCategory, string>
);

type ComboOption<T extends string> = { value: T; label: string };

const CATEGORY_OPTIONS: ComboOption<AttentionCategory | "all">[] = [
  { value: "all", label: "All categories" },
  ...ATTENTION_CATEGORIES.map((option) => ({ value: option.value, label: option.label }))
];

const SEVERITY_OPTIONS: ComboOption<AttentionSeverity | "all">[] = [
  { value: "all", label: "All severities" },
  ...ATTENTION_SEVERITIES.map((option) => ({ value: option.value, label: option.label }))
];

/**
 * A triage queue, not a dashboard. Every row answers: what is flagged, why,
 * when, and where to go to resolve it — sorted worst-first so the list is
 * actionable top-down rather than needing to be read in full.
 */
export default function NeedsAttentionPage() {
  const [category, setCategory] = useState<AttentionCategory | "all">("all");
  const [severity, setSeverity] = useState<AttentionSeverity | "all">("all");
  const [resolved, setResolved] = useState<string[]>([]);

  const items = useMemo(
    () =>
      attentionItems
        .filter((item) => (category === "all" ? true : item.category === category))
        .filter((item) => (severity === "all" ? true : item.severity === severity))
        .slice()
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
            b.flaggedAt.localeCompare(a.flaggedAt)
        ),
    [category, severity]
  );

  const open = items.filter((item) => !resolved.includes(item.id));

  const toggleResolved = (id: string) =>
    setResolved((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">Needs Attention</h1>
      <p className="sf-page-sub">
        Cross-system triage: at-risk students, alerts past SLA, integration failures, and
        configuration still blocking rollout. Worst first.
      </p>

      <div className="sf-filter-bar sf-filter-bar--flush sf-filter-bar--top-spaced">
        <label className="sf-field">
          <span>Category</span>
          <Combobox
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            placeholder="All categories"
          />
        </label>

        <label className="sf-field">
          <span>Severity</span>
          <Combobox
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={setSeverity}
            placeholder="All severities"
          />
        </label>

        <p className="sf-filter-note">
          {open.length} open of {items.length} shown · {attentionItems.length} total
        </p>
      </div>

      {/* The at-risk thresholds are not agreed yet (brief §7 open item). Saying
          so on the screen matters more than in a code comment, because the
          numbers in each reason look authoritative otherwise. */}
      <div className="sf-panel sf-callout">
        <h2>At-risk rules are placeholders</h2>
        <p>
          The thresholds below are invented so the queue can be built and reviewed. They are not
          agreed logic. Confirm the real rules before anyone acts on an at-risk flag.
        </p>
        <ul className="sf-rule-list">
          {AT_RISK_PLACEHOLDER_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Queue</h2>
          <span className="sf-panel-note">
            {category === "all" ? "All categories" : CATEGORY_LABEL[category]}
            {severity === "all" ? "" : ` · ${severity}`}
          </span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Nothing matches these filters"
            message="Widen the category or severity filter to see more items."
          />
        ) : (
          <ul className="sf-triage-list">
            {items.map((item) => {
              const isResolved = resolved.includes(item.id);
              return (
                <li
                  className={isResolved ? "sf-triage-row is-resolved" : "sf-triage-row"}
                  key={item.id}
                >
                  <div className="sf-triage-main">
                    <div className="sf-triage-top">
                      <StatusBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</StatusBadge>
                      <span className="sf-triage-category">{CATEGORY_LABEL[item.category]}</span>
                      <span className="sf-triage-when">
                        Flagged {formatSalesforceStamp(item.flaggedAt)}
                      </span>
                    </div>

                    <div className="sf-triage-subject">{item.subject}</div>
                    <div className="sf-triage-reason">{item.reason}</div>
                  </div>

                  <div className="sf-triage-actions">
                    <Link className="sf-btn sf-btn--sm" href={item.href}>
                      {item.resolveLabel}
                    </Link>
                    <button
                      type="button"
                      className="sf-btn sf-btn--sm sf-btn--quiet"
                      onClick={() => toggleResolved(item.id)}
                    >
                      {isResolved ? "Reopen" : "Mark resolved"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
