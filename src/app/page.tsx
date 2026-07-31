"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role/RoleContext";
import { platformPulse } from "@/lib/data/metrics";
import { configurationStatus } from "@/lib/data/configStatus";
import { MetricStrip } from "@/components/shared/MetricTile";
import { ConfigStatusRow } from "@/components/shared/ConfigStatusRow";
import { GenesisSummaryPanel } from "@/components/home/GenesisSummaryPanel";
import { ApiSummaryPanel } from "@/components/home/ApiSummaryPanel";
import { UserManagementTile } from "@/components/home/UserManagementTile";

/**
 * One route, three renders resolved by role. Leadership has no Home of its own
 * — they land straight in Reporting & Analytics.
 */
export default function HomePage() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "leadership") {
      router.replace("/reporting");
    }
  }, [role, router]);

  if (role === "leadership") {
    return (
      <section className="admin-main">
        <p className="admin-subtitle">Opening Reporting &amp; Analytics&hellip;</p>
      </section>
    );
  }

  if (role === "it_admin") {
    return (
      <section className="admin-main">
        <h1>Platform Pulse</h1>
        <p className="admin-subtitle">District-wide health at a glance.</p>

        <MetricStrip metrics={platformPulse} />

        <div className="home-panel-grid">
          <GenesisSummaryPanel />
          <ApiSummaryPanel />
        </div>

        <div className="home-panel-grid home-panel-grid--single">
          <UserManagementTile />
        </div>
      </section>
    );
  }

  const configured = configurationStatus.filter((item) => item.configured >= item.total).length;

  return (
    <section className="admin-main">
      <h1>Platform Pulse</h1>
      <p className="admin-subtitle">District-wide health at a glance.</p>

      <MetricStrip metrics={platformPulse} />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Configuration status</h2>
          <span className="config-status-summary">
            {configured} of {configurationStatus.length} modules fully configured
          </span>
        </div>

        <div className="config-status-list">
          {configurationStatus.map((item) => (
            <ConfigStatusRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
