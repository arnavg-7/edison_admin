"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/role/RoleContext";
import { ROLE_LABELS, sectionsForRole } from "@/lib/role/roles";
import { NavIcon } from "./NavIcon";
import { RoleSwitcher } from "./RoleSwitcher";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const sections = sectionsForRole(role);

  return (
    <aside className="admin-sidebar">
      <div>
        <div className="admin-profile">
          <div className="admin-brand">Edison360</div>
          <p>{ROLE_LABELS[role]}</p>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {sections.map((section) => {
            const isActive =
              section.href === "/" ? pathname === "/" : pathname.startsWith(section.href);
            return (
              <Link
                key={section.id}
                href={section.href}
                className={isActive ? "admin-nav-item active" : "admin-nav-item"}
              >
                <span className="admin-nav-icon" aria-hidden>
                  <NavIcon name={section.id} />
                </span>
                <span className="admin-nav-label">{section.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <RoleSwitcher />
        <button className="admin-logout" type="button">
          <span aria-hidden>
            <NavIcon name="logout" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
