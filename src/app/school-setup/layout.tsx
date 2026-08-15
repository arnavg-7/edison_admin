import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Drill-down", href: "/school-setup" },
  { label: "Columns", href: "/school-setup/columns" }
];

/**
 * District → School → Grade → Batch: the hierarchy every other screen filters
 * by. Schools and grades arrive with the Genesis roster; batches are configured
 * here, and they are the level students actually enrol into.
 *
 * Two ways through the same tree, as real routes rather than a local view toggle:
 * the selected node lives in the query string (see school-setup-selection), and
 * SectionTabs carries the query across, so switching tabs keeps you on the grade
 * you were looking at and a link to either view still lands where it says.
 */
export default function SchoolSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="sf-main">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-page-title">School Master Setup</h1>
          <p className="sf-page-sub">
            The district structure Edison360 reports against — schools, the grades they run,
            and the batches students are enrolled into.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
        {children}
      </Suspense>
    </section>
  );
}
