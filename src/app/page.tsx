import { Suspense } from "react";
import { NeedsAttentionBanner } from "@/components/home/NeedsAttentionBanner";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { HomeMetrics } from "@/components/home/HomeMetrics";

/**
 * Super Admin landing dashboard. Enrollment, staffing and academic figures
 * lead in one flat grid; Needs Attention sits below the charts. Curated set;
 * the full catalog lives in Reporting & Analytics.
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
        {/* multiGrade only here: these cards are a comparison surface, so
            "grades 9 and 10 side by side" is a question worth asking. Reporting
            keeps a single grade — its drill-down and Class/Section filter only
            mean anything one grade at a time. */}
        <GlobalFilterBar multiGrade className="sf-filter-bar--top-spaced" />
      </Suspense>

      {/* Needs Attention sits below the charts. The figures and the charts are
          one reading — headline numbers, then the same population broken down —
          and the queue interrupted it halfway. Below, it reads as the answer to
          what the charts just showed, and its "View all" link is still the way
          through to the full triage queue. */}
      <Suspense fallback={null}>
        <HomeMetrics footer={<NeedsAttentionBanner />} />
      </Suspense>
    </section>
  );
}
