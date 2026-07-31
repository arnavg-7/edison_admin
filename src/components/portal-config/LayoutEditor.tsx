"use client";

import { useState } from "react";
import { layoutSettings, type SchoolLevel } from "@/lib/data/portalConfig";
import { StatusBadge } from "@/components/shared/StatusBadge";

/** Layout & branding editor plus its completion-status indicator. */
export function LayoutEditor({ level }: { level: SchoolLevel }) {
  const [settings, setSettings] = useState(layoutSettings[level]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const configured = settings.filter((setting) => setting.configured).length;
  const complete = configured === settings.length;

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setDraft(value === "Not set" ? "" : value);
  };

  const save = (id: string) => {
    setSettings((current) =>
      current.map((setting) =>
        setting.id === id
          ? {
              ...setting,
              value: draft.trim() || "Not set",
              configured: draft.trim().length > 0
            }
          : setting
      )
    );
    setEditingId(null);
  };

  return (
    <div className="admin-content-panel">
      <div className="home-panel-head">
        <h2>{level === "HS" ? "High school" : "Kindergarten"} layout &amp; branding</h2>
        <StatusBadge tone={complete ? "ok" : "warn"}>
          {configured} of {settings.length} configured
        </StatusBadge>
      </div>

      <div className="setting-list">
        {settings.map((setting) => (
          <div className="setting-row" key={setting.id}>
            <div className="setting-main">
              <div className="setting-label">{setting.label}</div>
              {editingId === setting.id ? (
                <input
                  className="setting-input"
                  value={draft}
                  autoFocus
                  placeholder={`Set ${setting.label.toLowerCase()}`}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") save(setting.id);
                    if (event.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <div className={setting.configured ? "setting-value" : "setting-value is-unset"}>
                  {setting.value}
                </div>
              )}
            </div>

            <div className="setting-actions">
              {!setting.configured && editingId !== setting.id ? (
                <StatusBadge tone="warn">Missing</StatusBadge>
              ) : null}
              {editingId === setting.id ? (
                <>
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => save(setting.id)}>
                    Save
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => startEdit(setting.id, setting.value)}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
