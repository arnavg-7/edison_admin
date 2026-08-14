import { seatsPct, seatsSummary, type Seats } from "@/lib/data/schoolSetup";

/**
 * How full a level is. Capacity is the number an admin can act on — a grade at
 * 100% needs another batch before the next intake — so the bar carries the
 * percentage and the raw counts sit beside it rather than only in a tooltip.
 *
 * Over-subscribed is drawn in the warn tone: it is a real state here (enrollment
 * is measured, capacity is configured, and the two can disagree) and reading it
 * as "nicely full" would hide it.
 */
export function SeatMeter({ seats, size = "row" }: { seats: Seats; size?: "row" | "panel" }) {
  const pct = seatsPct(seats);
  const isFull = pct >= 100;

  return (
    <div className={size === "panel" ? "sf-meter sf-meter--panel" : "sf-meter"}>
      <div
        className="sf-meter-track"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Seats filled: ${seatsSummary(seats)}`}
      >
        <span
          className={isFull ? "sf-meter-fill is-full" : "sf-meter-fill"}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={isFull ? "sf-meter-value is-full" : "sf-meter-value"}>{pct}%</span>
      {size === "panel" ? <span className="sf-meter-note">{seatsSummary(seats)}</span> : null}
    </div>
  );
}
