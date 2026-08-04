"use client";

import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
/* Hugeicons has no "notification + plus" glyph, and the section itself is
   already marked by Notification01Icon in the nav — so the CTA carries the
   action (create) rather than repeating the object. */
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Button } from "@/components/base/buttons/button";

const TABS = [
  { label: "Alerts", href: "/alerts" },
  { label: "Alert History", href: "/alerts/history" }
];

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">Alerts &amp; Notifications</h1>
          <p className="sf-page-sub">Current alerts raised for students, by school and grade.</p>
        </div>

        {pathname === "/alerts" ? (
          <Button
            size="sm"
            onClick={() => router.push("/alerts?create=1")}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
          >
            Create Alert
          </Button>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
        {children}
      </Suspense>
    </section>
  );
}
