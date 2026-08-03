"use client";

import { resourceGroups } from "@/lib/data/resources";
import { ListEditor } from "@/components/shared/ListEditor";

/**
 * Simple committed scope: CRUD over external links, grouped by category with a
 * last-updated date. No access control or curriculum alignment.
 */
export default function ResourcesPage() {
  const total = resourceGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
      <section className="sf-main">
        <h1>Resources &amp; Content</h1>
        <p className="sf-page-sub">
          External links surfaced in the student and faculty portals. {total} resources across{" "}
          {resourceGroups.length} categories.
        </p>

        {resourceGroups.map((group) => (
          <div className="sf-panel" key={group.category}>
            <div className="sf-panel-head">
              <h2>{group.category}</h2>
            </div>

            <ListEditor
              items={group.items}
              addLabel="Add resource"
              fields={[
                { name: "title", label: "Name", placeholder: "Resource name" },
                { name: "detail", label: "URL", placeholder: "https://" }
              ]}
              emptyTitle="No resources in this category"
              emptyMessage="Add a link to surface it in the portals."
            />
          </div>
        ))}
      </section>
  );
}
