"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ROLE_LABEL, SECTIONS } from "@/lib/nav";
import { NavIcon } from "./NavIcon";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sf-sidebar">
      <div className="sf-brand">
        <div className="sf-brand-name">Edison360 Admin</div>
        <div className="sf-brand-role">{ADMIN_ROLE_LABEL}</div>
      </div>

      <nav className="sf-nav" aria-label="Sections">
        {SECTIONS.map((section) => {
          const isActive =
            section.href === "/" ? pathname === "/" : pathname.startsWith(section.href);

          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "sf-nav-item active" : "sf-nav-item"}
            >
              <span className="sf-nav-icon" aria-hidden>
                <NavIcon name={section.id} />
              </span>
              <span>{section.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sf-sidebar-foot">
        <button className="sf-btn sf-btn--quiet sf-btn--block" type="button">
          Log out
        </button>
      </div>
    </aside>
  );
}
