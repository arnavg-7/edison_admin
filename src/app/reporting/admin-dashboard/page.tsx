"use client";

import { adoptionBySchool, lastSyncByIntegration } from "@/lib/data/reporting";
import { REPORTS } from "@/lib/data/salesforce";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";

export default function AdminDashboardPage() {
  const totalLogins = adoptionBySchool.reduce((sum, row) => sum + row.activeLogins, 0);

  return (
    <>
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Portal adoption by school</h2>
          <span className="sf-panel-note">
            {formatNumber(totalLogins)} active logins in range
          </span>
        </div>

        <table className="sf-table">
          <thead>
            <tr>
              <th scope="col">School</th>
              <th scope="col">Adoption</th>
              <th scope="col">Active logins</th>
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
          asOf={REPORTS.numberOfStudents.asOf}
          report="Portal Adoption"
          note="Usage rollup"
        />
      </div>

      <div className="sf-panel">
        <h2>Last successful sync per integration</h2>
        {/* These are genuinely upstream sync times, not Salesforce report
            refreshes, so they aren't rendered as report stamps — naming the
            report here would misattribute them. */}
        <div className="sync-list">
          {lastSyncByIntegration.map((item) => (
            <div className="sync-row" key={item.integration}>
              <span className="sync-name">{item.integration}</span>
              <span className="sf-card-stamp">Last sync {formatSalesforceStamp(item.asOf)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
