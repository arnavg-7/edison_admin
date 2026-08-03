"use client";

import { alertRules } from "@/lib/data/alerts";
import { ListEditor } from "@/components/shared/ListEditor";

export default function AlertRulesPage() {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Alert rules</h2>
      </div>

      <ListEditor
        items={alertRules}
        addLabel="Add rule"
        emptyTitle="No alert rules yet"
        emptyMessage="Add a rule to start flagging students who need attention."
      />
    </div>
  );
}
