"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type SectionTab = {
  label: string;
  href: string;
};

/**
 * Sub-navigation within a section. Carries the current query string across tab
 * changes so the Reporting global filter bar survives navigation.
 */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="section-tabs" aria-label="Section navigation">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={query ? `${tab.href}?${query}` : tab.href}
            className={isActive ? "section-tab active" : "section-tab"}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
