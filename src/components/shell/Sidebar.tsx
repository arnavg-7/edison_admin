"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ROLE_LABEL, SECTIONS } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <div className="sf-brand">
          <div className="sf-brand-name group-data-[collapsible=icon]:hidden">Edison360 Admin</div>
          <div className="sf-brand-role group-data-[collapsible=icon]:hidden">{ADMIN_ROLE_LABEL}</div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECTIONS.map((section) => {
                const isActive =
                  section.href === "/" ? pathname === "/" : pathname.startsWith(section.href);

                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={section.label}
                      render={<Link href={section.href} aria-current={isActive ? "page" : undefined} />}
                    >
                      <NavIcon name={section.id} />
                      <span>{section.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <button className="sf-btn sf-btn--quiet sf-btn--block" type="button">
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </button>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
