import { NeedsAttentionBanner } from "@/components/home/NeedsAttentionBanner";
import { HomeMetricTabs } from "@/components/home/HomeMetricTabs";

/**
 * Super Admin landing dashboard. Needs Attention leads — it's what changes
 * day to day and needs a response — with the steady-state enrollment and
 * academic figures grouped below by tab rather than flattened into one grid.
 * Curated set; the full catalog lives in Reporting & Analytics.
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
      <h1 className="sf-page-title">Home</h1>
      <p className="sf-page-sub">
        District-wide overview. Every card carries its own refresh time, because Salesforce reports
        refresh on their own schedules.
      </p>

      <NeedsAttentionBanner />
      <HomeMetricTabs />
    </section>
  );
}
