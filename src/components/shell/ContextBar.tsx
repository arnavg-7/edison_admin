import { ADMIN_ROLE_LABEL } from "@/lib/nav";
import { formatSalesforceStamp } from "@/lib/format";
import { SALESFORCE_LAST_REFRESH } from "@/lib/data/salesforce";

/**
 * The strip above the canvas, mirroring the reference dashboards' context line:
 * when Salesforce last refreshed, and who you're viewing as.
 */
export function ContextBar() {
  return (
    <div className="sf-context-bar">
      <span>As of {formatSalesforceStamp(SALESFORCE_LAST_REFRESH)}</span>
      <span className="sf-context-sep">·</span>
      <span>Viewing as {ADMIN_ROLE_LABEL}</span>
    </div>
  );
}
