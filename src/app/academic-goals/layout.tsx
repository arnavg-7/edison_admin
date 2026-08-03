/**
 * Goal setting is the main admin function here, so the section is a
 * school → grade drill-down rather than sibling tabs (2026-08-03). Goal
 * templates and categories still exist as reference data, offered as
 * options when an admin sets a goal for a grade.
 */
export default function AcademicGoalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="sf-main">
      <h1>Academic Goals</h1>
      <p className="sf-page-sub">
        Goals set for students, configured per grade. Pick a school, then a grade.
      </p>

      {children}
    </section>
  );
}
