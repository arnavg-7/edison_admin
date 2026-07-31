"use client";

import { adoptionBySchool, lastSyncByIntegration } from "@/lib/data/reporting";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { formatNumber } from "@/lib/format";

export default function AdminDashboardPage() {
  const totalLogins = adoptionBySchool.reduce((sum, row) => sum + row.activeLogins, 0);

  return (
    <>
      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Portal adoption by school</h2>
          <span className="config-status-summary">
            {formatNumber(totalLogins)} active logins in range
          </span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Adoption</th>
              <th>Active logins</th>
            </tr>
          </thead>
          <tbody>
            {adoptionBySchool.map((row) => (
              <tr key={row.school}>
                <td>{row.school}</td>
                <td>
                  <div className="bar-cell">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${row.adoption}%` }} />
                    </div>
                    <span>{row.adoption}%</span>
                  </div>
                </td>
                <td>{formatNumber(row.activeLogins)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TODO: adoption and login counts need a real Admin DB usage contract. */}
        <FreshnessStamp
          asOf="2026-07-31T13:02:00-04:00"
          source="admin_db"
          cadence="Immediate on write"
        />
      </div>

      <div className="admin-content-panel">
        <h2>Last successful sync per integration</h2>
        <div className="sync-list">
          {lastSyncByIntegration.map((item) => (
            <div className="sync-row" key={item.integration}>
              <span className="sync-name">{item.integration}</span>
              <FreshnessStamp asOf={item.asOf} source={item.source} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
