"use client";

import { resourceGroups } from "@/lib/data/resources";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { ListEditor } from "@/components/shared/ListEditor";

/**
 * Simple committed scope: CRUD over external links, grouped by category with a
 * last-updated date. No access control or curriculum alignment.
 */
export default function ResourcesPage() {
  const total = resourceGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <SectionGuard section="resources">
      <section className="admin-main">
        <h1>Resources &amp; Content</h1>
        <p className="admin-subtitle">
          External links surfaced in the student and faculty portals. {total} resources across{" "}
          {resourceGroups.length} categories.
        </p>

        {resourceGroups.map((group) => (
          <div className="admin-content-panel" key={group.category}>
            <div className="home-panel-head">
              <h2>{group.category}</h2>
              <span className="config-status-summary">{group.items.length} resources</span>
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
    </SectionGuard>
  );
}
