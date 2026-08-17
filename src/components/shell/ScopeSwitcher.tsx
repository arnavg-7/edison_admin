"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminScope, type AdminScope } from "@/lib/admin-scope";
import { schools } from "@/lib/data/schools";
import { SCOPED_SECTIONS, sectionHref } from "@/lib/nav";
import { Combobox } from "@/components/shared/Combobox";

const DISTRICT = "district";

/**
 * Who you are administering as: the district, or one school.
 *
 * A switcher rather than a filter, and in the sidebar footer rather than on a
 * screen, because it changes what the whole portal is — the nav links, the
 * pickers, the level the drill-downs start at — not what one table shows.
 *
 * TODO: real scope comes from the signed-in user's record. This control is here
 * so both views can be demonstrated from one session, and goes when auth lands;
 * the label says as much rather than passing it off as an account menu.
 */
export function ScopeSwitcher() {
  const { scope, schoolId, setScope } = useAdminScope();
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { value: DISTRICT, label: "Super Admin · All schools" },
    ...schools.map((school) => ({ value: school.id, label: `School Admin · ${school.name}` }))
  ];

  const change = (value: string) => {
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
          options={options}
          value={schoolId ?? DISTRICT}
          onChange={change}
          ariaLabel="Administer the district or one school"
        />
      </label>

      {/* Says plainly what this is. Without it the control reads as a real
          account menu, and the difference matters to anyone reviewing it. */}
      <p className="sf-scope-switcher-note">
        Demo control &mdash; real access comes from your account.
      </p>

      {scope.kind === "school" ? (
        <p className="sf-scope-switcher-note">
          Screens below are limited to this school. Other schools are not listed.
        </p>
      ) : null}
    </div>
  );
}
