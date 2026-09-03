"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminScope, type AdminScope } from "@/lib/admin-scope";
import { schools } from "@/lib/data/schools";
import { SCOPED_SECTIONS } from "@/lib/nav";
import { Combobox } from "@/components/shared/Combobox";

const DISTRICT = "district";

/**
 * Which schools you are administering — which is the whole difference between
 * the two roles.
 *
 * One control, not two. A Super Admin and a School Admin do the same job at
 * different reaches, so picking a school here is exactly what a School Admin's
 * account grants them: the same portal, every section, limited to that school.
 * Nothing else needs choosing, which is why the persona dropdown that used to
 * sit above this is gone.
 *
 * In the sidebar footer rather than on a screen, because it changes what the
 * whole portal is — what the pickers ask, the level the drill-downs start at,
 * which rows the tables hold — not what one table shows.
 *
 * TODO: real scope comes from the signed-in user's record. This control is here
 * so both reaches can be shown from one session, and goes when auth lands; the
 * label says as much rather than passing it off as an account menu.
 */
export function ScopeSwitcher() {
  const { scope, school, schoolId, setScope, roleLabel } = useAdminScope();
  const router = useRouter();
  const pathname = usePathname();

  const scopeOptions = [
    { value: DISTRICT, label: "All schools" },
    ...schools.map((entry) => ({ value: entry.id, label: entry.name }))
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
        <span>Administering</span>
        <Combobox
          options={scopeOptions}
          value={schoolId ?? DISTRICT}
          onChange={changeScope}
          ariaLabel="Every school, or one school"
        />
      </label>

      {/* Says plainly what this is. Without it the control reads as a real
          account menu, and the difference matters to anyone reviewing it. */}
      <p className="sf-scope-switcher-note">
        Demo control &mdash; real access comes from your account.
      </p>

      {/* The role this reach is, so the switcher explains itself: picking a
          school is what being a School Admin for it looks like. */}
      <p className="sf-scope-switcher-note">
        {scope.kind === "school"
          ? `${roleLabel} for ${school?.name ?? "this school"}. Every section, limited to it — other schools are not listed.`
          : `${roleLabel}. Every section, every school.`}
      </p>
    </div>
  );
}
