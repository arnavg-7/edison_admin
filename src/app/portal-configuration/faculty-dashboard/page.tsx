"use client";

import { useState } from "react";
import { facultyDashboardComponents } from "@/lib/data/portalConfig";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function FacultyDashboardConfigPage() {
  const [components, setComponents] = useState(facultyDashboardComponents);
  const enabled = components.filter((component) => component.enabled).length;

  const toggle = (id: string) => {
    setComponents((current) =>
      current.map((component) =>
        component.id === id ? { ...component, enabled: !component.enabled } : component
      )
    );
  };

  return (
    <div className="admin-content-panel">
      <div className="home-panel-head">
        <h2>Faculty dashboard components</h2>
        <StatusBadge tone="neutral">
          {enabled} of {components.length} enabled
        </StatusBadge>
      </div>

      <div className="setting-list">
        {components.map((component) => (
          <div className="setting-row" key={component.id}>
            <div className="setting-main">
              <div className="setting-label">{component.label}</div>
              <div className="setting-value">{component.description}</div>
            </div>
            <div className="setting-actions">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={component.enabled}
                  onChange={() => toggle(component.id)}
                />
                <span>{component.enabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
