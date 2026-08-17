"use client";

import { Fragment, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  SKILL_LEVELS,
  termHistoryFor,
  type ArchivedTerm
} from "@/lib/data/skillsDevelopment";
import { DevAreaIcon } from "./DevAreaIcon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { subjects } from "@/lib/data/systemSettings";

function subjectName(id: string): string {
  return subjects.find((subject) => subject.id === id)?.name ?? "Unmapped subject";
}
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateOnly, formatDateRangeOnly } from "@/lib/format";

/**
 * Read-only views of what a grade's areas and skills looked like in earlier
 * terms. Archives are the record of what students actually saw then, so there
 * are no edit, publish or delete controls — only the dates and the content.
 *
 * A list of terms rather than a picker: an admin scanning "what did we run, and
 * when" wants every term in view at once, with its period next to it. Rows
 * expand in place so comparing two terms doesn't mean re-selecting between them.
 */

/** Rough term length, so a row says how long it ran without doing the arithmetic. */
function weeksBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / (7 * 24 * 60 * 60 * 1000)));
}

function TermRows({
  terms,
  columns,
  cellsFor,
  detailFor,
  label
}: {
  terms: ArchivedTerm[];
  columns: string[];
  cellsFor: (term: ArchivedTerm) => React.ReactNode[];
  detailFor: (term: ArchivedTerm) => React.ReactNode;
  label: string;
}) {
  // Newest term open by default: it is the one an admin is usually checking
  // against what is live now.
  const [expanded, setExpanded] = useState<string[]>(() =>
    terms[0] ? [terms[0].id] : []
  );

  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const head = ["Term", "Dates", "Duration", ...columns];

  return (
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            {head.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {terms.map((term) => {
            const isOpen = expanded.includes(term.id);
            const detailId = `${term.id}-detail`;

            // A Fragment keeps the row and its detail row as siblings inside
            // <tbody>, which a wrapper element would not allow.
            return (
              <Fragment key={term.id}>
                <tr>
                  <td>
                    <div className="sf-row-expander">
                      <button
                        type="button"
                        className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                        aria-expanded={isOpen}
                        aria-controls={detailId}
                        onClick={() => toggle(term.id)}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                        <span className="sf-sr-only">
                          {isOpen
                            ? `Hide ${label} for ${term.term}`
                            : `Show ${label} for ${term.term}`}
                        </span>
                      </button>
                      <span className="sf-term-name">{term.term}</span>
                    </div>
                  </td>
                  <td>
                    {formatDateOnly(term.from)} – {formatDateOnly(term.to)}
                  </td>
                  <td>{weeksBetween(term.from, term.to)} weeks</td>
                  {cellsFor(term).map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>

                {isOpen ? (
                  <tr className="sf-subrow" id={detailId}>
                    <td colSpan={head.length}>
                      <div className="sf-archive-detail">{detailFor(term)}</div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NoHistory({ heading }: { heading: string }) {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>{heading}</h2>
      </div>
      <EmptyState
        title="No earlier terms"
        message="Once this grade's configuration is rolled over to a new term, the previous one is archived here."
      />
    </div>
  );
}

export function DevelopmentAreasHistory({
  schoolId,
  grade
}: {
  schoolId: string;
  grade: string;
}) {
  const terms = useMemo(() => termHistoryFor(schoolId, grade), [schoolId, grade]);

  if (terms.length === 0) {
    return <NoHistory heading="Development areas history" />;
  }

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Development areas history</h2>
      </div>

      <TermRows
        terms={terms}
        label="development areas"
        columns={["Areas", "Skills"]}
        cellsFor={(term) => [
          term.areas.length,
          term.areas.reduce((sum, area) => sum + area.skills.length, 0)
        ]}
        detailFor={(term) =>
          term.areas.length === 0 ? (
            <p className="sf-subrow-empty">No development areas were configured in this term.</p>
          ) : (
            <div className="area-grid">
              {term.areas.map((area) => (
                <article className={`area-card tone-${area.tone}`} key={area.id}>
                  <div className="area-card-top">
                    <span className={`area-icon tone-${area.tone}`} aria-hidden>
                      <DevAreaIcon name={area.icon} />
                    </span>
                    {/* Named here, unlike the live editor: the archive shows
                        every subject's set at once, so without it four cards
                        called Strengths would look like duplicates. */}
                    <span className="area-subjects">{subjectName(area.subjectId)}</span>
                    {!area.published ? <StatusBadge tone="neutral">Draft</StatusBadge> : null}
                  </div>

                  <h3 className={`area-title tone-${area.tone}`}>{area.title}</h3>

                  {area.period ? (
                    <p className="area-period">
                      <span className="area-period-name">{area.period.name}</span>
                      <span className="area-period-dates">
                        {formatDateRangeOnly(area.period.from, area.period.to)}
                      </span>
                    </p>
                  ) : null}

                  <ul className="area-skills">
                    {area.skills.map((skill) => (
                      <li className="area-skill" key={skill.id}>
                        <span className="area-skill-label">{skill.label}</span>
                      </li>
                    ))}
                    {area.skills.length === 0 ? (
                      <li className="area-skill-empty">No skills</li>
                    ) : null}
                  </ul>
                </article>
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

export function SkillsProfileHistory({ schoolId, grade }: { schoolId: string; grade: string }) {
  const terms = useMemo(() => termHistoryFor(schoolId, grade), [schoolId, grade]);

  if (terms.length === 0) {
    return <NoHistory heading="Skill groups history" />;
  }

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Skill groups history</h2>
      </div>

      <TermRows
        terms={terms}
        label="skills profile"
        columns={["Skills", "Sub-skills"]}
        cellsFor={(term) => [
          term.groups.length,
          term.groups.reduce((sum, group) => sum + group.subSkills.length, 0)
        ]}
        detailFor={(term) =>
          term.groups.length === 0 ? (
            <p className="sf-subrow-empty">No skills were configured in this term.</p>
          ) : (
            <>
              <div className="skills-legend" aria-label="Skill levels">
                {SKILL_LEVELS.map((option) => (
                  <span className={`skills-legend-item level-${option.value}`} key={option.value}>
                    <span className="skill-dot" aria-hidden />
                    {option.label}
                  </span>
                ))}
              </div>

              <div className="skill-group-grid">
                {term.groups.map((group) => (
                  <article className="skill-group-card" key={group.id}>
                    <div className="skill-group-head">
                      <h3 className="skill-group-title">{group.title}</h3>
                      {!group.published ? <StatusBadge tone="neutral">Draft</StatusBadge> : null}
                    </div>

                    <ul className="skill-pill-list">
                      {group.subSkills.map((sub) => (
                        <li className="skill-pill-row" key={sub.id}>
                          <span
                            className={`skill-pill level-${sub.level}`}
                            tabIndex={0}
                            aria-describedby={sub.description ? `hist-tip-${sub.id}` : undefined}
                          >
                            <span className="skill-dot" aria-hidden />
                            <span className="skill-pill-label">{sub.label}</span>
                            {sub.description ? (
                              <span
                                className="skill-tooltip"
                                role="tooltip"
                                id={`hist-tip-${sub.id}`}
                              >
                                <strong>{sub.label}</strong>
                                <em>{sub.description}</em>
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                      {group.subSkills.length === 0 ? (
                        <li className="area-skill-empty">No sub-skills</li>
                      ) : null}
                    </ul>
                  </article>
                ))}
              </div>
            </>
          )
        }
      />
    </div>
  );
}
