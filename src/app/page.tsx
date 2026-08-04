import { Suspense } from "react";
import { NeedsAttentionBanner } from "@/components/home/NeedsAttentionBanner";
import { HomeFilterBar } from "@/components/home/HomeFilterBar";
import { HomeMetrics } from "@/components/home/HomeMetrics";

/**
 * Super Admin landing dashboard. Enrollment, staffing and academic figures
 * lead in one flat grid; Needs Attention follows at the bottom rather than
 * leading the page. Curated set; the full catalog lives in Reporting & Analytics.
 *
 * The brief's suggested set included Total Events Held and Event Participants.
 * Those are screenshot-derived and outside Edison's scope docs, so the slots go
 * to the three original core metrics instead — attendance, goals and assignment
 * completion are the figures Edison actually tracks.
 *
 * TODO: exact card set is still an open item (brief §6 / open item 6).
 */
export default function HomePage() {
  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">Home</h1>
          {/* Kept to one line. The trailing clause — "because Salesforce reports
              refresh on their own schedules" — was the reason for the per-card
              stamps, but each card already shows its own "As of …", so the
              explanation was spending a second line on something the cards
              demonstrate themselves. */}
          <p className="sf-page-sub">
            District-wide overview. Every card carries its own refresh time.
          </p>
        </div>

        {/* Suspense because it reads the URL through useSearchParams, which
            opts a route into dynamic rendering unless it sits behind a boundary. */}
        <Suspense fallback={null}>
          <HomeFilterBar />
        </Suspense>
      </div>

      <HomeMetrics />

      <Suspense fallback={null}>
        <NeedsAttentionBanner />
      </Suspense>
    </section>
  );
}
