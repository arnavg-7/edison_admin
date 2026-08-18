/**
 * Goals are one screen now, so there is no school → grade trail to carry — the
 * board states its own scope through its filters. The breadcrumb and the client
 * pathname parsing that fed it both went with the drill-down.
 */
export default function AcademicGoalsLayout({ children }: { children: React.ReactNode }) {
  return <section className="sf-main">{children}</section>;
}
