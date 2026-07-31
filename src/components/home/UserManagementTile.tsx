import Link from "next/link";
import { userSummary } from "@/lib/data/users";
import { ROLE_LABELS } from "@/lib/role/roles";
import { formatDateTime, formatNumber } from "@/lib/format";

export function UserManagementTile() {
  return (
    <section className="home-panel">
      <div className="home-panel-head">
        <h2>User management</h2>
      </div>

      <dl className="home-panel-stats">
        <div>
          <dt>Total users</dt>
          <dd>{formatNumber(userSummary.totalUsers)}</dd>
        </div>
        <div>
          <dt>Pending provisioning</dt>
          <dd>{userSummary.pendingProvisioning}</dd>
        </div>
        <div>
          <dt>Recent access changes</dt>
          <dd>{userSummary.recentAccessChanges}</dd>
        </div>
      </dl>

      <div className="home-role-counts">
        {userSummary.byRole.map((entry) => (
          <span key={entry.role}>
            {ROLE_LABELS[entry.role]}: <strong>{entry.count}</strong>
          </span>
        ))}
      </div>

      <p className="home-panel-foot">Data as of {formatDateTime(userSummary.asOf)} · Admin DB</p>
      <Link className="home-panel-link" href="/system-settings">
        Manage users
      </Link>
    </section>
  );
}
