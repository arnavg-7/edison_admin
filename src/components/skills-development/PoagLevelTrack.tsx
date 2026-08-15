"use client";

import { usePoag } from "@/lib/poag-store";
import type { PoagLevel } from "@/lib/data/poag";

/**
 * The level positions as a track, echoing the faculty matrix so an admin
 * recognises what they are configuring as the thing teachers use.
 *
 * Reads the scale from the store rather than taking a length: the district can
 * add a level, and a track drawn against a stale count would put a rating at
 * "4 of 4" on a five-level scale.
 *
 * The faculty build uses Edison's #AD46FF on a light canvas; this is the admin
 * portal, so it reads in the app's own accent instead — the brand colour would
 * be the one purple on screen that means nothing else here. What does carry over
 * is the rule underneath it: level is position plus a text label, never colour
 * alone (WCAG 1.4.1), which is why every use of this sits next to the level name
 * in words.
 */
export function PoagLevelTrack({
  level,
  label
}: {
  /** Filled up to and including this level, or null for an unrated row. */
  level: PoagLevel | null;
  /** Names the row for a screen reader — the track itself is decorative. */
  label: string;
}) {
  const { levels } = usePoag();

  return (
    <span
      className="poag-track"
      role="img"
      aria-label={
        level === null
          ? `${label}: not yet rated`
          : `${label}: ${levels[level]?.label ?? ""}, level ${level + 1} of ${levels.length}`
      }
    >
      {levels.map((entry) => {
        const reached = level !== null && entry.value <= level;
        const current = entry.value === level;
        return (
          <span
            key={entry.value}
            className={`poag-track-step${reached ? " is-reached" : ""}${current ? " is-current" : ""}`}
          >
            <span className="poag-track-line" />
            <span className="poag-track-dot" />
          </span>
        );
      })}
    </span>
  );
}
