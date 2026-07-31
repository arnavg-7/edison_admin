// TODO: replace with the real academic calendar. System Settings > Academic
// Calendar is the intended source of truth for these terms, and the Reporting
// date-range presets read from here — the term boundaries below are invented
// and must be validated against Edison's actual calendar (brief §8 item 4).

export type Term = {
  id: string;
  label: string;
  start: string;
  end: string;
  current: boolean;
};

export const terms: Term[] = [
  { id: "2025-t1", label: "Term 1 2025–26", start: "2025-09-02", end: "2025-11-07", current: false },
  { id: "2025-t2", label: "Term 2 2025–26", start: "2025-11-10", end: "2026-01-30", current: false },
  { id: "2026-t3", label: "Term 3 2025–26", start: "2026-02-02", end: "2026-04-17", current: false },
  { id: "2026-t4", label: "Term 4 2025–26", start: "2026-04-20", end: "2026-08-14", current: true }
];

export function currentTerm(): Term {
  return terms.find((term) => term.current) ?? terms[terms.length - 1];
}
