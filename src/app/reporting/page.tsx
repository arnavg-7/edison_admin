"use client";

import { useReportFilters } from "@/lib/filters";
import { coreMetricsForScope, drillRowsForScope, trendSeriesForMetric } from "@/lib/data/reporting";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { NoAttendanceData } from "@/components/shared/EmptyState";
import { ScopeBreadcrumb } from "@/components/reporting/ScopeBreadcrumb";
import { Sparkline } from "@/components/reporting/Sparkline";

export default function CoreMetricsPage() {
  const { filters, setFilters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade, section: filters.section };
  const metrics = coreMetricsForScope(scope);
  const { level, rows } = drillRowsForScope(scope);

  const canDrill = !filters.section;

  const drillInto = (id: string) => {
    if (!filters.school) {
      setFilters({ school: id });
    } else if (!filters.grade) {
      setFilters({ grade: id });
    } else {
      setFilters({ section: id });
    }
  };

  return (
    <>
      <ScopeBreadcrumb />

      <div className="metric-strip">
        {metrics.map((metric) => (
          <article className="metric-tile" key={metric.id}>
            <p className="metric-tile-label">{metric.label}</p>
            <h3 className="metric-tile-value">{metric.value}</h3>
            {metric.trend ? (
              <p className={`metric-tile-trend is-${metric.trend.direction}`}>
                {metric.trend.direction === "up" ? "▲" : "▼"} {metric.trend.delta}
              </p>
            ) : null}
            <div className={`sparkline-wrap tone-${metric.source}`}>
              <Sparkline
                points={trendSeriesForMetric(metric.id, scope)}
                label={`${metric.label} trend`}
              />
            </div>
            <FreshnessStamp asOf={metric.asOf} source={metric.source} cadence={metric.cadence} />
          </article>
        ))}
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Breakdown by {level.toLowerCase()}</h2>
          {canDrill ? (
            <span className="sf-panel-note">Select a row to drill down</span>
          ) : (
            <span className="sf-panel-note">Class level — deepest available</span>
          )}
        </div>

        {rows.length === 0 ? (
          <NoAttendanceData scope="the selected scope" />
        ) : (
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">{level}</th>
                <th scope="col">Attendance</th>
                <th scope="col">Assignments</th>
                <th scope="col">Goals on track</th>
                <th scope="col">Students</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {canDrill ? (
                      <button
                        type="button"
                        className="table-drill-link"
                        onClick={() => drillInto(row.id)}
                      >
                        {row.name}
                      </button>
                    ) : (
                      row.name
                    )}
                  </td>
                  <td>{row.attendance.toFixed(1)}%</td>
                  <td>{row.assignments.toFixed(1)}%</td>
                  <td>{row.goals.toFixed(1)}%</td>
                  <td>{row.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
