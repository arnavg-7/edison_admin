"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SectionTab = {
  label: string;
  href: string;
};

/**
 * Sub-navigation within a section. Carries the current query string across tab
 * changes so the Reporting global filter bar survives navigation.
 *
 * Each tab is a real route, not a client-side panel switch, so the Tab renders
 * as a Link via Base UI's `render` prop — Tabs.Root just supplies the active
 * state and ARIA wiring, current-route matching (not internal state) decides
 * which tab that is.
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const activeHref = tabs.find((tab) => tab.href === pathname)?.href ?? null;

  return (
    <Tabs value={activeHref} className="sf-section-tabs">
      <TabsList variant="line" aria-label="Section navigation">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            nativeButton={false}
            render={<Link href={query ? `${tab.href}?${query}` : tab.href} />}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
