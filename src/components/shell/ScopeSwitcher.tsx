"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ADMIN_PERSONAS,
  useAdminScope,
  type AdminPersona,
  type AdminScope
} from "@/lib/admin-scope";
import { schools } from "@/lib/data/schools";
import { SCOPED_SECTIONS } from "@/lib/nav";
import { Combobox } from "@/components/shared/Combobox";

const DISTRICT = "district";

/** The one line under the switcher that says what this persona may do. */
const ACCESS_NOTE: Record<AdminPersona, string> = {
  "super-admin": "Every section, full read and write.",
  leadership:
    "Reporting & Analytics only, read-only. No configuration, goals, alerts or settings.",
  "portal-admin":
    "Full read and write on the sections listed. No reporting, no user management or audit logs."
};

/**
 * Who you are administering as: which job, and over which schools.
 *
 * Two controls rather than one list, because they are two questions. A
 * superintendent and a principal do the same job at different scopes; so do the
 * district's Super Admin and one school's. Crossed into a single dropdown that
 * is a row per combination, several of which mean nothing.
 *
 * In the sidebar footer rather than on a screen, because between them they
 * change what the whole portal is — which sections exist, what the pickers ask,
 * the level the drill-downs start at — not what one table shows.
 *
 * TODO: real persona and scope come from the signed-in user's record. This
 * control is here so every view can be demonstrated from one session, and goes
 * when auth lands; the label says as much rather than passing it off as an
 * account menu.
 */
export function ScopeSwitcher() {
  const { scope, schoolId, setScope, persona, setPersona } = useAdminScope();
  const router = useRouter();
  const pathname = usePathname();

  const personaOptions = ADMIN_PERSONAS.map((entry) => ({
    value: entry.value,
    label: entry.label
  }));

  /* No role prefix on these any more — the control above says which job, this
     one only says how much of the district. */
  const scopeOptions = [
    { value: DISTRICT, label: "All schools" },
    ...schools.map((school) => ({ value: school.id, label: school.name }))
  ];

  const changeScope = (value: string) => {
    const next: AdminScope =
      value === DISTRICT ? { kind: "district" } : { kind: "school", schoolId: value };
    setScope(next);

    /* Leaving you where you were would often mean a page the new scope has no
       business showing — another school's grade, or a school picker a school
       admin never sees. Land on the same section, at the level the new scope
       starts from. */
    const section = SCOPED_SECTIONS.find((entry) => pathname.startsWith(entry.href));
    if (section) {
      const target = next.kind === "school" ? `${section.href}/${next.schoolId}` : section.href;
      if (target !== pathname) router.push(target);
    }
  };

  return (
    <div className="sf-scope-switcher group-data-[collapsible=icon]:hidden">
      <label className="sf-field">
        <span>Signed in as</span>
        <Combobox
          options={personaOptions}
          value={persona}
          onChange={(next) => setPersona(next as AdminPersona)}
          ariaLabel="The job you are signed in to do"
        />
      </label>

      {/* Switching to a persona that cannot reach where you stand is handled by
          PersonaGate, not here: the same thing has to happen on a typed URL. */}
      <label className="sf-field">
        <span>Administering</span>
        <Combobox
          options={scopeOptions}
          value={schoolId ?? DISTRICT}
          onChange={changeScope}
          ariaLabel="The district, or one school"
        />
      </label>

      {/* Says plainly what this is. Without it the control reads as a real
          account menu, and the difference matters to anyone reviewing it. */}
      <p className="sf-scope-switcher-note">
        Demo control &mdash; real access comes from your account.
      </p>

      <p className="sf-scope-switcher-note">{ACCESS_NOTE[persona]}</p>

      {scope.kind === "school" ? (
        <p className="sf-scope-switcher-note">
          Screens below are limited to this school. Other schools are not listed.
        </p>
      ) : null}
    </div>
  );
}
