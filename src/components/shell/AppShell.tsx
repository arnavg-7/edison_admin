"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ScrollReset } from "./ScrollReset";
import { SessionGate } from "./SessionGate";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * The portal's chrome, and the one screen that goes without it.
 *
 * An invitation is opened from an email by somebody who has no session yet.
 * Framing it in the sidebar would surround "here is what you are being granted"
 * with whichever account this browser last signed in as — a nav they do not
 * have, next to an offer they have not accepted.
 *
 * Decided here rather than by moving every route into a `(portal)` group: the
 * root layout has to hold the providers either way, and one pathname test is a
 * smaller thing to keep true than twenty-eight relocated files.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/invite")) {
    return <div id="main-content">{children}</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="sf-main-region">
        <div id="main-content">{children}</div>
      </SidebarInset>
      <ScrollReset />
      <SessionGate />
    </SidebarProvider>
  );
}
