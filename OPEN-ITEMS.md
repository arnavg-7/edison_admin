# Edison 360 Admin — open items & placeholders

Everything in this app renders real screens over **mock data**. This file is the single
list of what is deliberate, what is a placeholder, and what needs input from outside the
codebase. Individual `// TODO:` comments in the source point back here.

Last reviewed: 2026-07-31

---

## 1. Confirmed scope decisions

These are settled. Changing them is a scope change, not filling a gap.

| Decision | Status |
|---|---|
| **Portal Configuration covers HS and KG only** | Confirmed. ES/MS have no development-areas or skills-profile screens. Stated on the Portal Configuration screen so the absence reads as intentional. |
| **HS/KG layout & branding editors removed** | Removed on request 2026-07-31. The screen inventory lists them under Portal Configuration, so re-adding them is a scope change, not a gap. Development Areas is now the section's landing screen. |
| **Alerts & Notifications = alert rules + notification templates only** | Confirmed simple scope. No rules engine, escalation policies, or distribution config. |
| **Resources & Content = CRUD over external links** | Confirmed simple scope. No categorization taxonomy, access control, or curriculum alignment. |
| **Reporting drill-down stops at class level** | Confirmed. No individual student or faculty profile pages. |
| **The Module filter on Development Areas / Skills Profile is inert** | Confirmed retained. The screen inventory specifies it, but each screen is its own single module, so there is nothing to switch between yet. Do not "fix" or remove it. |

### UX deviation from the brief

Commented at the source and easy to reverse:

- **IT admin landing on `/system-settings` redirects to User Management** rather than showing a
  permission message on Grade Levels, which is the Portal admin's default tab.

Previously Leadership had no Home nav item, because the inventory defined their Home as an
immediate redirect into Reporting. Leadership now has a real Home (`LeadershipHome`) — Platform
Pulse plus entry-point cards for the five reports — so all three roles see Home, matching the
brief. The report cards and the Reporting tab bar both read `REPORT_ENTRIES`, so adding a report
updates both.

---

## 2. Placeholders awaiting external input

These are **invented values** that look plausible and will mislead if trusted.

| Item | What's needed | Where |
|---|---|---|
| **Academic term dates** | Edison's real academic calendar. The "This Term" reporting preset resolves against these, so wrong dates silently produce wrong reports. Flagged on-screen. | `src/lib/data/academicCalendar.ts` |
| **Genesis failure taxonomy** | The real file-arrival cutoff and the definition of partial vs. missing vs. validation-error. Current three states (success / validation errors / not received) are a guess at the shape. | `src/lib/data/integrations.ts` |
| **Persona → role mapping** | Confirmation against a real role structure. No IAM/SSO exists to map onto, so the three brief personas are used as the literal role model. | `src/lib/role/roles.ts` |
| **Display time zone** | The district's configured time zone. Currently pinned to `America/New_York` so server and client render identically. | `src/lib/format.ts` |

---

## 3. No data contracts exist yet

Searched both this repo and `edison_faculty`: there is **no** Genesis/OneRoster ingestion, no
Classroom or Calendar API client, and no Admin DB model anywhere. Every module below is a typed
placeholder whose shape was inferred from the brief and must be reconciled with the real contract.

| Source | Mock module |
|---|---|
| Genesis / OneRoster | `data/schools.ts`, `data/integrations.ts`, attendance figures in `data/metrics.ts` |
| Google Classroom API | `data/integrations.ts`, assignment figures in `data/metrics.ts` |
| Google Calendar API | `data/integrations.ts` |
| Admin DB | `data/academicGoals.ts`, `data/alerts.ts`, `data/resources.ts`, `data/portalConfig.ts`, `data/systemSettings.ts`, `data/users.ts`, `data/configStatus.ts` |
| Reporting rollups | `data/reporting.ts` — values derive from a hash of the current filter scope so drill-down visibly changes them. The *shape* is real; the numbers are not. |

---

## 4. Nothing persists

All writes are React state. Adding a resource, creating a development area, toggling a dashboard
component, or changing a user's role works for the session and is gone on refresh. `ListEditor`
and `DevelopmentAreasEditor` carry the main TODOs. Wire to the Admin DB when its contract lands.

The role switcher in the sidebar stands in for authentication and should be removed once SSO
exists.

---

## 5. Modeled gaps that are real

Not placeholders — these reflect actual production problems and should keep working as designed:

- **Homeroom mapping**: Genesis has homeroom courses for 1 of 5 schools and zero homeroom
  enrollments anywhere. Drives the `AwaitingGenesisData` empty state, which is worded to make
  clear this is a source-data gap rather than an ingest failure.
- **Attendance** is covered by a synthetic dataset matching the OneRoster schema, so
  `NoAttendanceData` is a graceful fallback that should rarely appear rather than an expected state.
