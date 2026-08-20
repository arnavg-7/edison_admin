"use client";

import Link from "next/link";
import { people } from "@/lib/data/people";
import { schools } from "@/lib/data/schools";
import { useAdminScope } from "@/lib/admin-scope";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * How many faculty are on the faculty portal.
 *
 * Not an access screen. Faculty hold no role here — they have their own portal,
 * their accounts arrive with the Genesis roster, and nothing on this side
 * grants or removes them. What an admin needs from this side is the count: who
 * is provisioned, at which school, and who has actually signed in — which is
 * the difference between a roster load and adoption.
 *
 * So there is nothing to edit on this page, and no invite. A faculty member
 * missing from here is missing from Genesis, and that is where it gets fixed.
 */
export default function FacultyAccountsPage() {
  const { school } = useAdminScope();

  const faculty = people.filter(
    (person) => person.kind === "faculty" && (!school || person.school === school.name)
  );

  const signedIn = faculty.filter((person) => person.lastLogin !== null);
  const active = faculty.filter((person) => person.active);

  /* Per school, so a district admin sees where the gaps are rather than one
     number covering five schools. A school admin sees their own row only. */
  const bySchool = (school ? [school] : schools).map((entry) => {
    const roll = faculty.filter((person) => person.school === entry.name);
    return {
      id: entry.id,
      name: entry.name,
      total: roll.length,
      signedIn: roll.filter((person) => person.lastLogin !== null).length
    };
  });

  return (
    <>
      <p className="sf-card-hint">
        Faculty accounts come from the Genesis roster and are used on the faculty portal, not this
        one. They hold no admin role, so there is nothing to grant here — this is the count, and
        how much of it is being used.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>On the faculty portal</h2>
          <span className="sf-panel-note">
            {school ? school.name : "District-wide"} · synced from Genesis
          </span>
        </div>

        <dl className="sf-stat-row">
          <div>
            <dt>Faculty accounts</dt>
            <dd>{faculty.length}</dd>
          </div>
          <div>
            <dt>Signed in at least once</dt>
            <dd>{signedIn.length}</dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd>{active.length}</dd>
          </div>
        </dl>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>By school</h2>
          <span className="sf-panel-note">Provisioned against signed in</span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">School</th>
                <th scope="col">Faculty accounts</th>
                <th scope="col">Signed in</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {bySchool.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.total}</td>
                  <td>{row.signedIn}</td>
                  <td>
                    {row.total === 0 ? (
                      <StatusBadge tone="error">None synced</StatusBadge>
                    ) : row.signedIn === row.total ? (
                      <StatusBadge tone="ok">All signed in</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">{row.total - row.signedIn} never signed in</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Faculty</h2>
          <span className="sf-panel-note">{faculty.length} accounts</span>
        </div>

        {faculty.length === 0 ? (
          <EmptyState
            title="No faculty synced"
            message="Nothing has arrived from the Genesis roster for this scope. Faculty accounts are created by that sync, not on this screen."
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">School</th>
                  <th scope="col">Department</th>
                  <th scope="col">Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((person) => (
                  <tr key={person.id}>
                    <td>
                      {/* Their record lives on Student & Faculty 360, which is
                          where anything about the person is answered. */}
                      <Link className="sf-bar-group-link" href={`/people/faculty/${person.id}`}>
                        {person.name}
                      </Link>
                    </td>
                    <td>{person.school}</td>
                    <td>{person.group}</td>
                    <td>
                      {person.lastLogin ? (
                        formatDateTime(person.lastLogin)
                      ) : (
                        <StatusBadge tone="warn">Never</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
