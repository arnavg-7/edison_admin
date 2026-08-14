/**
 * Apportioning a school total across its grades.
 *
 * Shared rather than duplicated: Home's cards (homeScope.ts) and School Setup's
 * batch seats (schoolSetup.ts) both need per-grade enrollment, and two screens
 * showing different per-grade numbers for the same school would read as a
 * contradiction rather than as two views of one district.
 *
 * TODO: replace with real Genesis per-grade enrollment. Until then a grade's
 * student and teacher counts are apportioned, not measured.
 */

/**
 * Weights are fixed rather than random so a grade shows the same figure on every
 * render and every reload, and the parts always add back up to the school total
 * — a grade breakdown that did not sum to its own school would be worse than no
 * breakdown.
 */
const GRADE_WEIGHTS = [1.06, 0.97, 1.02, 0.95, 1.04, 0.99, 1.01];

export function splitAcrossGrades(total: number, grades: string[]): Record<string, number> {
  if (grades.length === 0) return {};

  const weights = grades.map((_, index) => GRADE_WEIGHTS[index % GRADE_WEIGHTS.length]);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (total * weight) / weightSum);
  const parts = exact.map(Math.floor);

  // Hand the rounding remainder to the largest fractional parts, so the split
  // is exact instead of drifting a few students away from the school total.
  const remainder = total - parts.reduce((sum, part) => sum + part, 0);
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let step = 0; step < remainder; step += 1) {
    parts[byFraction[step % byFraction.length].index] += 1;
  }

  return Object.fromEntries(grades.map((grade, index) => [grade, parts[index]]));
}
