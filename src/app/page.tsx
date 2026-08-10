import { Suspense } from "react";
import { NeedsAttentionBanner } from "@/components/home/NeedsAttentionBanner";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { HomeMetrics } from "@/components/home/HomeMetrics";

/**
 * Super Admin landing dashboard. Enrollment, staffing and academic figures
 * lead in one flat grid; Needs Attention sits below them. Curated set; the
 * full catalog lives in Reporting & Analytics.
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
            Overview across the district, or one school and grade. Every card carries its own
            refresh time.
          </p>
        </div>
      </div>

      {/* One bar for the whole page rather than a filter per card: these cards
          describe a single population, and independent filters would let two
          adjacent cards disagree about which population that is. Scope lives in
          the URL, so it survives a reload and travels to Reporting intact.

          Suspense because it reads the URL through useSearchParams, which opts
          a route into dynamic rendering unless it sits behind a boundary. */}
      <Suspense fallback={null}>
        <GlobalFilterBar className="sf-filter-bar--top-spaced" />
      </Suspense>

      {/* Needs Attention slots directly under the KPI tiles, above the
          Enrollment/Trends/Staffing chart sections: the headline figures say
          where the district stands, and the queue immediately says what to do
          about it, rather than waiting at the foot of the page. Its "View all"
          link is the way through to the full triage queue. */}
      <Suspense fallback={null}>
        <HomeMetrics afterStats={<NeedsAttentionBanner />} />
      </Suspense>
    </section>
  );
}
