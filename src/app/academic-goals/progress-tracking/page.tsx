"use client";

import { useState } from "react";
import { progressTracking } from "@/lib/data/academicGoals";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { formatNumber } from "@/lib/format";

export default function ProgressTrackingPage() {
  const [facultyEnabled, setFacultyEnabled] = useState(progressTracking.facultyEnabled);
  const [studentEnabled, setStudentEnabled] = useState(progressTracking.studentEnabled);

  const percentUpdated = Math.round(
    (progressTracking.updatedLast30Days / progressTracking.activeGoals) * 100
  );

  return (
    <>
      <div className="sf-panel">
        <h2>Progress tracking</h2>

        <div className="setting-list">
          <div className="setting-row">
            <div className="setting-main">
              <div className="setting-label">Faculty progress updates</div>
              <div className="setting-value">
                Let faculty record progress against student goals.
              </div>
            </div>
            <div className="setting-actions">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={facultyEnabled}
                  onChange={() => setFacultyEnabled((value) => !value)}
                />
                <span>{facultyEnabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-main">
              <div className="setting-label">Student progress updates</div>
              <div className="setting-value">
                Let students update progress on their own goals.
              </div>
            </div>
            <div className="setting-actions">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={studentEnabled}
                  onChange={() => setStudentEnabled((value) => !value)}
                />
                <span>{studentEnabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="sf-panel">
        <h2>Goal activity</h2>
        <div className="home-panel-stats">
          <div>
            <dt>Active goals</dt>
            <dd>{formatNumber(progressTracking.activeGoals)}</dd>
          </div>
          <div>
            <dt>Updated in last 30 days</dt>
            <dd>{formatNumber(progressTracking.updatedLast30Days)}</dd>
          </div>
          <div>
            <dt>Share updated</dt>
            <dd>{percentUpdated}%</dd>
          </div>
        </div>

        <FreshnessStamp
          asOf={progressTracking.asOf}
          source="admin_db"
          cadence="Immediate on status change"
        />
      </div>
    </>
  );
}
