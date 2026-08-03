# Edison 360 Admin — open items & placeholders (v2)

Everything in this app renders real screens over **mock data**. This file is the single list of
what is deliberate, what is a placeholder, and what needs input from outside the codebase.
Individual `// TODO:` comments in the source point back here.

Built to **Build Brief v2** — single Super Admin role, Salesforce as the unified data source, plus
Needs Attention and Student & Faculty 360. The theme is **light**, on request: the Lightning
Analytics card/anatomy structure is kept, but on light surfaces with a purplish blue reserved for
CTAs, links, active nav and focus.

Last reviewed: 2026-08-03

---

## 1. Blocking questions — need an answer before this can be trusted

| Item | What's needed | Where |
|---|---|---|
| **Salesforce API pattern** | Reports API vs. Analytics REST vs. a SOQL layer. Affects every screen. The registry is shaped for named saved reports with per-report refresh times; if that's wrong, `salesforce.ts` is the only module that changes. | `src/lib/data/salesforce.ts` |
| **Refresh cadence & on-demand refresh** | Whether Admin may trigger a Salesforce refresh or only display cached state. The refresh control on every metric card is deliberately inert until this is settled, and the Salesforce API panel says so on screen. | `MetricCard.tsx`, `/integrations/salesforce` |
| **"View Report" destination** | Whether the card footer link should deep-link into Salesforce or an Admin-native report view. Currently points in-app. | `MetricCard.tsx` |
| **At-risk thresholds** | The real rules for chronic absence, missed goal checkpoints, and sustained low well-being. Current rules are invented and the Needs Attention screen carries a visible warning saying so. | `src/lib/data/needsAttention.ts` |
| **360 editable-field list** | Confirmation of what may be edited in Admin. Only internal notes and flags are writable; every other tab is read-only with a link out. **Do not widen this without asking.** | `src/components/people/ProfileShell.tsx` |
| **Well-Being & Events source objects** | These are new data domains. The Salesforce objects/fields behind "logged feeling" and event participation are unknown — figures are transcribed from the reference dashboards, not a schema. | `src/lib/data/dashboard.ts` |
| **Academic term dates** | The real calendar. "This Term" in the reporting filter resolves against invented boundaries. | `src/lib/data/academicCalendar.ts` |
| **Genesis failure taxonomy** | The real file-arrival cutoff and what counts as partial vs. missing vs. validation error. | `src/lib/data/integrations.ts` |
| **Salesforce org URL** | `View in Salesforce` links are built against a placeholder instance URL. | `src/lib/data/people.ts` |

---

## 2. Confirmed scope decisions

| Decision | Status |
|---|---|
| **Single Super Admin role** | v2. All ten sections visible to everyone; no persona gating. The v1 permission model (`SECTION_ACCESS`, `SectionGuard`, `RoleSwitcher`) was deleted, not left inert. |
| **Portal Configuration renamed to Skills & Development** | Renamed 2026-08-03, and restructured from level tabs to a school → grade drill-down. Content is now per-grade, not per school level. |
| **Kindergarten removed** | Removed on request 2026-08-03: the Edison Kindergarten Center school, its faculty record, seeded skills/development content, System Settings grade-level entry, and its Needs Attention item are all gone. Genesis now lists four schools, not five. |
| **Skills & Development seeds HS only** | Narrowed from HS/KG to HS-only following the Kindergarten removal above. All four remaining Genesis schools appear in the picker, but ES/MS grades open empty and say so on the screen. The editors still work there — adding content is a scope extension. |
| **HS/KG layout & branding editors removed** | Removed on request 2026-07-31. Named in the v1 inventory, so restoring them is a scope change. |
| **Faculty Dashboard component toggles removed** | Removed on request 2026-08-03, resolving the earlier ambiguous "remove the Schedule strip" note — the whole screen went, not just that one row. Named in the inventory, so restoring it is a scope change. |
| **Alerts & Resources built to simple scope** | Alert rules + notification templates; CRUD over external links. No rules engine, escalation, categorization or access control. |
| **System Settings merged** | One tab set — grade levels, subjects, calendar, announcements, users, audit log. |
| **Reporting goes to individual level** | v2 reverses v1's class ceiling. Student Attendance links to Student 360, faculty names to Faculty 360. The v1 "no individual profiles" labels were removed as false. |
| **The Module filter is gone** | It was an inert single-option control on the two former Portal Config screens. The school/grade drill-down replaced the filter bar those screens carried, so it went with them. |

### Still unanswered from the inventory

Whether drill-down in the new metrics should stop at class level now that 360 exists. Student
Progress and Faculty Class Performance are carried forward unchanged, with links out to 360.

---

## 3. Data: nothing is live

No Salesforce connection, no Genesis/OneRoster ingestion, no Classroom/Calendar client, no Admin DB.
There is also no Salesforce CLI or credential on the build machine, so the org could not be
inspected to resolve field names.

| Domain | Mock module |
|---|---|
| Salesforce report registry & API health | `data/salesforce.ts` |
| Dashboard metric figures (from the reference screenshots) | `data/dashboard.ts` |
| Needs Attention queue | `data/needsAttention.ts` |
| People / 360 profiles | `data/people.ts` |
| Upstream feed status | `data/integrations.ts` |
| Portal config, goals, alerts, resources, system settings | `data/portalConfig.ts`, `academicGoals.ts`, `alerts.ts`, `resources.ts`, `systemSettings.ts` |

All data is dated against a single reference "today" of **17 Jul 2026, 12:12 pm**, matching the
reference dashboards. Earlier v1 data sat on 31 Jul, which meant two different "todays" in one app
and made the combined sync log silently drop entries outside its window.

---

## 4. Nothing persists

Every write is React state: development areas, skills, alert rules, resources, grade levels,
announcements, user roles, triage resolve, and 360 notes/flags. All gone on refresh. 360 notes and
flags are Admin-native and are **not** written back to Salesforce.

There is no authentication. The sidebar shows a fixed Super Admin context.

---

## 5. Modeled gaps that are real

- **Homeroom mapping** — Genesis has homeroom courses for 1 of 4 schools and zero enrollments
  anywhere. Drives the `awaiting data from Genesis` empty state and appears in Needs Attention. It
  also shows as "Awaiting Genesis data" on individual 360 profiles.
- **Attendance** is covered by a synthetic dataset matching the OneRoster schema, so
  "no attendance data yet" is a graceful fallback that should rarely appear.

---

## 6. Accessibility

Contrast has been re-derived from scratch for each theme change (light -> dark -> light); ratios
validated against one palette say nothing about the next. Each screen is audited against computed
backgrounds at the WCAG AA threshold (4.5:1 normal, 3:1 large). Notable decisions in the light
theme:

- **Bar value labels sit outside the fill.** No single ink colour cleared 4.5:1 on every series
  while the palette stayed light, and darkening each fill until white worked would have defeated
  the point of a light theme. Outside labels are dark text on the card, so they always pass.
- Funnel and donut labels, which must sit on the fill, pick ink per series via a declared list of
  light series rather than assuming white everywhere.
- The violet series was softened from `#6f4ed6` to `#7a5ddb`; it appeared in most charts and
  dominated the page.

Keyboard focus rings, a skip link, `aria-current` on nav/tabs, and `scope="col"` on table headers
are in place. Not covered: screen-reader testing with real AT.
