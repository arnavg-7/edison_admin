"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ROLE_LABEL, SECTIONS } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import { Button } from "@/components/base/buttons/button";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <div className="sf-brand">
          <div className="sf-brand-head group-data-[collapsible=icon]:justify-center">
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="sf-brand-name">Edison360 Admin</div>
              <div className="sf-brand-role">{ADMIN_ROLE_LABEL}</div>
            </div>
            <SidebarTrigger />
          </div>
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
                    {/* The shadcn default is rounded-lg, which resolves to 10px
                        here and left the active nav pill noticeably squarer than
                        every other control on screen — theme.css puts both
                        --sf-radius-control and --sf-radius-cta at 20px. Reading
                        the token rather than hardcoding keeps the nav in step if
                        that value moves again. */}
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={section.label}
                      className="rounded-(--sf-radius-control)"
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
        <Button color="tertiary" size="sm" className="w-full justify-start">
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </Button>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
