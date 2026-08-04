"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";

export type ListEditorItem = {
  id: string;
  title: string;
  detail: string;
  /** Optional right-hand pill, e.g. Active / Draft. */
  status?: { tone: "ok" | "warn" | "error" | "neutral"; label: string };
  meta?: string;
};

export type ListEditorField = {
  name: "title" | "detail";
  label: string;
  placeholder: string;
  multiline?: boolean;
};

const DEFAULT_FIELDS: ListEditorField[] = [
  { name: "title", label: "Name", placeholder: "Name" },
  { name: "detail", label: "Description", placeholder: "Description", multiline: true }
];

/**
 * Generic add/edit/delete list used by the CRUD-shaped configuration screens
 * (goal templates, goal categories, alert rules, notification templates,
 * resources, grade levels, subjects, announcements).
 *
 * TODO: writes are local state only — wire to the Admin DB once its contract
 * exists. Nothing here persists across a refresh.
 */
export function ListEditor({
  heading,
  items: initialItems,
  addLabel = "Add item",
  fields = DEFAULT_FIELDS,
  emptyTitle = "Nothing configured yet",
  emptyMessage = "Add the first entry to get started."
}: {
  /** Panel heading shown beside the add button, so the two share one row
      instead of the heading sitting alone above a right-aligned button. */
  heading: string;
  items: ListEditorItem[];
  addLabel?: string;
  fields?: ListEditorField[];
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", detail: "" });

  const startAdd = () => {
    setDraft({ title: "", detail: "" });
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (item: ListEditorItem) => {
    setDraft({ title: item.title, detail: item.detail });
    setIsAdding(false);
    setEditingId(item.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const save = () => {
    if (!draft.title.trim()) {
      return;
    }

    if (isAdding) {
      setItems((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          title: draft.title.trim(),
          detail: draft.detail.trim(),
          status: { tone: "neutral", label: "Draft" }
        }
      ]);
    } else if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, title: draft.title.trim(), detail: draft.detail.trim() }
            : item
        )
      );
    }

    cancel();
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      cancel();
    }
  };

  const form = (
    <div className="list-editor-form">
      {fields.map((field) => (
        <label key={field.name} className="sf-field">
          <span>{field.label}</span>
          {field.multiline ? (
            <textarea
              rows={2}
              value={draft[field.name]}
              placeholder={field.placeholder}
              onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })}
            />
          ) : (
            <input
              type="text"
              value={draft[field.name]}
              placeholder={field.placeholder}
              onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })}
            />
          )}
        </label>
      ))}
      <div className="list-editor-form-actions">
        <Button onClick={save}>Save</Button>
        <button type="button" className="sf-btn" onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="list-editor">
      <div className="sf-panel-head">
        <h2>{heading}</h2>
        <Button onClick={startAdd}>{addLabel}</Button>
      </div>

      {isAdding ? form : null}

      {items.length === 0 && !isAdding ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <div className="list-editor-items">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id}>{form}</div>
            ) : (
              <div className="list-editor-item" key={item.id}>
                <div className="list-editor-item-main">
                  <div className="list-editor-item-title">
                    {item.title}
                    {/* Status sits with the title, not with Edit/Delete: it
                        describes the item rather than being something to press. */}
                    {item.status ? (
                      <StatusBadge tone={item.status.tone}>{item.status.label}</StatusBadge>
                    ) : null}
                  </div>
                  <div className="list-editor-item-detail">{item.detail}</div>
                  {item.meta ? <div className="list-editor-item-meta">{item.meta}</div> : null}
                </div>
                <div className="list-editor-item-actions">
                  <button type="button" className="sf-btn sf-btn--sm" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="sf-btn sf-btn--sm sf-btn--danger"
                    onClick={() => remove(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
