/**
 * The level ramp, generated from a level's position rather than picked per
 * level.
 *
 * It used to be four fixed hexes in CSS, which worked while the scale was fixed
 * at four. A district can now add to it, and four hand-picked tints do not
 * stretch: a six-level scale needs six steps of the same ramp, not the original
 * four plus two invented colours. Mixing the app's data colour into the card
 * reproduces those four almost exactly at a length of four (20 / 47 / 73 / 100%)
 * and stays one hue at any length — and unlike the hexes it followed, it tracks
 * the theme instead of staying pale on a dark canvas.
 *
 * The rule the brand guide cares about is unchanged: a level is conveyed by
 * position and a text label, never by colour alone (WCAG 1.4.1). Every segment
 * prints its count and every track sits beside the level's name in words.
 */
export function poagLevelTint(
  value: number,
  count: number
): { background: string; lightInk: boolean } {
  const mix = count <= 1 ? 100 : 20 + (80 * value) / (count - 1);
  return {
    background: `color-mix(in oklab, var(--sf-stat) ${mix}%, var(--sf-card))`,
    /* Past roughly two-thirds of the ramp the fill is dark enough that the
       count printed on it needs to flip to white to clear 4.5:1. */
    lightInk: mix >= 65
  };
}
