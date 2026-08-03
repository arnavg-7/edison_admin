/**
 * The section tab bar is gone: sub-screens are now a school → grade drill-down
 * rather than sibling tabs, and the two editors are tabbed inside a grade.
 */
export default function SkillsDevelopmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="sf-main">
      <h1>Skills &amp; Development</h1>
      <p className="sf-page-sub">
        Development areas and skills profiles shown in the student and faculty portals, configured
        per grade. Pick a school, then a grade.
      </p>

      {children}
    </section>
  );
}
